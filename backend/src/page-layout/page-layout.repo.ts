import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePageLayoutBodyType,
  UpdatePageLayoutBodyType,
  AddWidgetInstanceBodyType,
  UpdateWidgetInstanceBodyType,
} from './page-layout.model';
import {
  InputJsonValue,
  JsonValue,
  NullableJsonNullValueInput,
} from '../generated/prisma/internal/prismaNamespace';
import { PageLayoutVersionStatus } from '../generated/prisma/enums';

const widgetInclude = {
  widget: {
    select: {
      id: true,
      type: true,
      name: true,
      icon: true,
      configSchema: true,
      defaultConfig: true,
    },
  },
} as const;

// Projection for LIST endpoints: every scalar the admin list + public sitemap
// need, but WITHOUT the heavy `puckData`/`publishedPuckData` JSON trees (each
// layout carries ~KB–MB of Puck data; ~1.600 layouts made the unprojected list
// return tens of MB and take ~100s). Detail endpoints (findById/findPublishedBySlug)
// still return the full row.
const listSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isPublished: true,
  publishedAt: true,
  scheduledAt: true,
  sourcePostId: true,
  departmentId: true,
  categoryId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { widgets: true } },
} as const;

@Injectable()
export class PageLayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: CreatePageLayoutBodyType & {
      createdBy: string;
      departmentId?: string | null;
    },
  ) {
    return this.prisma.pageLayout.create({ data });
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.pageLayout.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        widgets: {
          include: widgetInclude,
          orderBy: [{ row: 'asc' }, { order: 'asc' }],
          where: { widget: { isActive: true } },
        },
        // Ảnh bìa bài viết nguồn → dùng làm og:image khi share Facebook (thay ảnh
        // thẻ OG generic bằng đúng ảnh bìa bài).
        sourcePost: { select: { coverUrl: true, coverAlt: true } },
      },
    });
  }

  findAnyPublishedWithSlug(slug: string, excludeId?: string) {
    return this.prisma.pageLayout.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  findConflictBySlugAndStatus(
    slug: string,
    isPublished: boolean,
    excludeId?: string,
  ) {
    return this.prisma.pageLayout.findFirst({
      where: {
        slug,
        isPublished,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true },
    });
  }

  findById(id: string) {
    return this.prisma.pageLayout.findUnique({
      where: { id },
      include: {
        widgets: {
          include: widgetInclude,
          orderBy: [{ row: 'asc' }, { order: 'asc' }],
        },
      },
    });
  }

  findAll() {
    return this.prisma.pageLayout.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: listSelect,
    });
  }

  findOwnedOrPublished(userId: string) {
    return this.prisma.pageLayout.findMany({
      where: {
        deletedAt: null,
        OR: [{ isPublished: true }, { createdBy: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: listSelect,
    });
  }

  async findUserDepartmentId(userId: string): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });
    return u?.departmentId ?? null;
  }

  findAllScoped(where: Record<string, unknown>) {
    return this.prisma.pageLayout.findMany({
      where: { deletedAt: null, ...where } as never,
      orderBy: { createdAt: 'desc' },
      select: listSelect,
    });
  }

  // Soft-deleted layouts within the retention window (the "Đã xoá" tab).
  findTrashed(where: Record<string, unknown>) {
    return this.prisma.pageLayout.findMany({
      where: { deletedAt: { not: null }, ...where } as never,
      orderBy: { deletedAt: 'desc' },
      select: { ...listSelect, deletedAt: true },
    });
  }

  findAllPublished() {
    return this.prisma.pageLayout.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: listSelect,
    });
  }

  // Layouts tagged with a category = selectable "post templates" in the composer.
  findPostTemplates(where: Record<string, unknown>) {
    return this.prisma.pageLayout.findMany({
      where: { categoryId: { not: null }, deletedAt: null, ...where } as never,
      orderBy: { updatedAt: 'desc' },
      select: {
        ...listSelect,
        categoryId: true,
        category: { select: { slug: true, name: true } },
      },
    });
  }

  update(id: string, data: UpdatePageLayoutBodyType) {
    return this.prisma.pageLayout.update({ where: { id }, data });
  }

  // Khi một trang đổi slug, các LINK nội bộ trỏ tới slug cũ (vd link ở Navbar/
  // Header trang chủ, sidebar…) nằm cứng trong puckData của những layout khác →
  // đổi chúng sang slug mới để không 404. Chỉ thay các URL có RANH GIỚI trọn vẹn:
  // "/old" (trọn giá trị) và "/old/" (đường dẫn con) — tránh dính "/old-foo".
  // Trả về slug các layout đã bị sửa để revalidate đúng những trang đó.
  async rewriteSlugReferences(
    oldSlug: string,
    newSlug: string,
  ): Promise<string[]> {
    const oq = `"/${oldSlug}"`;
    const nq = `"/${newSlug}"`;
    const os = `"/${oldSlug}/`;
    const ns = `"/${newSlug}/`;
    const likeQ = `%"/${oldSlug}"%`;
    const likeS = `%"/${oldSlug}/%`;
    const rows = await this.prisma.$queryRaw<Array<{ slug: string }>>`
      UPDATE "PageLayout"
      SET "puckData" = replace(replace("puckData"::text, ${oq}, ${nq}), ${os}, ${ns})::jsonb,
          "publishedPuckData" = CASE WHEN "publishedPuckData" IS NOT NULL
            THEN replace(replace("publishedPuckData"::text, ${oq}, ${nq}), ${os}, ${ns})::jsonb
            ELSE NULL END
      WHERE "deletedAt" IS NULL
        AND ("puckData"::text LIKE ${likeQ} OR "puckData"::text LIKE ${likeS}
          OR "publishedPuckData"::text LIKE ${likeQ} OR "publishedPuckData"::text LIKE ${likeS})
      RETURNING slug;
    `;
    return rows.map((r) => r.slug);
  }

  // Soft delete: hidden from every query but restorable for 30 days
  // (post.service.purgeExpiredTrash hard-deletes it after the window).
  delete(id: string) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async publish(id: string) {
    const layout = await this.prisma.pageLayout.findUnique({
      where: { id },
      select: { puckData: true },
    });
    return this.prisma.pageLayout.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        scheduledAt: null,
        publishedPuckData: layout?.puckData ?? undefined,
      },
    });
  }

  scheduleManyPublish(ids: string[], scheduledAt: Date) {
    return this.prisma.pageLayout.updateMany({
      where: { id: { in: ids } },
      data: { scheduledAt },
    });
  }

  unpublish(id: string) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { isPublished: false, scheduledAt: null },
    });
  }

  findDueForPublish(now: Date) {
    return this.prisma.pageLayout.findMany({
      where: {
        scheduledAt: { not: null, lte: now },
        deletedAt: null,
      },
      select: { id: true },
    });
  }

  addWidgetInstance(pageLayoutId: string, data: AddWidgetInstanceBodyType) {
    return this.prisma.widgetInstance.create({
      data: {
        pageLayoutId,
        widgetId: data.widgetId,
        config: data.config ?? {},
        order: data.order,
        row: data.row ?? 0,
        colSpan: data.colSpan ?? 12,
      },
      include: widgetInclude,
    });
  }

  findWidgetInstance(instanceId: string) {
    return this.prisma.widgetInstance.findUnique({
      where: { id: instanceId },
      include: widgetInclude,
    });
  }

  updateWidgetInstance(instanceId: string, data: UpdateWidgetInstanceBodyType) {
    const { config, ...rest } = data;
    return this.prisma.widgetInstance.update({
      where: { id: instanceId },
      data: {
        ...rest,
        ...(config !== undefined && { config }),
      },
      include: widgetInclude,
    });
  }

  removeWidgetInstance(instanceId: string) {
    return this.prisma.widgetInstance.delete({ where: { id: instanceId } });
  }

  async duplicateWithWidgets(
    original: {
      name: string;
      slug: string;
      description: string | null;
      widgets: Array<{
        widgetId: string;
        config: any;
        order: number;
        row: number;
        colSpan: number;
        isVisible: boolean;
      }>;
    },
    newData: {
      name: string;
      slug: string;
      createdBy: string;
      puckData?: JsonValue | null;
      departmentId?: string | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const layout = await tx.pageLayout.create({
        data: {
          name: newData.name,
          slug: newData.slug,
          description: original.description,
          createdBy: newData.createdBy,
          departmentId: newData.departmentId ?? null,
          // Copy the visual-builder content so the duplicate isn't blank.
          ...(newData.puckData != null
            ? { puckData: newData.puckData as InputJsonValue }
            : {}),
        },
      });
      if (original.widgets.length > 0) {
        await tx.widgetInstance.createMany({
          data: original.widgets.map((w) => ({
            pageLayoutId: layout.id,
            widgetId: w.widgetId,
            config: w.config,
            order: w.order,
            row: w.row,
            colSpan: w.colSpan,
            isVisible: w.isVisible,
          })),
        });
      }
      // Re-fetch INSIDE the transaction (tx) — using the main client here would
      // not see the just-created row (read-your-writes) and returns null, which
      // then fails response serialization (the "Unexpected end of JSON input" the
      // duplicate button hit).
      return tx.pageLayout.findUnique({
        where: { id: layout.id },
        include: {
          widgets: {
            include: widgetInclude,
            orderBy: [{ row: 'asc' }, { order: 'asc' }],
          },
        },
      });
    });
  }

  savePuckData(
    id: string,
    puckData: NullableJsonNullValueInput | InputJsonValue | undefined,
  ) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { puckData },
    });
  }

  async reorderWidgets(pageLayoutId: string, orderedInstanceIds: string[]) {
    await this.prisma.$transaction(
      orderedInstanceIds.map((id, index) =>
        this.prisma.widgetInstance.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
    return this.findById(pageLayoutId);
  }

  listVersions(pageLayoutId: string) {
    return this.prisma.pageLayoutVersion.findMany({
      where: { pageLayoutId },
      orderBy: { versionNumber: 'desc' },
      include: {
        publishedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            position: true,
          },
        },
      },
    });
  }

  findVersion(versionId: string) {
    return this.prisma.pageLayoutVersion.findUnique({
      where: { id: versionId },
      include: {
        publishedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            position: true,
          },
        },
      },
    });
  }

  snapshotPublishedVersion(pageLayoutId: string, publishedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const layout = await tx.pageLayout.findUnique({
        where: { id: pageLayoutId },
        select: {
          name: true,
          slug: true,
          description: true,
          publishedPuckData: true,
          publishedAt: true,
        },
      });
      if (!layout) return null;
      const next = await tx.pageLayoutVersion.aggregate({
        where: { pageLayoutId },
        _max: { versionNumber: true },
      });
      const versionNumber = (next._max.versionNumber ?? 0) + 1;
      await tx.pageLayoutVersion.updateMany({
        where: { pageLayoutId, status: PageLayoutVersionStatus.CURRENT },
        data: { status: PageLayoutVersionStatus.ARCHIVED },
      });
      return tx.pageLayoutVersion.create({
        data: {
          pageLayoutId,
          versionNumber,
          name: layout.name,
          slug: layout.slug,
          description: layout.description,
          puckData:
            (layout.publishedPuckData as InputJsonValue | null | undefined) ??
            undefined,
          status: PageLayoutVersionStatus.CURRENT,
          publishedAt: layout.publishedAt ?? new Date(),
          publishedBy,
        },
        include: {
          publishedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              position: true,
            },
          },
        },
      });
    });
  }

  archiveCurrentVersions(pageLayoutId: string) {
    return this.prisma.pageLayoutVersion.updateMany({
      where: { pageLayoutId, status: PageLayoutVersionStatus.CURRENT },
      data: { status: PageLayoutVersionStatus.ARCHIVED },
    });
  }

  restoreVersionAsDraft(pageLayoutId: string, puckData: JsonValue | null) {
    return this.prisma.pageLayout.update({
      where: { id: pageLayoutId },
      data: {
        puckData: (puckData as InputJsonValue | null | undefined) ?? undefined,
      },
    });
  }
}
