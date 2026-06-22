import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const LEGACY_BASE = 'https://phys.hcmus.edu.vn';
const UPLOAD_ROOT = join(__dirname, '../../uploads/legacy');
const CONCURRENCY = 6;

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const fileExists = async (path: string): Promise<boolean> => {
  try {
    const s = await stat(path);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
};

const collect = (html: string, out: Set<string>): void => {
  const rx = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('/uploads/legacy/')) out.add(src);
  }
};

const isLocObj = (
  v: Prisma.JsonValue | null,
): v is { vi?: string; en?: string } =>
  !!v && typeof v === 'object' && !Array.isArray(v);

async function tryDownload(
  url: string,
  destPath: string,
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) return false;
    await mkdir(dirname(destPath), { recursive: true });
    const ws = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(res.body as never), ws);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('Scanning all post bodies for legacy /uploads/legacy/ paths...');
  const posts = await prisma.post.findMany({ select: { body: true } });
  const paths = new Set<string>();
  for (const p of posts) {
    if (isLocObj(p.body)) {
      if (typeof p.body.vi === 'string') collect(p.body.vi, paths);
      if (typeof p.body.en === 'string') collect(p.body.en, paths);
    }
  }
  console.log(`Unique paths: ${paths.size}`);

  const missing: string[] = [];
  for (const p of paths) {
    const local = join(UPLOAD_ROOT, decodeURI(p).replace(/^\/uploads\/legacy\//, ''));
    if (!(await fileExists(local))) missing.push(p);
  }
  console.log(`Missing locally: ${missing.length}`);

  let ok = 0;
  let fail = 0;
  const queue = [...missing];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      const dest = join(
        UPLOAD_ROOT,
        decodeURI(next).replace(/^\/uploads\/legacy\//, ''),
      );
      const url1 = `${LEGACY_BASE}${next.replace('/uploads/legacy/', '/uploads/')}`;
      const url2 = `${LEGACY_BASE}/uploads${decodeURI(next.replace('/uploads/legacy/', '/'))}`;
      if ((await tryDownload(url1, dest)) || (await tryDownload(url2, dest))) {
        ok++;
      } else {
        fail++;
      }
      if ((ok + fail) % 50 === 0) {
        console.log(`  ok=${ok} fail=${fail} remaining=${queue.length}`);
      }
    }
  });
  await Promise.all(workers);
  console.log(`Done. ok=${ok} fail=${fail}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
