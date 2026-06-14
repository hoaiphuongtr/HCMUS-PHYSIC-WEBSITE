import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) });

const rewriteUrl = (raw: string | null | undefined): string | null | undefined => {
  if (!raw) return raw;
  if (!raw.startsWith('/uploads/')) return raw;
  if (raw.startsWith('/uploads/legacy/')) return raw;
  return raw.replace(/^\/uploads\//, '/uploads/legacy/');
};

const rewriteHtml = (html: string | null | undefined): string | null | undefined => {
  if (!html) return html;
  return html.replace(
    /(<img[^>]+src=["'])([^"']+)(["'])/gi,
    (_match, prefix: string, src: string, suffix: string) => {
      if (src.startsWith('/uploads/legacy/')) return `${prefix}${src}${suffix}`;
      if (src.startsWith('/uploads/'))
        return `${prefix}${src.replace(/^\/uploads\//, '/uploads/legacy/')}${suffix}`;
      const absMatch = src.match(/^https?:\/\/phys\.hcmus\.edu\.vn(\/uploads\/.*)$/i);
      if (absMatch) {
        return `${prefix}${absMatch[1].replace(/^\/uploads\//, '/uploads/legacy/')}${suffix}`;
      }
      return `${prefix}${src}${suffix}`;
    },
  );
};

const rewriteLocalizedHtml = (
  value: Prisma.JsonValue | null,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as { vi?: string | null; en?: string | null };
  const next: { vi?: string; en?: string } = {};
  if (typeof obj.vi === 'string') next.vi = rewriteHtml(obj.vi) ?? '';
  if (typeof obj.en === 'string') next.en = rewriteHtml(obj.en) ?? '';
  return next as unknown as Prisma.InputJsonValue;
};

async function rewritePosts(): Promise<number> {
  const posts = await prisma.post.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, coverUrl: true, body: true },
  });
  let updated = 0;
  for (const p of posts) {
    const nextCover = rewriteUrl(p.coverUrl);
    const nextBody = rewriteLocalizedHtml(p.body);
    if (nextCover === p.coverUrl && nextBody === undefined) continue;
    await prisma.post.update({
      where: { id: p.id },
      data: {
        coverUrl: nextCover ?? null,
        body: nextBody !== undefined ? nextBody : (p.body ?? Prisma.DbNull),
      },
    });
    updated++;
  }
  return updated;
}

async function rewriteCategories(): Promise<number> {
  const cats = await prisma.category.findMany({
    where: { legacyId: { not: null }, image: { not: null } },
    select: { id: true, image: true },
  });
  let updated = 0;
  for (const c of cats) {
    const next = rewriteUrl(c.image);
    if (next === c.image) continue;
    await prisma.category.update({ where: { id: c.id }, data: { image: next ?? null } });
    updated++;
  }
  return updated;
}

async function rewriteDepartments(): Promise<number> {
  const ds = await prisma.department.findMany({
    where: { id: { startsWith: 'dept_legacy_' } },
    select: { id: true, name: true, slug: true },
  });
  // Department has no image field today — skip; placeholder for future.
  return ds.length === 0 ? 0 : 0;
}

async function rewriteUsers(): Promise<number> {
  const users = await prisma.user.findMany({
    where: { id: { startsWith: 'legacy_user_' }, avatarUrl: { not: null } },
    select: { id: true, avatarUrl: true },
  });
  let updated = 0;
  for (const u of users) {
    const next = rewriteUrl(u.avatarUrl);
    if (next === u.avatarUrl) continue;
    await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: next ?? null } });
    updated++;
  }
  return updated;
}

async function main(): Promise<void> {
  console.log('Rewriting media URLs from /uploads/X → /uploads/legacy/X ...');
  const postCount = await rewritePosts();
  console.log(`  posts updated: ${postCount}`);
  const catCount = await rewriteCategories();
  console.log(`  categories updated: ${catCount}`);
  const userCount = await rewriteUsers();
  console.log(`  users updated: ${userCount}`);
  await rewriteDepartments();
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
