import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { injectPostIntoPuckData } from '../../src/post/puck-inject';
import type { PostInjectPayload } from '../../src/post/puck-inject';

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) });

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e';
const TEMPLATE_NEW_NAME = 'Layout bài post';
const TEMPLATE_NEW_SLUG = 'post-template-default';

const viOf = (value: Prisma.JsonValue | null | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || Array.isArray(value)) return '';
  const obj = value as { vi?: unknown; en?: unknown };
  if (typeof obj.vi === 'string') return obj.vi;
  if (typeof obj.en === 'string') return obj.en;
  return '';
};

async function ensureTemplate() {
  const tpl = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { id: true, name: true, slug: true, puckData: true, createdBy: true },
  });
  if (!tpl) throw new Error(`Template layout ${TEMPLATE_ID} not found`);
  if (tpl.slug !== TEMPLATE_NEW_SLUG || tpl.name !== TEMPLATE_NEW_NAME) {
    await prisma.pageLayout.update({
      where: { id: TEMPLATE_ID },
      data: { name: TEMPLATE_NEW_NAME, slug: TEMPLATE_NEW_SLUG },
    });
    console.log(`Template renamed → "${TEMPLATE_NEW_NAME}" / /${TEMPLATE_NEW_SLUG}`);
  }
  const refreshed = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { id: true, slug: true, puckData: true, createdBy: true },
  });
  if (!refreshed) throw new Error('refresh failed');
  return refreshed;
}

function uniqueSlug(base: string, taken: Set<string>): string {
  const norm = base.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
  if (!taken.has(norm)) {
    taken.add(norm);
    return norm;
  }
  let n = 2;
  while (taken.has(`${norm}-${n}`)) n++;
  const final = `${norm}-${n}`;
  taken.add(final);
  return final;
}

async function main() {
  console.log('Step 1 — ensure template');
  const template = await ensureTemplate();

  console.log('Step 2 — collect published posts without layouts');
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', layouts: { none: {} } },
    include: {
      coverMedia: { select: { url: true } },
      postTags: { include: { tag: true } },
      category: { select: { slug: true, name: true } },
    },
  });
  console.log(`  ${posts.length} posts to attach`);

  const allLayoutSlugs = new Set<string>(
    (await prisma.pageLayout.findMany({ select: { slug: true } })).map((l) => l.slug),
  );

  let created = 0;
  let failed = 0;
  const now = new Date();

  for (const post of posts) {
    const titleVi = viOf(post.title);
    const slug = uniqueSlug(post.slug, allLayoutSlugs);
    const payload: PostInjectPayload = {
      title: titleVi,
      body: viOf(post.body),
      excerpt: viOf(post.excerpt) || null,
      coverUrl: post.coverUrl ?? post.coverMedia?.url ?? null,
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
    try {
      await prisma.pageLayout.create({
        data: {
          name: titleVi || post.slug,
          slug,
          description: viOf(post.excerpt) || null,
          puckData: tree as unknown as Prisma.InputJsonValue,
          publishedPuckData: tree as unknown as Prisma.InputJsonValue,
          isPublished: true,
          publishedAt: post.publishedAt ?? now,
          createdBy: template.createdBy,
          sourcePostId: post.id,
        },
      });
      created++;
      if (created % 100 === 0) console.log(`  ${created}/${posts.length} layouts created`);
    } catch (err) {
      failed++;
      console.error(`  fail post=${post.id} slug=${slug}:`, (err as Error).message);
    }
  }
  console.log(`Done. created=${created} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
