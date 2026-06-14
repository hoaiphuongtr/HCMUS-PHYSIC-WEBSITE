import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const LEGACY_BASE = 'https://phys.hcmus.edu.vn';
const UPLOAD_ROOT = join(__dirname, '../../uploads/legacy');
const CONCURRENCY = 6;

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) });

type DownloadStats = {
  attempted: number;
  ok: number;
  skipped: number;
  failed: number;
};

const seen = new Set<string>();

function collectImgSrcs(html: string | null | undefined, out: Set<string>): void {
  if (!html) return;
  const rx = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('/uploads/')) out.add(src);
    else if (src.startsWith(LEGACY_BASE + '/uploads/'))
      out.add(src.slice(LEGACY_BASE.length));
  }
}

function isLocalizedHtml(
  value: unknown,
): value is { vi?: string | null; en?: string | null } {
  return typeof value === 'object' && value !== null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

async function downloadOne(path: string, stats: DownloadStats): Promise<void> {
  stats.attempted++;
  const decoded = decodeURI(path);
  const local = join(UPLOAD_ROOT, decoded.replace(/^\/uploads\//, ''));
  if (await fileExists(local)) {
    stats.skipped++;
    return;
  }
  const url = LEGACY_BASE + path;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      stats.failed++;
      return;
    }
    if (!res.body) {
      stats.failed++;
      return;
    }
    await mkdir(dirname(local), { recursive: true });
    const ws = createWriteStream(local);
    await pipeline(Readable.fromWeb(res.body as never), ws);
    stats.ok++;
    if (stats.ok % 25 === 0) {
      console.log(
        `  ok=${stats.ok}  failed=${stats.failed}  skipped=${stats.skipped}  attempted=${stats.attempted}`,
      );
    }
  } catch {
    stats.failed++;
  }
}

async function runQueue(paths: string[]): Promise<DownloadStats> {
  const stats: DownloadStats = { attempted: 0, ok: 0, skipped: 0, failed: 0 };
  const queue = [...paths];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await downloadOne(next, stats);
    }
  });
  await Promise.all(workers);
  return stats;
}

async function main(): Promise<void> {
  console.log('Scanning posts for image paths...');
  const posts = await prisma.post.findMany({
    where: { legacyId: { not: null } },
    select: { coverUrl: true, body: true },
  });
  const paths = new Set<string>();
  for (const p of posts) {
    if (p.coverUrl && p.coverUrl.startsWith('/uploads/')) paths.add(p.coverUrl);
    if (isLocalizedHtml(p.body)) {
      collectImgSrcs(p.body.vi, paths);
      collectImgSrcs(p.body.en, paths);
    }
  }
  const cats = await prisma.category.findMany({
    where: { legacyId: { not: null }, image: { not: null } },
    select: { image: true },
  });
  for (const c of cats) {
    if (c.image && c.image.startsWith('/uploads/')) paths.add(c.image);
  }
  const list = Array.from(paths);
  console.log(`Found ${list.length} unique paths to download.`);
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const stats = await runQueue(list);
  console.log('Done.', stats);
  for (const _ of seen) {
    // no-op; reserved for future use
  }
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
