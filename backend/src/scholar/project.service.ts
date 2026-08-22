import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotAProjectMemberException,
  ProjectNotFoundException,
} from './scholar.error';
import type {
  CreateProjectBodyType,
  ListProjectsQueryType,
  UpdateProjectBodyType,
} from './scholar.model';

/**
 * Đề tài, dự án NCKH — Bảng 2 của Phụ lục 2.
 *
 * Cùng ba nguyên tắc như phần công bố, và vì cùng lý do:
 *
 *   · Một đề tài là MỘT dòng dùng chung cho cả nhóm. Để mỗi người khai một bản
 *     thì thống kê Khoa đếm nhiều lần.
 *   · Chủ nhiệm gắn tên thành viên vào, thành viên phải TỰ xác nhận — giờ NCKH
 *     là quyền lợi của từng người.
 *   · Web Khoa chỉ giữ DỮ KIỆN (cấp đề tài, kinh phí, số tháng, vai trò). Việc
 *     nhân ra giờ theo công thức `base + rate × kinh phí / per` rồi chia đều cho
 *     từng tháng là của ACADsoom.
 *
 * Mã Bảng 2 do CHỦ NHIỆM tự chọn. Hệ thống không suy cấp đề tài từ kinh phí:
 * cùng một mức tiền có thể là ĐHQG loại B, cấp Bộ, hay quỹ tài trợ — đoán sai là
 * lệch hàng nghìn giờ.
 */
@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  private get memberInclude() {
    return {
      members: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { role: 'asc' as const },
      },
    };
  }

  /** BigInt không đi qua JSON được — đổi sang số ngay ở tầng này. */
  private shape(row: any, userId: string) {
    const mine = row.members.find((m: any) => m.userId === userId);
    return {
      ...row,
      budget: row.budget === null ? null : Number(row.budget),
      isClassified: Boolean(row.catalogCode),
      myRole: mine?.role ?? null,
      myClaimStatus: mine?.claimStatus ?? null,
      members: row.members.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        displayName: [m.user?.lastName, m.user?.firstName]
          .filter(Boolean)
          .join(' '),
        email: m.user?.email ?? '',
        role: m.role,
        sharePercent: m.sharePercent,
        claimStatus: m.claimStatus,
        invitedBy: m.invitedBy,
        respondedAt: m.respondedAt,
      })),
    };
  }

  async list(userId: string, query: ListProjectsQueryType) {
    const where: Prisma.ResearchProjectWhereInput = {
      deletedAt: null,
      members: {
        some: {
          userId,
          claimStatus:
            query.filter === 'pending'
              ? 'PENDING'
              : { in: ['CONFIRMED', 'PENDING'] },
        },
      },
      ...(query.status ? { status: query.status } : {}),
      ...(query.filter === 'unclassified' ? { catalogCode: null } : {}),
    };

    const [rows, total, unclassified] = await Promise.all([
      this.prisma.researchProject.findMany({
        where,
        include: this.memberInclude,
        orderBy: [{ startYear: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.researchProject.count({ where }),
      this.prisma.researchProject.count({
        where: {
          deletedAt: null,
          catalogCode: null,
          members: { some: { userId, claimStatus: 'CONFIRMED' } },
        },
      }),
    ]);
    return {
      items: rows.map((r) => this.shape(r, userId)),
      total,
      unclassified,
    };
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.researchProject.findFirst({
      where: { id, deletedAt: null },
      include: this.memberInclude,
    });
    if (!row) throw ProjectNotFoundException;
    return this.shape(row, userId);
  }

  async create(userId: string, body: CreateProjectBodyType) {
    const created = await this.prisma.researchProject.create({
      data: {
        code: body.code ?? null,
        title: body.title,
        catalogCode: body.catalogCode ?? null,
        funder: body.funder ?? null,
        budget:
          body.budget === undefined || body.budget === null
            ? null
            : BigInt(Math.round(body.budget)),
        status: body.status ?? 'ONGOING',
        startYear: body.startYear ?? null,
        startMonth: body.startMonth ?? null,
        endYear: body.endYear ?? null,
        endMonth: body.endMonth ?? null,
        months: body.months ?? null,
        note: body.note ?? null,
        createdBy: userId,
        members: {
          create: {
            userId,
            // Người khai mặc định là chủ nhiệm; đổi được nếu họ chỉ là thành viên.
            role: body.myRole ?? 'LEAD',
            sharePercent: body.mySharePercent ?? null,
            claimStatus: 'CONFIRMED',
            respondedAt: new Date(),
          },
        },
      },
      select: { id: true },
    });
    await this.invite(created.id, userId, body.memberUserIds ?? []);
    return this.findOne(created.id, userId);
  }

  /** Gắn tên đồng nghiệp → họ ở PENDING cho tới khi chính họ đồng ý. */
  private async invite(
    projectId: string,
    invitedBy: string,
    userIds: string[],
  ) {
    const others = [...new Set(userIds)].filter((id) => id && id !== invitedBy);
    if (!others.length) return;
    await this.prisma.projectMember.createMany({
      data: others.map((userId) => ({
        projectId,
        userId,
        invitedBy,
        claimStatus: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });
  }

  async update(userId: string, id: string, body: UpdateProjectBodyType) {
    await this.assertMember(id, userId);
    const cur = await this.prisma.researchProject.findUnique({
      where: { id },
      select: { catalogCode: true },
    });
    if (!cur) throw ProjectNotFoundException;

    await this.prisma.researchProject.update({
      where: { id },
      data: {
        code: body.code === undefined ? undefined : body.code,
        title: body.title ?? undefined,
        catalogCode:
          body.catalogCode === undefined ? undefined : body.catalogCode,
        funder: body.funder === undefined ? undefined : body.funder,
        budget:
          body.budget === undefined
            ? undefined
            : body.budget === null
              ? null
              : BigInt(Math.round(body.budget)),
        status: body.status ?? undefined,
        startYear: body.startYear === undefined ? undefined : body.startYear,
        startMonth: body.startMonth === undefined ? undefined : body.startMonth,
        endYear: body.endYear === undefined ? undefined : body.endYear,
        endMonth: body.endMonth === undefined ? undefined : body.endMonth,
        months: body.months === undefined ? undefined : body.months,
        note: body.note === undefined ? undefined : body.note,
      },
    });

    if (body.myRole || body.mySharePercent !== undefined) {
      await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId: id, userId } },
        data: {
          role: body.myRole ?? undefined,
          sharePercent:
            body.mySharePercent === undefined ? undefined : body.mySharePercent,
        },
      });
    }
    if (body.memberUserIds) await this.invite(id, userId, body.memberUserIds);
    return this.findOne(id, userId);
  }

  /** Gỡ tên mình; đề tài không còn ai xác nhận thì xoá mềm cả dòng. */
  async remove(userId: string, id: string) {
    await this.assertMember(id, userId);
    const others = await this.prisma.projectMember.count({
      where: {
        projectId: id,
        claimStatus: 'CONFIRMED',
        userId: { not: userId },
      },
    });
    if (others > 0) {
      await this.prisma.projectMember.updateMany({
        where: { projectId: id, userId },
        data: { claimStatus: 'REJECTED', respondedAt: new Date() },
      });
    } else {
      await this.prisma.researchProject.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }
    return { removed: true, sharedWithOthers: others > 0 };
  }

  async pending(userId: string) {
    const rows = await this.prisma.projectMember.findMany({
      where: { userId, claimStatus: 'PENDING', project: { deletedAt: null } },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            code: true,
            funder: true,
            startYear: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const inviterIds = [
      ...new Set(rows.map((r) => r.invitedBy).filter(Boolean)),
    ];
    const inviters = await this.prisma.user.findMany({
      where: { id: { in: inviterIds as string[] } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameOf = new Map(
      inviters.map((u) => [
        u.id,
        [u.lastName, u.firstName].filter(Boolean).join(' '),
      ]),
    );
    return rows.map((r) => ({
      projectId: r.project.id,
      title: r.project.title,
      code: r.project.code,
      funder: r.project.funder,
      year: r.project.startYear,
      invitedBy: r.invitedBy,
      invitedByName: r.invitedBy ? (nameOf.get(r.invitedBy) ?? null) : null,
    }));
  }

  async respond(
    userId: string,
    projectId: string,
    accept: boolean,
    role?: 'LEAD' | 'SECRETARY' | 'MEMBER',
  ) {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });
    if (!row) throw NotAProjectMemberException;
    await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: {
        claimStatus: accept ? 'CONFIRMED' : 'REJECTED',
        respondedAt: new Date(),
        role: accept ? (role ?? undefined) : undefined,
      },
    });
    return this.findOne(projectId, userId);
  }

  private async assertMember(projectId: string, userId: string) {
    const m = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { claimStatus: true },
    });
    if (!m || m.claimStatus !== 'CONFIRMED') throw NotAProjectMemberException;
  }

  // ── API tích hợp cho ACADsoom ─────────────────────────────────────────────
  /**
   * Chỉ trả đề tài ĐÃ CHỌN MÃ và thành viên ĐÃ XÁC NHẬN. Không trả giờ — hệ số
   * `base + rate × kinh phí / per` và việc chia đều theo tháng là của ACADsoom.
   */
  async integrationList(email?: string, from?: number, to?: number) {
    const rows = await this.prisma.projectMember.findMany({
      where: {
        claimStatus: 'CONFIRMED',
        ...(email ? { user: { email: email.toLowerCase() } } : {}),
        project: {
          deletedAt: null,
          catalogCode: { not: null },
          ...(from || to
            ? {
                startYear: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
      },
      include: { project: true, user: { select: { email: true } } },
    });

    return {
      items: rows.map((r) => ({
        projectId: r.project.id,
        code: r.project.code,
        title: r.project.title,
        catalogCode: r.project.catalogCode as string,
        funder: r.project.funder,
        budget: r.project.budget === null ? null : Number(r.project.budget),
        status: r.project.status,
        startYear: r.project.startYear,
        startMonth: r.project.startMonth,
        endYear: r.project.endYear,
        endMonth: r.project.endMonth,
        months: r.project.months,
        role: r.role,
        isLead: r.role === 'LEAD',
        sharePercent: r.sharePercent,
      })),
    };
  }
}
