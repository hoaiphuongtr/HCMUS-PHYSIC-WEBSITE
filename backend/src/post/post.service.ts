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
import { CloneIntoLayoutBodyType, UpsertPostBodyType } from './post.model';
import { injectPostIntoPuckData, PostInjectPayload } from './puck-inject';
import { toSlug, toSlugPath } from '../shared/helpers';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';

const parseLocalized = (
  value: string | null,
): string | { vi?: string; en?: string } | null => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return value;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return parsed;
  } catch {
    return value;
  }
  return value;
};

const extractVi = (value: string | null): string | null => {
  const parsed = parseLocalized(value);
  if (parsed == null) return null;
  if (typeof parsed === 'string') return parsed;
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, string>;
    return obj.vi || obj.en || Object.values(obj).find(Boolean) || null;
  }
  return null;
};

const POST_CATEGORY_LABELS_VI: Record<string, string> = {
  EDUCATIONAL_NEWS: 'Tin học vụ',
  SCIENTIFIC_INFORMATION: 'Thông tin khoa học',
  RECRUITMENT: 'Tuyển dụng',
  EVENT: 'Sự kiện',
  SCHOLARSHIP: 'Học bổng',
};

const categoryLabel = (category: string): string =>
  POST_CATEGORY_LABELS_VI[category] ?? category;

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
    const slug = toSlug(body.slug || body.title);
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
        body: body.body ?? null,
        excerpt: body.excerpt ?? null,
        category: body.category,
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

  async update(id: string, body: UpsertPostBodyType) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    const slug = toSlug(body.slug || body.title);
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
          title: body.title,
          slug,
          body: body.body ?? null,
          excerpt: body.excerpt ?? null,
          category: body.category,
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

  async list() {
    const posts = await this.prisma.post.findMany({
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
  }) {
    const { page, pageSize, category, status, search } = params;
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
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
    if (category) where.category = category;
    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.gte = fromDate;
      if (toDate) range.lte = toDate;
      where.updatedAt = range;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
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
    const coverAltParsed = parseLocalized(record.coverAlt);
    return {
      id: record.id,
      title: parseLocalized(record.title),
      slug: record.slug,
      excerpt: parseLocalized(record.excerpt),
      category: record.category,
      coverUrl: record.coverUrl,
      coverAlt:
        typeof coverAltParsed === 'string'
          ? coverAltParsed
          : coverAltParsed && typeof coverAltParsed === 'object'
            ? (coverAltParsed as Record<string, string>).vi ||
              (coverAltParsed as Record<string, string>).en ||
              null
            : null,
      eventStartAt: record.eventStartAt,
      eventEndAt: record.eventEndAt,
      eventLocation: parseLocalized(record.eventLocation),
      publishedAt: record.updatedAt,
      layoutSlug: publishedLayout?.slug ?? null,
    };
  }

  async findById(id: string) {
    const record = await this.findByIdOrThrow(id);
    return this.serialize(record);
  }

  async delete(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
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
  ) {
    const post = await this.findByIdOrThrow(postId);
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

    const injectPayload: PostInjectPayload = {
      title: post.title,
      body: post.body ?? '',
      excerpt: post.excerpt ?? null,
      coverUrl:
        post.coverUrl ?? (post.coverMedia ? post.coverMedia.url : null) ?? null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      category: post.category,
      categoryLabel: categoryLabel(post.category),
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
        name: body.layoutName || post.title,
        slug: layoutSlug,
        description: post.excerpt ?? null,
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
    const payload: PostInjectPayload = {
      title: post.title,
      body: post.body ?? '',
      excerpt: post.excerpt ?? null,
      coverUrl:
        post.coverUrl ?? (post.coverMedia ? post.coverMedia.url : null) ?? null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      category: post.category,
      categoryLabel: categoryLabel(post.category),
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
      title: extractVi(record.title) ?? record.title,
      slug: record.slug,
      body: record.body,
      excerpt: extractVi(record.excerpt),
      category: record.category,
      status: record.status,
      coverMediaId: record.coverMediaId,
      coverUrl: record.coverUrl,
      coverAlt: extractVi(record.coverAlt),
      tags: record.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      eventStartAt: record.eventStartAt,
      eventEndAt: record.eventEndAt,
      eventLocation: extractVi(record.eventLocation),
      publishedAt: record.publishedAt,
      scheduledAt: record.scheduledAt,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      layouts: record.layouts,
    };
  }
}
