import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const asLocalized = (
  value: Prisma.JsonValue | null,
): { vi: string; en?: string } | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return { vi: value };
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as { vi?: string; en?: string };
  if (typeof obj.vi !== 'string' && typeof obj.en !== 'string') return null;
  return { vi: obj.vi ?? '', en: obj.en };
};

type PublicCard = {
  id: string;
  title: { vi: string; en?: string } | null;
  slug: string;
  excerpt: { vi: string; en?: string } | null;
  categoryId: string;
  category: { id: string; slug: string; name: { vi: string; en?: string } | null } | null;
  coverUrl: string | null;
  coverAlt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  eventLocation: string | null;
  publishedAt: string | null;
  layoutSlug: string | null;
};

async function loadLatest(limit: number): Promise<PublicCard[]> {
  const now = new Date();
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ eventStartAt: null }, { eventStartAt: { lt: now } }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      layouts: { select: { id: true, slug: true, isPublished: true } },
    },
    take: limit,
  });
  return posts.map(serialize);
}

async function loadEvents(limit: number): Promise<PublicCard[]> {
  const now = new Date();
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', eventStartAt: { gte: now } },
    orderBy: { eventStartAt: 'asc' },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      layouts: { select: { id: true, slug: true, isPublished: true } },
    },
    take: limit,
  });
  return posts.map(serialize);
}

const serialize = (r: {
  id: string;
  title: Prisma.JsonValue;
  slug: string;
  excerpt: Prisma.JsonValue | null;
  categoryId: string;
  coverUrl: string | null;
  coverAlt: string | null;
  eventStartAt: Date | null;
  eventEndAt: Date | null;
  eventLocation: string | null;
  updatedAt: Date;
  category: { id: string; slug: string; name: Prisma.JsonValue } | null;
  layouts: Array<{ id: string; slug: string; isPublished: boolean }>;
}): PublicCard => {
  const layout = r.layouts.find((l) => l.isPublished) ?? null;
  return {
    id: r.id,
    title: asLocalized(r.title),
    slug: r.slug,
    excerpt: asLocalized(r.excerpt),
    categoryId: r.categoryId,
    category: r.category
      ? { id: r.category.id, slug: r.category.slug, name: asLocalized(r.category.name) }
      : null,
    coverUrl: r.coverUrl,
    coverAlt: r.coverAlt,
    eventStartAt: r.eventStartAt ? r.eventStartAt.toISOString() : null,
    eventEndAt: r.eventEndAt ? r.eventEndAt.toISOString() : null,
    eventLocation: r.eventLocation,
    publishedAt: r.updatedAt.toISOString(),
    layoutSlug: layout?.slug ?? null,
  };
};

type AnyTree = Record<string, unknown>;

const walkNode = (
  node: unknown,
  latest: PublicCard[],
  events: PublicCard[],
): unknown => {
  if (Array.isArray(node)) return node.map((c) => walkNode(c, latest, events));
  if (!node || typeof node !== 'object') return node;
  const out = { ...(node as AnyTree) };
  if (out.props && typeof out.props === 'object') {
    const props = { ...(out.props as AnyTree) };
    if (out.type === 'LatestNewsAuto') {
      const limit = Math.max(1, Math.min(Number(props.limit) || 4, 12));
      props.posts = latest.slice(0, limit);
    } else if (out.type === 'UpcomingEventsAuto') {
      const limit = Math.max(1, Math.min(Number(props.limit) || 4, 12));
      props.posts = events.slice(0, limit);
    }
    for (const k of Object.keys(props)) {
      props[k] = walkNode(props[k], latest, events);
    }
    out.props = props;
  }
  return out;
};

const walkTree = (
  data: unknown,
  latest: PublicCard[],
  events: PublicCard[],
): unknown => {
  if (!data || typeof data !== 'object') return data;
  const out = { ...(data as AnyTree) };
  if (Array.isArray(out.content)) {
    out.content = out.content.map((c) => walkNode(c, latest, events));
  }
  if (out.zones && typeof out.zones === 'object') {
    const z: AnyTree = {};
    for (const [k, v] of Object.entries(out.zones as AnyTree)) {
      z[k] = Array.isArray(v) ? v.map((c) => walkNode(c, latest, events)) : v;
    }
    out.zones = z;
  }
  return out;
};

async function main() {
  console.log('Loading latest + events feed snapshots...');
  const [latest, events] = await Promise.all([loadLatest(12), loadEvents(12)]);
  console.log(`  latest=${latest.length}  events=${events.length}`);

  const layouts = await prisma.pageLayout.findMany({
    select: { id: true, puckData: true, publishedPuckData: true },
  });
  console.log(`Walking ${layouts.length} layouts...`);
  let updated = 0;
  for (const l of layouts) {
    const nextDraft = l.puckData
      ? walkTree(l.puckData, latest, events)
      : l.puckData;
    const nextPub = l.publishedPuckData
      ? walkTree(l.publishedPuckData, latest, events)
      : l.publishedPuckData;
    await prisma.pageLayout.update({
      where: { id: l.id },
      data: {
        puckData: (nextDraft ?? Prisma.DbNull) as Prisma.InputJsonValue,
        publishedPuckData: (nextPub ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });
    updated++;
  }
  console.log(`Done. ${updated} layouts updated.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
