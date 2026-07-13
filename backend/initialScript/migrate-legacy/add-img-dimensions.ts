// Ghi width/height vào <img src="/uploads/legacy/..."> trong Post.body và puckData của PageLayout
// (đọc kích thước từ tệp thật) — loại trừ dịch chuyển bố cục (CLS) cho nội dung di trú.
import { join } from "node:path";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});
const UPLOADS = join(__dirname, "../../uploads");
const dimCache = new Map<string, { w: number; h: number } | null>();

async function dims(src: string) {
  if (dimCache.has(src)) return dimCache.get(src)!;
  let out: { w: number; h: number } | null = null;
  try {
    const p = join(UPLOADS, decodeURIComponent(src.replace(/^\/uploads\//, "")));
    if (existsSync(p)) {
      const m = await sharp(p).metadata();
      if (m.width && m.height) out = { w: m.width, h: m.height };
    }
  } catch {}
  dimCache.set(src, out);
  return out;
}

const IMG_RE = /<img\b([^>]*?)src=["'](\/uploads\/legacy\/[^"']+)["']([^>]*?)>/gi;

async function fixHtml(html: string): Promise<[string, number]> {
  let n = 0;
  const jobs: Array<Promise<void>> = [];
  const parts: { m: RegExpExecArray; rep?: string }[] = [];
  let match: RegExpExecArray | null;
  IMG_RE.lastIndex = 0;
  while ((match = IMG_RE.exec(html))) parts.push({ m: match });
  for (const part of parts) {
    const [full, pre, src, post] = part.m;
    if (/\bwidth\s*=/.test(pre + post)) continue;
    jobs.push(dims(src).then((d) => {
      if (d) { part.rep = `<img${pre}src="${src}" width="${d.w}" height="${d.h}"${post}>`; }
    }));
  }
  await Promise.all(jobs);
  let out = html;
  for (const part of parts.reverse()) {
    if (!part.rep) continue;
    out = out.slice(0, part.m.index) + part.rep + out.slice(part.m.index + part.m[0].length);
    n++;
  }
  return [out, n];
}

async function fixTree(node: any): Promise<number> {
  let n = 0;
  if (typeof node !== "object" || node === null) return 0;
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (typeof v === "string" && v.includes("/uploads/legacy/") && v.includes("<img")) {
      const [nv, c] = await fixHtml(v);
      node[k] = nv; n += c;
    } else if (typeof v === "object" && v !== null) n += await fixTree(v);
  }
  return n;
}

(async () => {
  let posts = 0, imgs = 0;
  const all = await prisma.post.findMany({ select: { id: true, body: true } });
  for (const p of all) {
    if (!p.body) continue;
    const n = await fixTree(p.body as any);
    if (n) { await prisma.post.update({ where: { id: p.id }, data: { body: p.body as any } }); posts++; imgs += n; }
  }
  console.log(`Post: sửa ${posts} bài, ${imgs} ảnh`);
  let layouts = 0, limgs = 0;
  const ls = await prisma.pageLayout.findMany({ select: { id: true, puckData: true, publishedPuckData: true } });
  for (const l of ls) {
    let n = 0;
    if (l.puckData) n += await fixTree(l.puckData as any);
    if (l.publishedPuckData) n += await fixTree(l.publishedPuckData as any);
    if (n) {
      await prisma.pageLayout.update({ where: { id: l.id },
        data: { puckData: l.puckData as any, publishedPuckData: l.publishedPuckData as any } });
      layouts++; limgs += n;
    }
  }
  console.log(`PageLayout: sửa ${layouts} bố cục, ${limgs} ảnh`);
  await prisma.$disconnect();
})();
