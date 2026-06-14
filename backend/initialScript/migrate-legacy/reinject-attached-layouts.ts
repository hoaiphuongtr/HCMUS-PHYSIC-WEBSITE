import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { injectPostIntoPuckData } from '../../src/post/puck-inject';
import type { PostInjectPayload } from '../../src/post/puck-inject';

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const viOf = (value: Prisma.JsonValue | null | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || Array.isArray(value)) return '';
  const obj = value as { vi?: unknown; en?: unknown };
  if (typeof obj.vi === 'string') return obj.vi;
  if (typeof obj.en === 'string') return obj.en;
  return '';
};

async function main(): Promise<void> {
  const template = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { id: true, puckData: true },
  });
  if (!template) throw new Error('template not found');

  const layouts = await prisma.pageLayout.findMany({
    where: { sourcePostId: { not: null } },
    select: { id: true, sourcePostId: true },
  });
  console.log(`Re-injecting ${layouts.length} attached layouts from current source post + template...`);

  let updated = 0;
  for (const l of layouts) {
    if (!l.sourcePostId) continue;
    const post = await prisma.post.findUnique({
      where: { id: l.sourcePostId },
      include: {
        coverMedia: { select: { url: true } },
        postTags: { include: { tag: true } },
        category: { select: { slug: true, name: true } },
      },
    });
    if (!post) continue;
    const titleVi = viOf(post.title);
    const payload: PostInjectPayload = {
      title: titleVi,
      body: viOf(post.body),
      excerpt: viOf(post.excerpt) || null,
      coverUrl: post.coverUrl || post.coverMedia?.url || null,
      coverAlt: post.coverAlt ?? null,
      tags: post.postTags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
      category: post.category?.slug ?? '',
      categoryLabel: viOf(post.category?.name),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      eventStartAt: post.eventStartAt ? post.eventStartAt.toISOString() : null,
      eventEndAt: post.eventEndAt ? post.eventEndAt.toISOString() : null,
      eventLocation: post.eventLocation ?? null,
    };
    const tree = injectPostIntoPuckData(template.puckData, payload);
    await prisma.pageLayout.update({
      where: { id: l.id },
      data: {
        name: titleVi || post.slug,
        description: viOf(post.excerpt) || null,
        puckData: tree as unknown as Prisma.InputJsonValue,
        publishedPuckData: tree as unknown as Prisma.InputJsonValue,
      },
    });
    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${layouts.length}`);
  }
  console.log(`Done. ${updated} layouts re-injected.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
