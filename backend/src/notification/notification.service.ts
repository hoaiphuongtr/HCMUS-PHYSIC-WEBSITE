import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FACULTY_DEPT_ID } from '../shared/helpers';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, limit = 30) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, channel: 'IN_APP' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          link: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({
        where: { userId, channel: 'IN_APP', isRead: false },
      }),
    ]);
    return { items, unread };
  }

  async unreadCount(userId: string) {
    const unread = await this.prisma.notification.count({
      where: { userId, channel: 'IN_APP', isRead: false },
    });
    return { unread };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  // Fan-out an in-app notification to a set of users (best-effort; never throws
  // into the publish path).
  async notify(
    userIds: string[],
    data: { title: string; message: string; link?: string | null },
  ) {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    if (!unique.length) return;
    try {
      await this.prisma.notification.createMany({
        data: unique.map((userId) => ({
          userId,
          title: data.title,
          message: data.message,
          link: data.link ?? null,
          channel: 'IN_APP' as const,
        })),
      });
    } catch {
      // notifications are non-critical; swallow so publish still succeeds
    }
  }

  // Recipients for a published item: all super-admins + admins of the item's
  // department (faculty/untagged content → faculty-office admins). Excludes the
  // actor so people aren't notified of their own action.
  async recipientsForDepartment(
    departmentId: string | null,
    excludeUserId?: string,
  ): Promise<string[]> {
    const deptFilter =
      !departmentId || departmentId === FACULTY_DEPT_ID
        ? { departmentId: FACULTY_DEPT_ID }
        : { departmentId };
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ role: 'SUPER_ADMIN' as const }, deptFilter],
      },
      select: { id: true },
    });
    return users.map((u) => u.id).filter((id) => id !== excludeUserId);
  }

  // Convenience used by publish flows.
  async notifyPublished(params: {
    departmentId: string | null;
    actorId: string;
    title: string;
    slug: string;
  }) {
    const recipients = await this.recipientsForDepartment(
      params.departmentId,
      params.actorId,
    );
    await this.notify(recipients, {
      title: 'Nội dung mới được xuất bản',
      message: params.title,
      link: `/${params.slug}`,
    });
  }
}
