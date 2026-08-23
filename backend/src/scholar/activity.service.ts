import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../shared/services/event-bus.service';
import { pageBySince } from './integration-cursor';
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
 * Đơn giản hơn hẳn công bố và đề tài, và đó là chủ ý chứ không phải làm tắt:
 * Bảng 3 tính giờ CỐ ĐỊNH CHO MỘT NGƯỜI, không chia theo số tác giả. Vì vậy
 *
 *   • không có mời / xác nhận đồng sở hữu — hai người cùng ngồi một hội đồng là
 *     hai bản ghi độc lập, mỗi người hưởng trọn phần của mình;
 *   • không có `totalAuthors` / `schoolAuthors` / `sharePercent`;
 *   • không có giai đoạn "chưa phân loại" — người khai chọn mã ngay từ danh
 *     sách, nên một bản ghi không mã chẳng có lý do gì để tồn tại.
 *
 * `level` và `role` chỉ để hiển thị và đối soát. Giờ quy đổi lấy theo
 * `catalogCode`, vốn đã gói sẵn cả cấp lẫn vai trò (VD `B3-1b3` = hội đồng đánh
 * giá thuyết minh cấp Nhà nước, phản biện, 40 giờ).
 */
@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
  ) {}

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
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.scienceActivity.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.scienceActivity.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!row) throw ActivityNotFoundException;
    return row;
  }

  async create(userId: string, body: CreateActivityBodyType) {
    const row = await this.prisma.scienceActivity.create({
      data: { ...body, userId },
    });
    this.bus.emit('activity.changed', { id: row.id, userIds: [userId] });
    return row;
  }

  async update(userId: string, id: string, body: UpdateActivityBodyType) {
    // Lọc theo `userId` ngay trong điều kiện chứ không đọc rồi mới so: hoạt động
    // là của riêng một người, không có đường nào để người khác sửa được.
    const done = await this.prisma.scienceActivity.updateMany({
      where: { id, userId, deletedAt: null },
      data: body,
    });
    if (!done.count) throw ActivityNotFoundException;
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

  /** Xem chú thích ở `ScholarService.integrationList` — cùng một giao kèo. */
  async integrationList(query: IntegrationQueryType) {
    const { since } = query;
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
        ...(query.email ? { user: { email: query.email.toLowerCase() } } : {}),
        ...years,
        // Chế độ quét lại phải lấy CẢ bản đã xoá, nếu không bên nhận không có
        // đường nào biết mà bỏ đi.
        ...(since ? { updatedAt: { gte: since } } : { deletedAt: null }),
      },
      include: { user: { select: { email: true } } },
      orderBy: { year: 'desc' },
    });

    const mapped = rows.map((r) => ({
      // Không có bản ghi cha như cặp (bài, tác giả) nên mốc đổi chỉ là của chính
      // bản ghi này — không phải lấy cái muộn hơn giữa hai mốc.
      changedAt: r.updatedAt,
      item: {
        activityId: r.id,
        catalogCode: r.catalogCode,
        title: r.title,
        level: r.level,
        role: r.role,
        organizer: r.organizer,
        decisionNo: r.decisionNo,
        year: r.year,
        month: r.month,
        email: r.user?.email ?? null,
        removed: r.deletedAt !== null,
      },
    }));

    if (!since) return { items: mapped.map((m) => m.item) };
    return pageBySince(mapped, query.limit);
  }
}
