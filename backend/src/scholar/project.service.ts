import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../shared/services/event-bus.service';
import { laterOf, pageBySince } from './integration-cursor';
import {
  NotAProjectMemberException,
  ProjectNotFoundException,
  ShareOverflowException,
} from './scholar.error';
import type {
  CreateProjectBodyType,
  IntegrationQueryType,
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
/**
 * Số tháng thực hiện, suy từ hai mốc — bao gồm cả tháng đầu và tháng cuối.
 *
 * Phụ lục 2 tr. 2.7 chia đều giờ của đề tài cho TỪNG THÁNG thực hiện, nên con số
 * này là mẫu số của mọi phép chia theo năm học. Để người dùng gõ tay một ô riêng
 * bên cạnh ngày bắt đầu và ngày kết thúc là mời sai lệch: sửa ngày kết thúc mà
 * quên sửa số tháng thì giờ của mọi thành viên, mọi năm đều lệch mà không ai
 * thấy. Có đủ hai mốc thì suy ra; thiếu mốc mới dùng giá trị nhập tay.
 */
export function soThang(
  startYear?: number | null,
  startMonth?: number | null,
  endYear?: number | null,
  endMonth?: number | null,
): number | null {
  if (!startYear || !startMonth || !endYear || !endMonth) return null;
  const dau = startYear * 12 + (startMonth - 1);
  const cuoi = endYear * 12 + (endMonth - 1);
  if (cuoi < dau) return null;
  return cuoi - dau + 1;
}

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
  ) {}

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
      mySharePercent: mine?.sharePercent ?? null,
      myShowOnWeb: mine?.showOnWeb ?? true,
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
        decisionNo: body.decisionNo ?? null,
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
        months:
          soThang(
            body.startYear,
            body.startMonth,
            body.endYear,
            body.endMonth,
          ) ??
          body.months ??
          null,
        note: body.note ?? null,
        createdBy: userId,
        members: {
          create: {
            userId,
            // Người khai mặc định là chủ nhiệm; đổi được nếu họ chỉ là thành viên.
            role: body.myRole ?? 'LEAD',
            sharePercent: body.mySharePercent ?? null,
            showOnWeb: body.myShowOnWeb ?? true,
            claimStatus: 'CONFIRMED',
            respondedAt: new Date(),
          },
        },
      },
      select: { id: true },
    });
    await this.invite(created.id, userId, body.memberUserIds ?? []);
    this.bus.emit('project.changed', {
      id: created.id,
      userIds: [userId, ...(body.memberUserIds ?? [])],
    });
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
      select: {
        catalogCode: true,
        startYear: true,
        startMonth: true,
        endYear: true,
        endMonth: true,
      },
    });
    if (!cur) throw ProjectNotFoundException;

    // Suy số tháng theo mốc SAU khi cập nhật, không phải theo mốc gửi lên: người
    // dùng có thể chỉ sửa ngày kết thúc, và mốc bắt đầu vẫn phải lấy từ bản ghi.
    const moc = {
      startYear: body.startYear === undefined ? cur.startYear : body.startYear,
      startMonth:
        body.startMonth === undefined ? cur.startMonth : body.startMonth,
      endYear: body.endYear === undefined ? cur.endYear : body.endYear,
      endMonth: body.endMonth === undefined ? cur.endMonth : body.endMonth,
    };
    const thangSuyRa = soThang(
      moc.startYear,
      moc.startMonth,
      moc.endYear,
      moc.endMonth,
    );

    await this.prisma.researchProject.update({
      where: { id },
      data: {
        code: body.code === undefined ? undefined : body.code,
        decisionNo: body.decisionNo === undefined ? undefined : body.decisionNo,
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
        months:
          thangSuyRa ?? (body.months === undefined ? undefined : body.months),
        note: body.note === undefined ? undefined : body.note,
      },
    });

    if (body.mySharePercent !== undefined && body.mySharePercent !== null) {
      await this.assertShareFits(id, userId, body.mySharePercent);
    }

    if (
      body.myRole ||
      body.mySharePercent !== undefined ||
      body.myShowOnWeb !== undefined
    ) {
      await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId: id, userId } },
        data: {
          role: body.myRole ?? undefined,
          sharePercent:
            body.mySharePercent === undefined ? undefined : body.mySharePercent,
          showOnWeb: body.myShowOnWeb ?? undefined,
        },
      });
    }
    if (body.memberUserIds) await this.invite(id, userId, body.memberUserIds);
    this.bus.emit('project.changed', { id, userIds: [userId] });
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
    this.bus.emit('project.changed', { id, userIds: [userId] });
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

  /**
   * Tổng tỷ lệ chia của các thành viên ĐÃ XÁC NHẬN không được vượt 100%.
   *
   * Phụ lục 2 tr. 2.8: chủ nhiệm nộp một phương án chia số giờ quy đổi CỦA NHIỆM
   * VỤ cho từng thành viên — một chiếc bánh, chia một lần. Không có ràng buộc này
   * thì ba người cùng khai 50% và hệ thống nhận hết, thành 150% giờ của đề tài
   * mà không ai thấy cho tới lúc đối chiếu tổng.
   *
   * Chỉ đếm người đã xác nhận: người còn đang chờ chưa hưởng giờ nào, giữ chỗ cho
   * họ sẽ chặn oan người đang khai thật.
   */
  private async assertShareFits(
    projectId: string,
    userId: string,
    share: number,
  ) {
    const others = await this.prisma.projectMember.findMany({
      where: {
        projectId,
        claimStatus: 'CONFIRMED',
        userId: { not: userId },
        sharePercent: { not: null },
      },
      select: { sharePercent: true },
    });
    const daChia = others.reduce((s, m) => s + (m.sharePercent ?? 0), 0);
    if (daChia + share > 100) throw ShareOverflowException(daChia, share);
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
  /** Xem chú thích ở `ScholarService.integrationList` — cùng một giao kèo. */
  async integrationList(query: IntegrationQueryType) {
    const { since } = query;
    const years =
      query.from || query.to
        ? {
            startYear: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {};

    const rows = await this.prisma.projectMember.findMany({
      where: {
        ...(query.email ? { user: { email: query.email.toLowerCase() } } : {}),
        ...(since
          ? {
              OR: [
                { updatedAt: { gte: since } },
                { project: { updatedAt: { gte: since } } },
              ],
              project: years,
            }
          : {
              claimStatus: 'CONFIRMED',
              project: {
                deletedAt: null,
                catalogCode: { not: null },
                ...years,
              },
            }),
      },
      include: { project: true, user: { select: { email: true } } },
    });

    const mapped = rows.map((r) => {
      const p = r.project;
      return {
        changedAt: laterOf(r.updatedAt, p.updatedAt),
        item: {
          projectId: p.id,
          code: p.code,
          decisionNo: p.decisionNo,
          title: p.title,
          catalogCode: p.catalogCode,
          funder: p.funder,
          budget: p.budget === null ? null : Number(p.budget),
          status: p.status,
          startYear: p.startYear,
          startMonth: p.startMonth,
          endYear: p.endYear,
          endMonth: p.endMonth,
          months: p.months,
          role: r.role,
          isLead: r.role === 'LEAD',
          sharePercent: r.sharePercent,
          email: r.user?.email ?? null,
          removed:
            p.deletedAt !== null ||
            p.catalogCode === null ||
            r.claimStatus !== 'CONFIRMED',
        },
      };
    });

    if (!since) return { items: mapped.map((m) => m.item) };
    return pageBySince(mapped, query.limit);
  }
}
