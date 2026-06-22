import { readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const UPLOAD_ROOT = join(__dirname, '../../uploads/legacy');

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

async function indexByBasename(): Promise<Map<string, string[]>> {
  const idx = new Map<string, string[]>();
  const walk = async (dir: string): Promise<void> => {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let s;
      try {
        s = await stat(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        await walk(full);
      } else if (s.isFile() && s.size > 0) {
        const key = name.toLowerCase();
        const rel = relative(UPLOAD_ROOT, full).replace(/\\/g, '/');
        if (!idx.has(key)) idx.set(key, []);
        idx.get(key)!.push(rel);
      }
    }
  };
  await walk(UPLOAD_ROOT);
  return idx;
}

const collectSrcs = (
  html: string,
): { src: string; full: string }[] => {
  const out: { src: string; full: string }[] = [];
  const rx = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    if (m[1].startsWith('/uploads/legacy/')) {
      out.push({ src: m[1], full: m[0] });
    }
  }
  return out;
};

async function main(): Promise<void> {
  console.log('Indexing local media by basename...');
  const idx = await indexByBasename();
  console.log(`  Indexed ${idx.size} unique basenames`);

  const posts = await prisma.post.findMany({
    select: { id: true, slug: true, body: true },
  });

  let postsTouched = 0;
  let imgsRewritten = 0;
  let imgsAmbiguous = 0;
  let imgsUnmatched = 0;
  const unmatched: string[] = [];

  for (const post of posts) {
    if (
      !post.body ||
      typeof post.body !== 'object' ||
      Array.isArray(post.body)
    )
      continue;
    const bodyObj = post.body as { vi?: string; en?: string };
    let changed = false;
    const nextObj: { vi?: string; en?: string } = {};

    for (const lang of ['vi', 'en'] as const) {
      const html = bodyObj[lang];
      if (typeof html !== 'string') continue;
      let next = html;
      const srcs = collectSrcs(html);
      for (const { src } of srcs) {
        const local = join(
          UPLOAD_ROOT,
          decodeURI(src).replace(/^\/uploads\/legacy\//, ''),
        );
        if (await fileExists(local)) continue;
        const name = basename(decodeURI(src)).toLowerCase();
        const candidates = idx.get(name);
        if (!candidates || candidates.length === 0) {
          imgsUnmatched++;
          unmatched.push(src);
          continue;
        }
        if (candidates.length > 1) {
          imgsAmbiguous++;
          continue;
        }
        const newSrc = `/uploads/legacy/${candidates[0]
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`;
        next = next.split(src).join(newSrc);
        imgsRewritten++;
      }
      if (next !== html) changed = true;
      nextObj[lang] = next;
    }

    if (!changed) continue;
    await prisma.post.update({
      where: { id: post.id },
      data: { body: nextObj as unknown as Prisma.InputJsonValue },
    });
    postsTouched++;
  }

  console.log(
    `Posts touched: ${postsTouched}, imgs rewritten: ${imgsRewritten}, ambiguous: ${imgsAmbiguous}, unmatched: ${imgsUnmatched}`,
  );
  if (unmatched.length > 0) {
    console.log('Unmatched samples:');
    for (const s of unmatched.slice(0, 20)) console.log('  ', s);
  }
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
