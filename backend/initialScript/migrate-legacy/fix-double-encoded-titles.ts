import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

type Loc = { vi?: string; en?: string };

const unwrap = (raw: string): { vi: string; en?: string } | null => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{"')) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Loc;
    if (typeof obj.vi !== 'string') return null;
    return { vi: obj.vi, en: typeof obj.en === 'string' ? obj.en : undefined };
  } catch {
    return null;
  }
};

const fixLocalized = (value: Prisma.JsonValue | null): Loc | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as Loc;
  if (typeof obj.vi !== 'string') return undefined;
  const unwrapped = unwrap(obj.vi);
  if (!unwrapped) return undefined;
  return unwrapped;
};

async function fixPosts(): Promise<number> {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, body: true, excerpt: true },
  });
  let fixed = 0;
  for (const p of posts) {
    const nextTitle = fixLocalized(p.title as Prisma.JsonValue);
    const nextBody = fixLocalized(p.body as Prisma.JsonValue);
    const nextExcerpt = fixLocalized(p.excerpt as Prisma.JsonValue);
    if (!nextTitle && !nextBody && !nextExcerpt) continue;
    await prisma.post.update({
      where: { id: p.id },
      data: {
        ...(nextTitle ? { title: nextTitle as unknown as Prisma.InputJsonValue } : {}),
        ...(nextBody ? { body: nextBody as unknown as Prisma.InputJsonValue } : {}),
        ...(nextExcerpt ? { excerpt: nextExcerpt as unknown as Prisma.InputJsonValue } : {}),
      },
    });
    fixed++;
  }
  return fixed;
}

async function fixLayoutNames(): Promise<number> {
  const layouts = await prisma.pageLayout.findMany({
    where: { sourcePostId: { not: null } },
    select: { id: true, name: true },
  });
  let fixed = 0;
  for (const l of layouts) {
    const unwrapped = unwrap(l.name);
    if (!unwrapped) continue;
    await prisma.pageLayout.update({
      where: { id: l.id },
      data: { name: unwrapped.vi || unwrapped.en || l.name },
    });
    fixed++;
  }
  return fixed;
}

async function main() {
  console.log('Fixing double-encoded JSON in Post.title/body/excerpt...');
  const p = await fixPosts();
  console.log(`  posts fixed: ${p}`);
  console.log('Fixing JSON-string PageLayout.name (from sourcePost)...');
  const l = await fixLayoutNames();
  console.log(`  layouts fixed: ${l}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
