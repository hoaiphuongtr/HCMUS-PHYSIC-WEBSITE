import { Inject, Injectable } from '@nestjs/common';
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
  UpsertPostBodyType,
} from './post.model';
import { injectPostIntoPuckData, PostInjectPayload } from './puck-inject';
import { toSlug, toSlugPath } from '../shared/helpers';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly pageLayoutRepo: PageLayoutRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(body: UpsertPostBodyType, userId: string) {
    const slug = toSlug(body.slug || body.title);
    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (existing) throw PostSlugExistsException;
    const tagIds = await this.upsertTagIds(body.tagSlugs ?? []);
    const created = await this.prisma.post.create({
      data: {
        title: body.title,
        slug,
        body: body.body ?? null,
        excerpt: body.excerpt ?? null,
        category: body.category,
        status: body.status ?? 'DRAFT',
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
          status: body.status ?? existing.status,
          coverMediaId: body.coverMediaId ?? null,
          coverUrl: body.coverUrl ?? null,
          coverAlt: body.coverAlt ?? null,
          eventStartAt: body.eventStartAt
            ? new Date(body.eventStartAt)
            : null,
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
    await this.cache.clear();
    return this.serialize(updated);
  }

  async list() {
    const posts = await this.prisma.post.findMany({
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
    });
    return posts.map((p) => this.serialize(p));
  }

  async findById(id: string) {
    const record = await this.findByIdOrThrow(id);
    return this.serialize(record);
  }

  async delete(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw PostNotFoundException;
    await this.prisma.post.delete({ where: { id } });
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
    if (conflict)
      throw slugExistsInStatusException('draft', conflict.name);

    const injectPayload: PostInjectPayload = {
      title: post.title,
      body: post.body ?? '',
      excerpt: post.excerpt ?? null,
      coverUrl:
        post.coverUrl ??
        (post.coverMedia ? post.coverMedia.url : null) ??
        null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      category: post.category,
      eventStartAt: post.eventStartAt
        ? post.eventStartAt.toISOString()
        : null,
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
        post.coverUrl ??
        (post.coverMedia ? post.coverMedia.url : null) ??
        null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({
        slug: pt.tag.slug,
        name: pt.tag.name,
      })),
      category: post.category,
      eventStartAt: post.eventStartAt
        ? post.eventStartAt.toISOString()
        : null,
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
      title: record.title,
      slug: record.slug,
      body: record.body,
      excerpt: record.excerpt,
      category: record.category,
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
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      layouts: record.layouts,
    };
  }
}
