import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../shared/services/event-bus.service';
import { laterOf, pageBySince } from './integration-cursor';
import { ActivityNotFoundException } from './scholar.error';
import type {
  CreateActivityBodyType,
  IntegrationQueryType,
  ListActivitiesQueryType,
  UpdateActivityBodyType,
} from './scholar.model';

/**
 * Hoạt động KHCN khác — Bảng 3 của Phụ lục 2, 65 trên tổng 106 mã.
 *
 * Bảng 3 tính giờ CỐ ĐỊNH CHO MỖI NGƯỜI, KHÔNG chia theo số người. `level` và
 * `role` chỉ để hiển thị; giờ quy đổi lấy theo `catalogCode`.
 *
 * ĐỒNG THỰC HIỆN (giải thưởng, đồng hướng dẫn): một người khai, gắn tên người
 * cùng làm; mỗi người TỰ xác nhận thì mới được ghi nhận bên mình, và vì Bảng 3
 * khoán trọn nên mỗi người hưởng TRỌN số giờ — không chia. Người khai (chủ) được
 * tính khi hồ sơ mình được duyệt, KHÔNG chờ người kia xác nhận; người được gắn
 * thì phải tự xác nhận + tự nộp minh chứng + được Khoa duyệt riêng.
 */
const hoTen = (
  u?: { firstName: string | null; lastName: string | null } | null,
) => [u?.lastName, u?.firstName].filter(Boolean).join(' ');

const MEMBER_INCLUDE = {
  members: {
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.ScienceActivityInclude;

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
  ) {}

  /** Gộp danh sách thành viên về hình dạng gọn cho giao diện. */
  private shape(row: {
    members?: Array<{
      id: string;
      userId: string;
      role: string | null;
      claimStatus: 'CONFIRMED' | 'PENDING' | 'REJECTED';
      invitedBy: string | null;
      user?: { firstName: string | null; lastName: string | null } | null;
    }>;
    [k: string]: unknown;
  }) {
    const { members = [], ...rest } = row;
    return {
      ...rest,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        claimStatus: m.claimStatus,
        invitedBy: m.invitedBy,
        displayName: hoTen(m.user),
      })),
    };
  }

  async list(userId: string, query: ListActivitiesQueryType) {
    const where: Prisma.ScienceActivityWhereInput = {
      userId,
      deletedAt: null,
      ...(query.year ? { year: query.year } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { organizer: { contains: query.q, mode: 'insensitive' } },
              { decisionNo: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.scienceActivity.findMany({
        where,
        include: MEMBER_INCLUDE,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.scienceActivity.count({ where }),
    ]);
    return { items: items.map((r) => this.shape(r)), total };
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.scienceActivity.findFirst({
      where: { id, userId, deletedAt: null },
      include: MEMBER_INCLUDE,
    });
    if (!row) throw ActivityNotFoundException;
    return this.shape(row);
  }

  async create(userId: string, body: CreateActivityBodyType) {
    const { members, ...data } = body;
    const row = await this.prisma.scienceActivity.create({
      data: { ...data, userId },
    });
    await this.moiThanhVien(row.id, userId, members ?? []);
    this.bus.emit('activity.changed', { id: row.id, userIds: [userId] });
    return this.findOne(row.id, userId);
  }

  async update(userId: string, id: string, body: UpdateActivityBodyType) {
    const { members, ...data } = body;
    // Lọc theo `userId` ngay trong điều kiện: hoạt động là của người khai, không
    // có đường nào để người khác sửa dữ kiện.
    const done = await this.prisma.scienceActivity.updateMany({
      where: { id, userId, deletedAt: null },
      data,
    });
    if (!done.count) throw ActivityNotFoundException;
    if (members !== undefined) await this.dongBoThanhVien(id, userId, members);
    this.bus.emit('activity.changed', { id, userIds: [userId] });
    return this.findOne(id, userId);
  }

  /** Xoá mềm — kênh tích hợp còn phải báo `removed` cho bên đã nhận trước đó. */
  async remove(userId: string, id: string) {
    const done = await this.prisma.scienceActivity.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!done.count) throw ActivityNotFoundException;
    this.bus.emit('activity.changed', { id, userIds: [userId] });
    return { removed: true };
  }

  /** Gắn tên đồng thực hiện → họ ở PENDING cho tới khi tự xác nhận. */
  private async moiThanhVien(
    activityId: string,
    invitedBy: string,
    people: Array<{ userId: string; role?: string | null }>,
  ) {
    const theoId = new Map(
      people
        .filter((p) => p.userId && p.userId !== invitedBy)
        .map((p) => [p.userId, p]),
    );
    if (!theoId.size) return;
    await this.prisma.scienceActivityMember.createMany({
      data: [...theoId.values()].map((p) => ({
        activityId,
        userId: p.userId,
        role: p.role ?? null,
        invitedBy,
        claimStatus: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Sửa danh sách đồng thực hiện: thêm người mới, gỡ người bị bỏ, GIỮ NGUYÊN
   * trạng thái xác nhận của người đã có (đừng bắt họ xác nhận lại chỉ vì chủ mở
   * ra sửa một trường khác).
   */
  private async dongBoThanhVien(
    activityId: string,
    invitedBy: string,
    people: Array<{ userId: string; role?: string | null }>,
  ) {
    const muon = new Map(
      people
        .filter((p) => p.userId && p.userId !== invitedBy)
        .map((p) => [p.userId, p]),
    );
    const dangCo = await this.prisma.scienceActivityMember.findMany({
      where: { activityId },
      select: { userId: true },
    });
    const coRoi = new Set(dangCo.map((m) => m.userId));

    const themMoi = [...muon.values()].filter((p) => !coRoi.has(p.userId));
    if (themMoi.length) {
      await this.prisma.scienceActivityMember.createMany({
        data: themMoi.map((p) => ({
          activityId,
          userId: p.userId,
          role: p.role ?? null,
          invitedBy,
          claimStatus: 'PENDING' as const,
        })),
        skipDuplicates: true,
      });
    }

    const boDi = [...coRoi].filter((uid) => !muon.has(uid));
    if (boDi.length) {
      await this.prisma.scienceActivityMember.deleteMany({
        where: { activityId, userId: { in: boDi } },
      });
    }
  }

  /** Lời mời đồng thực hiện đang chờ chính người được gắn xác nhận. */
  async pendingClaims(userId: string) {
    const rows = await this.prisma.scienceActivityMember.findMany({
      where: { userId, claimStatus: 'PENDING', activity: { deletedAt: null } },
      include: {
        activity: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((m) => ({
        id: m.id,
        activityId: m.activityId,
        title: m.activity.title,
        catalogCode: m.activity.catalogCode,
        role: m.role,
        year: m.activity.year,
        ownerName: hoTen(m.activity.user),
        invitedBy: m.invitedBy,
      })),
    };
  }

  /** Người được gắn xác nhận (hoặc từ chối) tham gia. */
  async respondClaim(userId: string, activityId: string, accept: boolean) {
    const done = await this.prisma.scienceActivityMember.updateMany({
      where: { activityId, userId, claimStatus: 'PENDING' },
      data: {
        claimStatus: accept ? 'CONFIRMED' : 'REJECTED',
        respondedAt: new Date(),
      },
    });
    if (!done.count) throw ActivityNotFoundException;
    this.bus.emit('activity.changed', { id: activityId, userIds: [userId] });
    return { ok: true };
  }

  /** Xem chú thích ở `ScholarService.integrationList` — cùng một giao kèo. */
  async integrationList(query: IntegrationQueryType) {
    const { since } = query;
    const emailLc = query.email?.toLowerCase();
    const years =
      query.from || query.to
        ? {
            year: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {};

    const rows = await this.prisma.scienceActivity.findMany({
      where: {
        ...years,
        ...(since ? { updatedAt: { gte: since } } : { deletedAt: null }),
        // Lọc theo một người: khớp nếu họ là CHỦ hoặc là đồng thực hiện đã xác
        // nhận. Chế độ ảnh chụp chỉ tính người đã xác nhận; chế độ `since` lấy cả
        // để còn báo `removed` khi họ rút xác nhận.
        ...(emailLc
          ? {
              OR: [
                { user: { email: emailLc } },
                {
                  members: {
                    some: {
                      user: { email: emailLc },
                      ...(since ? {} : { claimStatus: 'CONFIRMED' as const }),
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { email: true } },
        members: { include: { user: { select: { email: true } } } },
      },
      orderBy: { year: 'desc' },
    });

    const base = (r: (typeof rows)[number]) => ({
      activityId: r.id,
      catalogCode: r.catalogCode,
      title: r.title,
      level: r.level,
      role: r.role,
      organizer: r.organizer,
      decisionNo: r.decisionNo,
      year: r.year,
      month: r.month,
    });

    // MỖI NGƯỜI MỘT DÒNG. Bảng 3 khoán trọn cho từng người nên không có mẫu số
    // để chia; mỗi dòng mang email của chính người đó, và ACADsoom khoá theo
    // (activityId, email) nên hai người cùng một hoạt động không đè nhau.
    const out: Array<{ changedAt: Date; item: Record<string, unknown> }> = [];
    for (const r of rows) {
      out.push({
        changedAt: r.updatedAt,
        item: {
          ...base(r),
          email: r.user?.email ?? null,
          removed: r.deletedAt !== null,
        },
      });
      for (const m of r.members) {
        const confirmed = m.claimStatus === 'CONFIRMED';
        // Ảnh chụp: chỉ người đã xác nhận. `since`: gửi cả người chưa/thôi xác
        // nhận, kèm `removed` để bên nhận gỡ.
        if (!since && !confirmed) continue;
        out.push({
          changedAt: laterOf(r.updatedAt, m.updatedAt),
          item: {
            ...base(r),
            email: m.user?.email ?? null,
            removed: r.deletedAt !== null || !confirmed,
          },
        });
      }
    }

    const filtered = emailLc
      ? out.filter((o) => String(o.item.email ?? '').toLowerCase() === emailLc)
      : out;

    if (!since) return { items: filtered.map((m) => m.item) };
    return pageBySince(filtered, query.limit);
  }
}
