/**
 * diag-post-en.ts — soi vì sao các bài thiếu EN không khôi phục được.
 * Với mỗi bài (có legacyId) mà ô EN tiêu đề/thân đang trống, tra _post_lang.json
 * và phân loại: dump không có bài / không có langid2 / EN trống / EN trùng VI /
 * CÓ EN THẬT (đáng lẽ khôi phục được = nghi lỗi link/di trú). CHỈ ĐỌC.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL, keepAlive: true, idleTimeoutMillis: 0 }),
  ),
});
const MAP: Record<string, { vi?: { title: string; content: string }; en?: { title: string; content: string } }> =
  JSON.parse(readFileSync(join(__dirname, '_post_lang.json'), 'utf8'));

const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as { vi?: string; en?: string }) : null);
const needs = (o: { vi?: string; en?: string }) => { const en = (o.en ?? '').trim(); return !en || en === (o.vi ?? '').trim(); };

function classify(legacyId: number, kind: 'title' | 'content'): string {
  const src = MAP[String(legacyId)];
  if (!src) return 'dump_khong_co_bai';
  if (!src.en) return 'dump_khong_co_langid2';
  const en = (src.en[kind] ?? '').trim();
  const vi = (src.vi?.[kind] ?? '').trim();
  if (!en) return 'dump_EN_trong';
  if (en === vi) return 'dump_EN_trung_VI';
  return 'CO_EN_THAT_bi_bo_sot';
}

async function main(): Promise<void> {
  let cursor: string | undefined;
  const tallyT: Record<string, number> = {};
  const tallyB: Record<string, number> = {};
  const missedSamples: string[] = [];
  for (;;) {
    const page = await prisma.post.findMany({
      where: { legacyId: { not: null }, deletedAt: null },
      select: { id: true, legacyId: true, title: true, body: true },
      orderBy: { id: 'asc' },
      take: 200,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!page.length) break;
    cursor = page[page.length - 1].id;
    for (const p of page) {
      const lid = p.legacyId as number;
      const t = obj(p.title);
      if (t && needs(t)) {
        const c = classify(lid, 'title');
        tallyT[c] = (tallyT[c] ?? 0) + 1;
        if (c === 'CO_EN_THAT_bi_bo_sot' && missedSamples.length < 12)
          missedSamples.push(`  legacyId ${lid}: EN="${(MAP[String(lid)].en!.title).slice(0, 60)}"`);
      }
      const b = obj(p.body);
      if (b && needs(b)) {
        const c = classify(lid, 'content');
        tallyB[c] = (tallyB[c] ?? 0) + 1;
      }
    }
    if (page.length < 200) break;
  }
  const show = (name: string, t: Record<string, number>) => {
    console.log(`\n=== ${name} ===`);
    for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
  };
  show('TIÊU ĐỀ thiếu EN — phân loại', tallyT);
  show('THÂN BÀI thiếu EN — phân loại', tallyB);
  if (missedSamples.length) {
    console.log('\n=== MẪU "CÓ EN THẬT bị bỏ sót" (nếu có = lỗi link/di trú) ===');
    console.log(missedSamples.join('\n'));
  }
  await prisma.$disconnect();
}
main().catch((e: unknown) => { console.error(e); void prisma.$disconnect(); process.exit(1); });
