/**
 * republish-posts-bilingual.ts — nhét lại nội dung bài vào layout dưới dạng SONG NGỮ.
 *
 * Sau khi sửa puck-inject + post.service để nhét {vi,en}, các bài ĐÃ đăng trước đó
 * vẫn còn bản nhét ĐƠN NGỮ (tiếng Việt) trong publishedPuckData → trang chi tiết
 * /en vẫn ra tiếng Việt. Script này tái hiện đúng logic syncAttachedLayouts: với
 * mỗi bài, dựng payload song ngữ từ chính Post rồi nhét lại vào puckData +
 * publishedPuckData của các layout gắn với bài. Deterministic — chạy lại an toàn.
 *
 *   $env:DATABASE_URL="...@localhost:15432/..."
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/republish-posts-bilingual.ts
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/republish-posts-bilingual.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  injectPostIntoPuckData,
  type Localized,
  type PostInjectPayload,
} from '../../src/post/puck-inject';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL, keepAlive: true, idleTimeoutMillis: 0 }),
  ),
});
const APPLY = process.argv.includes('--apply');
const PAGE = 60;

const locOf = (v: unknown): Localized => {
  if (v == null) return { vi: '' };
  if (typeof v === 'string') return { vi: v };
  if (typeof v === 'object' && !Array.isArray(v)) {
    const o = v as { vi?: string; en?: string };
    const vi = typeof o.vi === 'string' ? o.vi : '';
    const en = typeof o.en === 'string' ? o.en : undefined;
    return { vi: vi || en || '', en };
  }
  return { vi: '' };
};

async function main(): Promise<void> {
  let cursor: string | undefined;
  let scanned = 0;
  let layoutsUpdated = 0;

  for (;;) {
    const posts = await prisma.post.findMany({
      where: { deletedAt: null, layouts: { some: {} } },
      orderBy: { id: 'asc' },
      take: PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        title: true,
        body: true,
        excerpt: true,
        coverUrl: true,
        coverAlt: true,
        coverMedia: { select: { url: true } },
        publishedAt: true,
        eventStartAt: true,
        eventEndAt: true,
        eventLocation: true,
        postTags: { select: { tag: { select: { slug: true, name: true, icon: true } } } },
        layouts: {
          select: {
            id: true,
            puckData: true,
            publishedPuckData: true,
            category: { select: { slug: true, name: true } },
          },
        },
      },
    });
    if (posts.length === 0) break;
    cursor = posts[posts.length - 1].id;
    scanned += posts.length;

    for (const post of posts) {
      const shared: Omit<PostInjectPayload, 'category' | 'categoryLabel'> = {
        title: locOf(post.title),
        body: locOf(post.body),
        excerpt: locOf(post.excerpt),
        coverUrl: post.coverUrl ?? post.coverMedia?.url ?? null,
        coverAlt: post.coverAlt ?? null,
        tags: post.postTags.map((pt) => ({
          slug: pt.tag.slug,
          name: pt.tag.name as unknown as string,
          icon: pt.tag.icon,
        })),
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        eventStartAt: post.eventStartAt ? post.eventStartAt.toISOString() : null,
        eventEndAt: post.eventEndAt ? post.eventEndAt.toISOString() : null,
        eventLocation: post.eventLocation ?? null,
      };

      for (const layout of post.layouts) {
        const payload: PostInjectPayload = {
          ...shared,
          category: layout.category?.slug ?? '',
          categoryLabel: locOf(layout.category?.name),
        };
        const data: { puckData?: Prisma.InputJsonValue; publishedPuckData?: Prisma.InputJsonValue } = {};
        if (layout.puckData) {
          data.puckData = injectPostIntoPuckData(layout.puckData, payload) as unknown as Prisma.InputJsonValue;
        }
        if (layout.publishedPuckData) {
          data.publishedPuckData = injectPostIntoPuckData(layout.publishedPuckData, payload) as unknown as Prisma.InputJsonValue;
        }
        if (!data.puckData && !data.publishedPuckData) continue;
        layoutsUpdated++;
        if (APPLY) {
          await prisma.pageLayout.update({ where: { id: layout.id }, data });
        }
      }
    }
    process.stdout.write(`\rĐã quét ${scanned} bài | layout cập nhật ${layoutsUpdated}   `);
  }

  console.log(
    `\n\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. bài=${scanned} layout=${layoutsUpdated}`,
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
