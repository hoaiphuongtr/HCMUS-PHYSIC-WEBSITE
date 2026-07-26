import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { PageLayoutRepository } from '../page-layout/page-layout.repo';
import { slugExistsInStatusException } from '../page-layout/page-layout.error';
import {
  PostNotFoundException,
  PostSlugExistsException,
  TemplateLayoutNotFoundException,
} from './post.error';
import {
  CloneIntoLayoutBodyType,
  LocalizedTextType,
  UpsertPostBodyType,
} from './post.model';
import { injectPostIntoPuckData, PostInjectPayload } from './puck-inject';
import {
  canAccessDepartment,
  departmentScopeWhere,
  FACULTY_DEPT_ID,
  toSlug,
  toSlugPath,
} from '../shared/helpers';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';
import type { JsonValue } from '../generated/prisma/internal/prismaNamespace';

// JsonValue → { vi, en? } payload. Tolerates legacy plain-string field values
// that may slip through during the migration window.
const asLocalized = (
  value: JsonValue | null | undefined,
): LocalizedTextType | null => {
  if (value == null) return null;
  if (typeof value === 'string') return { vi: value };
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const vi = typeof obj.vi === 'string' ? obj.vi : '';
    const en = typeof obj.en === 'string' ? obj.en : undefined;
    if (vi || en) return { vi: vi || en || '', en };
  }
  return null;
};

const viOf = (value: JsonValue | null | undefined): string => {
  const l = asLocalized(value);
  return l ? l.vi || l.en || '' : '';
};

const postInclude = {
  postTags: { include: { tag: true } },
  layouts: {
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      scheduledAt: true,
      publishedAt: true,
    },
  },
} as const;

// Projection for LIST endpoints: everything the list serializers need but WITHOUT
// the heavy `body` JSON tree. Detail endpoints (findById/create/update) keep using
// `postInclude`, which returns the full row incl. body. Cutting body here is what
// makes the admin "Bài của tôi" list (pageSize 100) small instead of ~2 MB.
const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  categoryId: true,
  departmentId: true,
  status: true,
  coverMediaId: true,
  coverUrl: true,
  coverAlt: true,
  eventStartAt: true,
  eventEndAt: true,
  eventLocation: true,
  publishedAt: true,
  scheduledAt: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  postTags: { include: { tag: true } },
  layouts: {
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      scheduledAt: true,
      publishedAt: true,
    },
  },
} as const;

type PostListRecord = Prisma.PostGetPayload<{ select: typeof postListSelect }>;

// A post is publicly visible only once it has at least one PUBLISHED layout
// (the public site resolves an article by its published layout; without one the
// standalone URL 404s). This clause keeps such "orphan" posts out of the feeds.
// A post is only public if it has a published layout that has NOT been soft-deleted.
const HAS_PUBLISHED_LAYOUT = {
  layouts: { some: { isPublished: true, deletedAt: null } },
} as const;
// Soft-delete: exclude trashed rows from every normal (non-trash) query.
const NOT_DELETED = { deletedAt: null } as const;
// Items in the trash are permanently purged this long after deletion.
const TRASH_RETENTION_DAYS = 30;

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageLayoutRepo: PageLayoutRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly publicRevalidate: PublicRevalidateService,
    private readonly chatbot: ChatbotService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'publishDuePosts' })
  async handleScheduledPublish() {
    const now = new Date();
    const due = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        ...NOT_DELETED,
      },
      select: { id: true },
    });
    if (due.length === 0) return;
    for (const row of due) {
      try {
        await this.prisma.post.update({
          where: { id: row.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            scheduledAt: null,
          },
        });
        await this.syncAttachedLayouts(row.id);
        await this.chatbot.indexPost(row.id).catch((e) =>
          this.logger.error(`Chatbot index failed for ${row.id}`, e as Error),
        );
        this.logger.log(`Auto-published scheduled post ${row.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to auto-publish post ${row.id}`,
          err as Error,
        );
      }
    }
    await this.syncNewsFeedSnapshots();
    await this.cache.clear();
    this.publicRevalidate.trigger([
      'sitemap',
      ...due.map((r) => `post:${r.id}`),
    ]);
  }

  async create(
    body: UpsertPostBodyType,
    userId: string,
    departmentId: string | null,
  ) {
    const slug = toSlug(body.slug || body.title.vi);
    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (existing) throw PostSlugExistsException;
    const tagIds = await this.upsertTagIds(body.tagSlugs ?? []);
    const status = body.status ?? 'DRAFT';
    const scheduledAtValue =
      status === 'SCHEDULED' && body.scheduledAt
        ? new Date(body.scheduledAt)
        : null;
    const created = await this.prisma.post.create({
      data: {
        title: body.title,
        slug,
        body: body.body ?? undefined,
        excerpt: body.excerpt ?? undefined,
        categoryId: body.categoryId,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        scheduledAt: scheduledAtValue,
        coverMediaId: body.coverMediaId ?? null,
        coverUrl: body.coverUrl ?? null,
        coverAlt: body.coverAlt ?? null,
        eventStartAt: body.eventStartAt ? new Date(body.eventStartAt) : null,
        eventEndAt: body.eventEndAt ? new Date(body.eventEndAt) : null,
        eventLocation: body.eventLocation ?? null,
        createdBy: userId,
        departmentId: departmentId ?? null,
        postTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: postInclude,
    });
    if (created.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
      await this.chatbot.indexPost(created.id).catch(() => undefined);
      this.publicRevalidate.trigger(['sitemap', `post:${created.id}`]);
    }
    return this.serialize(created);
  }

  async update(
    id: string,
    body: UpsertPostBodyType,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    if (!canAccessDepartment(roleName, departmentId, existing.departmentId)) {
      throw PostNotFoundException;
    }
    const slug = toSlug(body.slug || body.title.vi);
    if (slug !== existing.slug) {
      const other = await this.prisma.post.findUnique({ where: { slug } });
      if (other && other.id !== id) throw PostSlugExistsException;
    }
    const tagIds = await this.upsertTagIds(body.tagSlugs ?? []);
    const nextStatus = body.status ?? existing.status;
    const becamePublished =
      nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    const leftPublished =
      nextStatus !== 'PUBLISHED' && existing.status === 'PUBLISHED';
    const publishedAtPatch = becamePublished
      ? { publishedAt: new Date() }
      : leftPublished
        ? { publishedAt: null }
        : {};
    const scheduledAtValue =
      nextStatus === 'SCHEDULED' && body.scheduledAt
        ? new Date(body.scheduledAt)
        : null;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postTag.deleteMany({ where: { postId: id } });
      return tx.post.update({
        where: { id },
        data: {
          title: body.title as unknown as InputJsonValue,
          slug,
          body: (body.body ?? undefined) as InputJsonValue | undefined,
          excerpt: (body.excerpt ?? undefined) as InputJsonValue | undefined,
          categoryId: body.categoryId,
          status: nextStatus,
          scheduledAt: scheduledAtValue,
          ...publishedAtPatch,
          coverMediaId: body.coverMediaId ?? null,
          coverUrl: body.coverUrl ?? null,
          coverAlt: body.coverAlt ?? null,
          eventStartAt: body.eventStartAt ? new Date(body.eventStartAt) : null,
          eventEndAt: body.eventEndAt ? new Date(body.eventEndAt) : null,
          eventLocation: body.eventLocation ?? null,
          postTags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: postInclude,
      });
    });
    const affectedSlugs = await this.syncAttachedLayouts(id);
    if (updated.status === 'PUBLISHED' || existing.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
    }
    await this.cache.clear();
    if (updated.status === 'PUBLISHED' || existing.status === 'PUBLISHED') {
      await this.chatbot.indexPost(id).catch(() => undefined);
    }
    this.publicRevalidate.trigger([
      'sitemap',
      `post:${id}`,
      ...affectedSlugs.map((s) => `page:${s}`),
    ]);
    return this.serialize(updated);
  }

  async list(userId: string, roleName: string, departmentId: string | null) {
    const posts = await this.prisma.post.findMany({
      where: {
        ...NOT_DELETED,
        ...((departmentScopeWhere(roleName, departmentId) ?? {}) as any),
      },
      orderBy: { updatedAt: 'desc' },
      select: postListSelect,
    });
    return posts.map((p) => this.serializeListItem(p));
  }

  async listAdminPaged(params: {
    page: number;
    pageSize: number;
    category?: string;
    status?: string;
    search?: string;
    userId: string;
    roleName: string;
    departmentId: string | null;
    deleted?: boolean;
  }) {
    const {
      page,
      pageSize,
      category,
      status,
      search,
      roleName,
      departmentId,
      deleted,
    } = params;
    const andClauses: Record<string, unknown>[] = [];
    const scope = departmentScopeWhere(roleName, departmentId);
    if (scope) andClauses.push(scope);
    if (search && search.trim()) {
      const q = search.trim();
      andClauses.push({
        OR: [
          { title: { path: ['vi'], string_contains: q } },
          { title: { path: ['en'], string_contains: q } },
          { excerpt: { path: ['vi'], string_contains: q } },
          { excerpt: { path: ['en'], string_contains: q } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    const where: Record<string, unknown> = {};
    if (category) where.category = { slug: category };
    if (status) where.status = status;
    if (deleted) {
      // Trash view: only rows soft-deleted within the retention window (older ones
      // are purged by cron, but guard here too so nothing past 30 days shows).
      const cutoff = new Date(
        Date.now() - TRASH_RETENTION_DAYS * 86400000,
      );
      where.deletedAt = { not: null, gte: cutoff };
    } else {
      where.deletedAt = null;
    }
    if (andClauses.length) where.AND = andClauses;
    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where: where as any }),
      this.prisma.post.findMany({
        where: where as any,
        orderBy: deleted ? { deletedAt: 'desc' } : { updatedAt: 'desc' },
        select: postListSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: posts.map((p) => this.serializeListItem(p)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // Scope a public feed by department. Default (no arg) = faculty homepage/main
  // feed: only faculty-office + untagged posts, so bộ-môn posts never surface on
  // the Khoa homepage. Pass a dept slug for a department page's own feed.
  private feedDeptWhere(department?: string): Record<string, unknown> {
    if (department && department.trim()) {
      return { department: { slug: department.trim() } };
    }
    return { OR: [{ departmentId: FACULTY_DEPT_ID }, { departmentId: null }] };
  }

  // By resolved departmentId (used when snapshotting per-layout).
  private feedDeptWhereById(
    departmentId: string | null,
  ): Record<string, unknown> {
    if (!departmentId || departmentId === FACULTY_DEPT_ID) {
      return { OR: [{ departmentId: FACULTY_DEPT_ID }, { departmentId: null }] };
    }
    return { departmentId };
  }

  async listLatestPublic(limit: number, deptWhere?: Record<string, unknown>) {
    const now = new Date();
    const posts = await this.prisma.post.findMany({
      where: {
        ...NOT_DELETED,
        status: 'PUBLISHED',
        // bài di trú rỗng nội dung (nguồn cũ không có bài) không đưa ra trang công khai
        body: { not: Prisma.DbNull },
        // chỉ công khai bài đã gắn vào một layout đã xuất bản (nếu không, URL bài lẻ 404)
        ...HAS_PUBLISHED_LAYOUT,
        AND: [
          deptWhere ?? this.feedDeptWhere(),
          { OR: [{ eventStartAt: null }, { eventStartAt: { lt: now } }] },
        ],
      },
      // Sắp theo NGÀY ĐĂNG GỐC (publishedAt) để tin mới viết gần đây luôn ở đầu;
      // bài cũ (2021…) dù mới di trú/sửa cũng không nhảy lên trang chủ.
      orderBy: { publishedAt: 'desc' },
      select: postListSelect,
      // Over-fetch để ảnh bìa phá hoà khi cùng ngày (bài có bìa lên trước bài không).
      take: Math.max(limit * 3, limit),
    });
    const dateOf = (x: PostListRecord) =>
      +new Date(x.publishedAt ?? x.updatedAt);
    const sorted = posts.sort((a, b) => {
      const d = dateOf(b) - dateOf(a); // mới viết gần đây nhất trước
      if (d !== 0) return d;
      // Hoà ngày → ưu tiên bài có ảnh bìa (bài không bìa dùng logo mặc định).
      return (b.coverUrl ? 1 : 0) - (a.coverUrl ? 1 : 0);
    });
    return sorted.slice(0, limit).map((p) => this.serializePublic(p));
  }

  async listUpcomingEventsPublic(
    limit: number,
    deptWhere?: Record<string, unknown>,
  ) {
    const now = new Date();
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        ...NOT_DELETED,
        body: { not: Prisma.DbNull },
        ...HAS_PUBLISHED_LAYOUT,
        AND: [deptWhere ?? this.feedDeptWhere()],
        eventStartAt: { gte: now },
      },
      orderBy: { eventStartAt: 'asc' },
      select: postListSelect,
      take: limit,
    });
    return posts.map((p) => this.serializePublic(p));
  }

  async listPagedPublic(params: {
    page: number;
    pageSize: number;
    category?: string;
    department?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
  }) {
    const { page, pageSize, category, department, fromDate, toDate, search } =
      params;
    const where: Record<string, unknown> = {
      ...NOT_DELETED,
      status: 'PUBLISHED',
      body: { not: Prisma.DbNull },
      ...HAS_PUBLISHED_LAYOUT,
      // Faculty feed by default; a dept slug narrows to that department's posts.
      AND: [this.feedDeptWhere(department)],
    };
    if (category) where.category = { slug: category };
    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.gte = fromDate;
      if (toDate) range.lte = toDate;
      // Lọc theo ngày ĐĂNG GỐC cho khớp cột ngày hiển thị + sắp xếp.
      where.publishedAt = range;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { path: ['vi'], string_contains: q } },
        { title: { path: ['en'], string_contains: q } },
        { excerpt: { path: ['vi'], string_contains: q } },
        { excerpt: { path: ['en'], string_contains: q } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where: where as any }),
      this.prisma.post.findMany({
        where: where as any,
        // Danh sách/tin tức/tìm kiếm: sắp theo ngày đăng gốc (mới viết trước).
        orderBy: { publishedAt: 'desc' },
        select: postListSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: posts.map((p) => this.serializePublic(p)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  private serializePublic(record: PostListRecord) {
    const publishedLayout = record.layouts.find((l) => l.isPublished) ?? null;
    return {
      id: record.id,
      title: asLocalized(record.title),
      slug: record.slug,
      excerpt: asLocalized(record.excerpt),
      categoryId: record.categoryId,
      coverUrl: record.coverUrl,
      coverAlt: record.coverAlt,
      eventStartAt: record.eventStartAt,
      eventEndAt: record.eventEndAt,
      eventLocation: record.eventLocation,
      // Ngày HIỂN THỊ = ngày đăng GỐC (publishedAt), KHÔNG dùng updatedAt (là ngày
      // di trú/chỉnh sửa) — nếu không bài cũ 2021 sửa lại năm 2026 sẽ mang nhãn 2026
      // và nhảy lên đầu feed. Fallback updatedAt phòng khi thiếu (thực tế 0 bài null).
      publishedAt: record.publishedAt ?? record.updatedAt,
      layoutSlug: publishedLayout?.slug ?? null,
      // Tag icons (e.g. SDG badges) shown under the card on the public site.
      tags: record.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
        icon: pt.tag.icon,
      })),
    };
  }

  async findById(
    id: string,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const record = await this.findByIdOrThrow(id);
    if (!canAccessDepartment(roleName, departmentId, record.departmentId)) {
      throw PostNotFoundException;
    }
    return this.serialize(record);
  }

  async delete(
    id: string,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    if (!canAccessDepartment(roleName, departmentId, existing.departmentId)) {
      throw PostNotFoundException;
    }
    // Layouts created from this post become meaningless once the post is gone,
    // so delete them too (and remember their slugs to revalidate the public site).
    const attached = await this.prisma.pageLayout.findMany({
      where: { sourcePostId: id },
      select: { slug: true },
    });
    // Soft delete: stamp deletedAt on the post + its layouts so they drop out of
    // every public/admin query but can be restored within the retention window.
    // A daily cron (purgeExpiredTrash) hard-deletes anything older than 30 days.
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.pageLayout.updateMany({
        where: { sourcePostId: id, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.post.update({ where: { id }, data: { deletedAt: now } });
    });
    if (existing.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
    }
    await this.cache.clear();
    this.publicRevalidate.trigger([
      'sitemap',
      `post:${id}`,
      ...attached.map((l) => `page:${l.slug}`),
    ]);
    return { ok: true };
  }

  // Restore a soft-deleted post (and the layouts deleted alongside it) back into
  // the system. Only works while the post is still within the retention window.
  async restore(
    id: string,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing || !existing.deletedAt) throw PostNotFoundException;
    if (!canAccessDepartment(roleName, departmentId, existing.departmentId)) {
      throw PostNotFoundException;
    }
    const deletedAt = existing.deletedAt;
    const attached = await this.prisma.pageLayout.findMany({
      where: { sourcePostId: id },
      select: { slug: true },
    });
    await this.prisma.$transaction(async (tx) => {
      // Only un-delete layouts that were trashed together with this post (same
      // timestamp), so a layout the user deleted separately stays in the trash.
      await tx.pageLayout.updateMany({
        where: { sourcePostId: id, deletedAt },
        data: { deletedAt: null },
      });
      await tx.post.update({ where: { id }, data: { deletedAt: null } });
    });
    if (existing.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
    }
    await this.cache.clear();
    this.publicRevalidate.trigger([
      'sitemap',
      `post:${id}`,
      ...attached.map((l) => `page:${l.slug}`),
    ]);
    return { ok: true };
  }

  // Permanently remove posts + layouts that have been in the trash longer than the
  // retention window. Runs daily; nothing here is recoverable afterwards.
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'purgeExpiredTrash' })
  async purgeExpiredTrash() {
    const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86400000);
    const expiredPosts = await this.prisma.post.findMany({
      where: { deletedAt: { not: null, lt: cutoff } },
      select: { id: true },
    });
    // Layouts deleted on their own (no live source post) also expire.
    const expiredLayouts = await this.prisma.pageLayout.findMany({
      where: { deletedAt: { not: null, lt: cutoff } },
      select: { id: true },
    });
    if (expiredPosts.length === 0 && expiredLayouts.length === 0) return;
    const postIds = expiredPosts.map((p) => p.id);
    await this.prisma.$transaction(async (tx) => {
      // Remove layouts of expiring posts first, then any independently-expired ones.
      if (postIds.length) {
        await tx.pageLayout.deleteMany({ where: { sourcePostId: { in: postIds } } });
        await tx.postTag.deleteMany({ where: { postId: { in: postIds } } });
        await tx.post.deleteMany({ where: { id: { in: postIds } } });
      }
      const layoutIds = expiredLayouts.map((l) => l.id);
      if (layoutIds.length) {
        await tx.pageLayout.deleteMany({
          where: { id: { in: layoutIds }, deletedAt: { not: null, lt: cutoff } },
        });
      }
    });
    this.logger.log(
      `Purged ${expiredPosts.length} post(s) + ${expiredLayouts.length} layout(s) past ${TRASH_RETENTION_DAYS}d retention`,
    );
  }

  async cloneIntoLayout(
    postId: string,
    body: CloneIntoLayoutBodyType,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const post = await this.findByIdOrThrow(postId);
    if (!canAccessDepartment(roleName, departmentId, post.departmentId)) {
      throw PostNotFoundException;
    }
    const template = await this.prisma.pageLayout.findUnique({
      where: { id: body.templateLayoutId },
      select: { id: true, slug: true, puckData: true },
    });
    if (!template) throw TemplateLayoutNotFoundException;

    // Enforce that a bộ-môn post's layout lives under that department's slug so
    // it can never be published at the faculty root (/, /tin-tuc). Faculty and
    // untagged posts keep the template-derived path.
    let deptSlug: string | null = null;
    if (post.departmentId && post.departmentId !== FACULTY_DEPT_ID) {
      const dept = await this.prisma.department.findUnique({
        where: { id: post.departmentId },
        select: { slug: true },
      });
      deptSlug = dept?.slug ?? null;
    }
    // Faculty/untagged posts publish under the news prefix (/tin-tuc/<slug>);
    // bộ-môn posts stay under their department slug (never at the faculty root).
    let layoutSlug: string;
    if (body.layoutSlug) {
      layoutSlug = toSlugPath(body.layoutSlug);
      if (
        deptSlug &&
        layoutSlug !== deptSlug &&
        !layoutSlug.startsWith(`${deptSlug}/`)
      ) {
        layoutSlug = toSlugPath(`${deptSlug}/${layoutSlug}`);
      }
    } else if (deptSlug) {
      layoutSlug = toSlugPath(`${deptSlug}/${post.slug}`);
    } else {
      layoutSlug = toSlugPath(`tin-tuc/${post.slug}`);
    }
    const conflict = await this.pageLayoutRepo.findConflictBySlugAndStatus(
      layoutSlug,
      false,
    );
    if (conflict) throw slugExistsInStatusException('draft', conflict.name);

    const postCategory = await this.prisma.category.findUnique({
      where: { id: post.categoryId },
      select: { slug: true, name: true },
    });
    const titleVi = viOf(post.title);
    const injectPayload: PostInjectPayload = {
      title: titleVi,
      body: viOf(post.body),
      excerpt: viOf(post.excerpt) || null,
      coverUrl:
        post.coverUrl ?? (post.coverMedia ? post.coverMedia.url : null) ?? null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
        icon: pt.tag.icon,
      })),
      category: postCategory?.slug ?? '',
      categoryLabel: viOf(postCategory?.name),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      eventStartAt: post.eventStartAt ? post.eventStartAt.toISOString() : null,
      eventEndAt: post.eventEndAt ? post.eventEndAt.toISOString() : null,
      eventLocation: post.eventLocation ?? null,
    };
    const injectedTree = injectPostIntoPuckData(
      template.puckData,
      injectPayload,
    );

    const layout = await this.prisma.pageLayout.create({
      data: {
        name: body.layoutName || titleVi,
        slug: layoutSlug,
        description: viOf(post.excerpt) || null,
        puckData: injectedTree as unknown as InputJsonValue,
        createdBy: userId,
        sourcePostId: post.id,
        // Scope the layout to the post's department so dept-scoped public feeds
        // (syncNewsFeedSnapshots) place it correctly and never on the homepage.
        departmentId: post.departmentId,
      },
      select: { id: true, slug: true },
    });
    // Gắn bài vào một layout = nội dung đã sẵn sàng có trang: đưa bài đang ở
    // nháp sang "chờ xuất bản" (PENDING). Không đụng bài đã SCHEDULED/PUBLISHED.
    if (post.status === 'DRAFT') {
      await this.prisma.post.update({
        where: { id: post.id },
        data: { status: 'PENDING' },
      });
    }
    await this.cache.clear();
    return layout;
  }

  private async findByIdOrThrow(id: string) {
    const record = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...postInclude,
        coverMedia: { select: { id: true, url: true } },
      },
    });
    if (!record) throw PostNotFoundException;
    return record;
  }

  async syncNewsFeedSnapshots() {
    const layouts = await this.prisma.pageLayout.findMany({
      select: {
        id: true,
        departmentId: true,
        puckData: true,
        publishedPuckData: true,
      },
    });

    // Each layout is snapshotted with a feed scoped to ITS department, so a
    // faculty/homepage layout never shows bộ-môn posts and a department page
    // shows its own. Memoize per scope to avoid re-querying.
    type Feed = { latest: unknown[]; events: unknown[] };
    const feedCache = new Map<string, Feed>();
    const scopeKey = (deptId: string | null) =>
      !deptId || deptId === FACULTY_DEPT_ID ? '__faculty__' : deptId;
    const getFeed = async (deptId: string | null): Promise<Feed> => {
      const key = scopeKey(deptId);
      let feed = feedCache.get(key);
      if (!feed) {
        const w = this.feedDeptWhereById(deptId);
        const [latest, events] = await Promise.all([
          this.listLatestPublic(12, w),
          this.listUpcomingEventsPublic(12, w),
        ]);
        feed = { latest, events };
        feedCache.set(key, feed);
      }
      return feed;
    };

    const transformNode = (node: any, feed: Feed): any => {
      if (Array.isArray(node)) return node.map((n) => transformNode(n, feed));
      if (!node || typeof node !== 'object') return node;
      const out = { ...node };
      if (out.props) out.props = { ...out.props };
      if (out.type === 'LatestNewsAuto' && out.props) {
        const limit = Math.max(1, Math.min(Number(out.props.limit) || 4, 12));
        out.props.posts = feed.latest.slice(0, limit);
      } else if (out.type === 'UpcomingEventsAuto' && out.props) {
        const limit = Math.max(1, Math.min(Number(out.props.limit) || 4, 12));
        out.props.posts = feed.events.slice(0, limit);
      }
      if (out.props) {
        for (const k of Object.keys(out.props)) {
          out.props[k] = transformNode(out.props[k], feed);
        }
      }
      return out;
    };

    const transformTree = (data: any, feed: Feed): any => {
      if (!data || typeof data !== 'object') return data;
      const out = { ...data };
      if (Array.isArray(out.content))
        out.content = out.content.map((n: unknown) => transformNode(n, feed));
      if (out.zones && typeof out.zones === 'object') {
        const z: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(out.zones)) {
          z[k] = Array.isArray(v) ? v.map((n) => transformNode(n, feed)) : v;
        }
        out.zones = z;
      }
      return out;
    };

    let changed = 0;
    for (const layout of layouts) {
      const feed = await getFeed(layout.departmentId);
      const orig = JSON.stringify(layout.puckData);
      const origPub = JSON.stringify(layout.publishedPuckData);
      const next = transformTree(layout.puckData, feed);
      const nextPub = transformTree(layout.publishedPuckData, feed);
      if (
        JSON.stringify(next) !== orig ||
        JSON.stringify(nextPub) !== origPub
      ) {
        await this.prisma.pageLayout.update({
          where: { id: layout.id },
          data: {
            puckData: next as InputJsonValue,
            publishedPuckData: (nextPub ?? undefined) as
              | InputJsonValue
              | undefined,
          },
        });
        changed++;
      }
    }
    if (changed) await this.cache.clear();
    return { layoutsUpdated: changed };
  }

  private async syncAttachedLayouts(postId: string): Promise<string[]> {
    const post = await this.findByIdOrThrow(postId);
    const layouts = await this.prisma.pageLayout.findMany({
      where: { sourcePostId: postId },
      select: {
        id: true,
        slug: true,
        puckData: true,
        publishedPuckData: true,
      },
    });
    if (!layouts.length) return [];
    const postCategory = await this.prisma.category.findUnique({
      where: { id: post.categoryId },
      select: { slug: true, name: true },
    });
    const payload: PostInjectPayload = {
      title: viOf(post.title),
      body: viOf(post.body),
      excerpt: viOf(post.excerpt) || null,
      coverUrl:
        post.coverUrl ?? (post.coverMedia ? post.coverMedia.url : null) ?? null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
        icon: pt.tag.icon,
      })),
      category: postCategory?.slug ?? '',
      categoryLabel: viOf(postCategory?.name),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      eventStartAt: post.eventStartAt ? post.eventStartAt.toISOString() : null,
      eventEndAt: post.eventEndAt ? post.eventEndAt.toISOString() : null,
      eventLocation: post.eventLocation ?? null,
    };
    await Promise.all(
      layouts.map((layout) => {
        const data: {
          puckData?: InputJsonValue;
          publishedPuckData?: InputJsonValue;
        } = {};
        if (layout.puckData) {
          data.puckData = injectPostIntoPuckData(
            layout.puckData,
            payload,
          ) as unknown as InputJsonValue;
        }
        if (layout.publishedPuckData) {
          data.publishedPuckData = injectPostIntoPuckData(
            layout.publishedPuckData,
            payload,
          ) as unknown as InputJsonValue;
        }
        if (!data.puckData && !data.publishedPuckData) {
          return Promise.resolve();
        }
        return this.prisma.pageLayout.update({
          where: { id: layout.id },
          data,
        });
      }),
    );
    return layouts.map((l) => l.slug);
  }

  private async upsertTagIds(slugs: string[]): Promise<string[]> {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    if (!unique.length) return [];
    const tags = await Promise.all(
      unique.map((slug) =>
        this.prisma.tag.upsert({
          where: { slug },
          create: { slug, name: slug },
          update: {},
          select: { id: true },
        }),
      ),
    );
    return tags.map((t) => t.id);
  }

  private serialize(
    record: Awaited<ReturnType<PrismaService['post']['findFirstOrThrow']>> & {
      postTags: Array<{ tag: { slug: string; name: string } }>;
      layouts: Array<{
        id: string;
        name: string;
        slug: string;
        isPublished: boolean;
        scheduledAt: Date | null;
        publishedAt: Date | null;
      }>;
    },
  ) {
    return {
      id: record.id,
      title: asLocalized(record.title),
      slug: record.slug,
      body: asLocalized(record.body),
      excerpt: asLocalized(record.excerpt),
      categoryId: record.categoryId,
      departmentId: record.departmentId,
      status: record.status,
      coverMediaId: record.coverMediaId,
      coverUrl: record.coverUrl,
      coverAlt: record.coverAlt,
      tags: record.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      eventStartAt: record.eventStartAt,
      eventEndAt: record.eventEndAt,
      eventLocation: record.eventLocation,
      publishedAt: record.publishedAt,
      scheduledAt: record.scheduledAt,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      layouts: record.layouts,
    };
  }

  // Same shape as serialize() but for LIST rows fetched with postListSelect
  // (no `body`). The admin post list doesn't render body, so it never asks for it.
  private serializeListItem(record: PostListRecord) {
    return {
      id: record.id,
      title: asLocalized(record.title),
      slug: record.slug,
      excerpt: asLocalized(record.excerpt),
      categoryId: record.categoryId,
      departmentId: record.departmentId,
      status: record.status,
      coverMediaId: record.coverMediaId,
      coverUrl: record.coverUrl,
      coverAlt: record.coverAlt,
      tags: record.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      eventStartAt: record.eventStartAt,
      eventEndAt: record.eventEndAt,
      eventLocation: record.eventLocation,
      publishedAt: record.publishedAt,
      scheduledAt: record.scheduledAt,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      trashDaysLeft: record.deletedAt
        ? Math.max(
            0,
            TRASH_RETENTION_DAYS -
              Math.floor(
                (Date.now() - new Date(record.deletedAt).getTime()) / 86400000,
              ),
          )
        : null,
      layouts: record.layouts,
    };
  }
}
