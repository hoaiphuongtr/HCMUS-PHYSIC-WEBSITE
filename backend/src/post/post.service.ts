import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { toSlug, toSlugPath } from '../shared/helpers';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
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

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageLayoutRepo: PageLayoutRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly publicRevalidate: PublicRevalidateService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'publishDuePosts' })
  async handleScheduledPublish() {
    const now = new Date();
    const due = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
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

  async create(body: UpsertPostBodyType, userId: string) {
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
        postTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: postInclude,
    });
    if (created.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
      this.publicRevalidate.trigger(['sitemap', `post:${created.id}`]);
    }
    return this.serialize(created);
  }

  async update(
    id: string,
    body: UpsertPostBodyType,
    userId: string,
    roleName: string,
  ) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    if (roleName !== 'SUPER_ADMIN' && existing.createdBy !== userId) {
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
    await this.syncAttachedLayouts(id);
    if (updated.status === 'PUBLISHED' || existing.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
    }
    await this.cache.clear();
    this.publicRevalidate.trigger(['sitemap', `post:${id}`]);
    return this.serialize(updated);
  }

  private buildOwnershipFilter(userId: string, roleName: string) {
    if (roleName === 'SUPER_ADMIN') return {};
    return { OR: [{ status: 'PUBLISHED' }, { createdBy: userId }] };
  }

  async list(userId: string, roleName: string) {
    const posts = await this.prisma.post.findMany({
      where: this.buildOwnershipFilter(userId, roleName) as any,
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
    });
    return posts.map((p) => this.serialize(p));
  }

  async listAdminPaged(params: {
    page: number;
    pageSize: number;
    category?: string;
    status?: string;
    search?: string;
    userId: string;
    roleName: string;
  }) {
    const { page, pageSize, category, status, search, userId, roleName } =
      params;
    const andClauses: Record<string, unknown>[] = [];
    if (roleName !== 'SUPER_ADMIN') {
      andClauses.push({
        OR: [{ status: 'PUBLISHED' }, { createdBy: userId }],
      });
    }
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
    if (andClauses.length) where.AND = andClauses;
    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where: where as any }),
      this.prisma.post.findMany({
        where: where as any,
        orderBy: { updatedAt: 'desc' },
        include: postInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: posts.map((p) => this.serialize(p)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async listLatestPublic(limit: number) {
    const now = new Date();
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ eventStartAt: null }, { eventStartAt: { lt: now } }],
      },
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
      take: limit,
    });
    return posts.map((p) => this.serializePublic(p));
  }

  async listUpcomingEventsPublic(limit: number) {
    const now = new Date();
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED', eventStartAt: { gte: now } },
      orderBy: { eventStartAt: 'asc' },
      include: postInclude,
      take: limit,
    });
    return posts.map((p) => this.serializePublic(p));
  }

  async listPagedPublic(params: {
    page: number;
    pageSize: number;
    category?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
  }) {
    const { page, pageSize, category, fromDate, toDate, search } = params;
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (category) where.category = { slug: category };
    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.gte = fromDate;
      if (toDate) range.lte = toDate;
      where.updatedAt = range;
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
        orderBy: { updatedAt: 'desc' },
        include: postInclude,
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

  private serializePublic(
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
      publishedAt: record.updatedAt,
      layoutSlug: publishedLayout?.slug ?? null,
    };
  }

  async findById(id: string, userId: string, roleName: string) {
    const record = await this.findByIdOrThrow(id);
    if (roleName !== 'SUPER_ADMIN') {
      const isPublished = record.status === 'PUBLISHED';
      const isOwn = record.createdBy === userId;
      if (!isPublished && !isOwn) throw PostNotFoundException;
    }
    return this.serialize(record);
  }

  async delete(id: string, userId: string, roleName: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    if (roleName !== 'SUPER_ADMIN' && existing.createdBy !== userId) {
      throw PostNotFoundException;
    }
    await this.prisma.post.delete({ where: { id } });
    if (existing.status === 'PUBLISHED') {
      await this.syncNewsFeedSnapshots();
    }
    await this.cache.clear();
    return { ok: true };
  }

  async cloneIntoLayout(
    postId: string,
    body: CloneIntoLayoutBodyType,
    userId: string,
    roleName: string,
  ) {
    const post = await this.findByIdOrThrow(postId);
    if (roleName !== 'SUPER_ADMIN' && post.createdBy !== userId) {
      const isPublished = post.status === 'PUBLISHED';
      if (!isPublished) throw PostNotFoundException;
    }
    const template = await this.prisma.pageLayout.findUnique({
      where: { id: body.templateLayoutId },
      select: { id: true, slug: true, puckData: true },
    });
    if (!template) throw TemplateLayoutNotFoundException;

    const layoutSlug = body.layoutSlug
      ? toSlugPath(body.layoutSlug)
      : toSlugPath(`${template.slug}/${post.slug}`);
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
      },
      select: { id: true, slug: true },
    });
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
    const [latest, events] = await Promise.all([
      this.listLatestPublic(12),
      this.listUpcomingEventsPublic(12),
    ]);

    const layouts = await this.prisma.pageLayout.findMany({
      select: {
        id: true,
        puckData: true,
        publishedPuckData: true,
      },
    });

    const transformNode = (node: any): any => {
      if (Array.isArray(node)) return node.map(transformNode);
      if (!node || typeof node !== 'object') return node;
      const out = { ...node };
      if (out.props) out.props = { ...out.props };
      if (out.type === 'LatestNewsAuto' && out.props) {
        const limit = Math.max(1, Math.min(Number(out.props.limit) || 4, 12));
        out.props.posts = latest.slice(0, limit);
      } else if (out.type === 'UpcomingEventsAuto' && out.props) {
        const limit = Math.max(1, Math.min(Number(out.props.limit) || 4, 12));
        out.props.posts = events.slice(0, limit);
      }
      if (out.props) {
        for (const k of Object.keys(out.props)) {
          out.props[k] = transformNode(out.props[k]);
        }
      }
      return out;
    };

    const transformTree = (data: any): any => {
      if (!data || typeof data !== 'object') return data;
      const out = { ...data };
      if (Array.isArray(out.content))
        out.content = out.content.map(transformNode);
      if (out.zones && typeof out.zones === 'object') {
        const z: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(out.zones)) {
          z[k] = Array.isArray(v) ? v.map(transformNode) : v;
        }
        out.zones = z;
      }
      return out;
    };

    let changed = 0;
    for (const layout of layouts) {
      const orig = JSON.stringify(layout.puckData);
      const origPub = JSON.stringify(layout.publishedPuckData);
      const next = transformTree(layout.puckData);
      const nextPub = transformTree(layout.publishedPuckData);
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

  private async syncAttachedLayouts(postId: string) {
    const post = await this.findByIdOrThrow(postId);
    const layouts = await this.prisma.pageLayout.findMany({
      where: { sourcePostId: postId },
      select: { id: true, puckData: true, publishedPuckData: true },
    });
    if (!layouts.length) return;
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
        const nextPuck = layout.puckData
          ? injectPostIntoPuckData(layout.puckData, payload)
          : null;
        const nextPublished = layout.publishedPuckData
          ? injectPostIntoPuckData(layout.publishedPuckData, payload)
          : null;
        return this.prisma.pageLayout.update({
          where: { id: layout.id },
          data: {
            puckData: (nextPuck ?? undefined) as InputJsonValue | undefined,
            publishedPuckData: (nextPublished ?? undefined) as
              | InputJsonValue
              | undefined,
          },
        });
      }),
    );
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
}
