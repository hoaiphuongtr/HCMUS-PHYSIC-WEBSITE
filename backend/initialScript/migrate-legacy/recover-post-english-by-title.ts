/**
 * recover-post-english-by-title.ts — khôi phục EN cho bài KHÔNG có legacyId
 * (bài tạo lại trong CMS) bằng cách DÒ THEO TIÊU ĐỀ với bản dump.
 *
 * recover-post-english.ts dò theo legacyId nên bỏ sót các bài mới (legacyId trống)
 * dù dump có bản Anh thật của cùng bài. Script này chuẩn hoá tiêu đề VI rồi so
 * khớp với dump; khớp + dump có EN thật (khác VI) thì điền title.en/body.en.
 * Chỉ điền khi ô EN đang trống HOẶC trùng VI. Idempotent.
 *
 *   $env:DATABASE_URL="...@localhost:15432/..."
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/recover-post-english-by-title.ts
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/recover-post-english-by-title.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { decodeEntities, ensureTableBorderAttr, transformLegacyHtml } from './legacy-html';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL, keepAlive: true, idleTimeoutMillis: 0 }),
  ),
});
const APPLY = process.argv.includes('--apply');

type LangRec = { title: string; content: string; excerpt: string };
type Entry = { vi?: LangRec; en?: LangRec };
const MAP: Record<string, Entry> = JSON.parse(readFileSync(join(__dirname, '_post_lang.json'), 'utf8'));

// Chuẩn hoá tiêu đề để so khớp: bỏ entity/dấu câu/hoa-thường/khoảng trắng thừa.
const norm = (s: string): string =>
  decodeEntities(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Bản đồ tiêu-đề-chuẩn-hoá -> dump entry CÓ tiếng Anh thật (title EN khác VI).
const byTitle = new Map<string, Entry>();
for (const e of Object.values(MAP)) {
  const vt = (e.vi?.title ?? '').trim();
  const et = (e.en?.title ?? '').trim();
  if (!vt || vt.length < 20) continue; // tránh khớp nhầm tiêu đề quá ngắn
  if (!et || et === vt) continue; // dump không có EN thật -> bỏ
  const key = norm(vt);
  if (key && !byTitle.has(key)) byTitle.set(key, e);
}

const asObj = (v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as { vi?: string; en?: string }) : null;
const needs = (o: { vi?: string; en?: string }) => {
  const en = (o.en ?? '').trim();
  return !en || en === (o.vi ?? '').trim();
};

async function main(): Promise<void> {
  let cursor: string | undefined;
  let scanned = 0;
  let matched = 0;
  let fTitle = 0;
  let fBody = 0;
  const samples: string[] = [];

  for (;;) {
    const page = await prisma.post.findMany({
      where: { deletedAt: null },
      select: { id: true, legacyId: true, title: true, body: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!page.length) break;
    cursor = page[page.length - 1].id;
    scanned += page.length;

    for (const p of page) {
      const title = asObj(p.title);
      if (!title?.vi) continue;
      // Chỉ xử bài đang thiếu EN (trống/trùng VI) ở tiêu đề hoặc thân
      const body = asObj(p.body);
      const titleNeeds = needs(title);
      const bodyNeeds = body ? needs(body) : false;
      if (!titleNeeds && !bodyNeeds) continue;

      const src = byTitle.get(norm(title.vi));
      if (!src?.en) continue;
      matched++;
      let changed = false;

      if (titleNeeds) {
        const enT = (src.en.title ?? '').trim();
        const viT = (src.vi?.title ?? '').trim();
        if (enT && enT !== viT) { title.en = decodeEntities(src.en.title); fTitle++; changed = true; }
      }
      if (body && bodyNeeds) {
        const enB = (src.en.content ?? '').trim();
        const viB = (src.vi?.content ?? '').trim();
        if (enB && enB !== viB) {
          body.en = ensureTableBorderAttr(transformLegacyHtml(src.en.content));
          fBody++; changed = true;
        }
      }
      if (changed && samples.length < 15) samples.push(`  ${p.legacyId ?? '—'}  ${title.vi.slice(0, 55)}`);
      if (changed && APPLY) {
        await prisma.post.update({
          where: { id: p.id },
          data: { title: p.title as Prisma.InputJsonValue, ...(body ? { body: p.body as Prisma.InputJsonValue } : {}) },
        });
      }
    }
    process.stdout.write(`\rQuét ${scanned} bài | khớp tiêu đề ${matched} | điền tiêu đề ${fTitle} thân ${fBody}   `);
  }

  console.log(`\n\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply)'}. quét=${scanned} khớp=${matched} tiêu đề=${fTitle} thân bài=${fBody}`);
  if (samples.length) { console.log('\nMẫu bài được vá:'); console.log(samples.join('\n')); }
  await prisma.$disconnect();
}
main().catch((e: unknown) => { console.error(e); void prisma.$disconnect(); process.exit(1); });
