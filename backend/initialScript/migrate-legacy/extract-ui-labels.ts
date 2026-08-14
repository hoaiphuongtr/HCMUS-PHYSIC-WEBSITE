/**
 * extract-ui-labels.ts — quét mọi NHÃN UI song ngữ chưa dịch trong layout.
 *
 * Đi đệ quy khắp cây puckData/publishedPuckData, tìm mọi giá trị dạng {vi,en}
 * NGẮN (nút, label, CTA, phụ đề — bỏ khối HTML dài) mà bản EN đang trống hoặc
 * trùng VI. Gộp trùng theo nội dung VI → thường chỉ vài chục nhãn lặp lại nhiều.
 * Ghi _ui_labels.json (distinct) để Claude dịch. CHỈ ĐỌC.
 *
 *   $env:DATABASE_URL="...@localhost:15432/..."
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/extract-ui-labels.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL, keepAlive: true, idleTimeoutMillis: 0 }),
  ),
});

const MAXLEN = 200; // nhãn UI: bỏ qua khối dài (bài/HTML)
const counts = new Map<string, number>(); // vi -> số lần xuất hiện (en trống/trùng)

const looksLikeLabel = (vi: string) =>
  vi.length > 0 && vi.length <= MAXLEN && !vi.includes('<') && !/\n/.test(vi);

function walk(v: unknown): void {
  if (v == null) return;
  if (Array.isArray(v)) {
    for (const x of v) walk(x);
    return;
  }
  if (typeof v !== 'object') return;
  const o = v as Record<string, unknown>;
  // Giá trị song ngữ {vi,en}?
  if (typeof o.vi === 'string' && ('en' in o || Object.keys(o).length <= 3)) {
    const vi = o.vi.trim();
    const en = typeof o.en === 'string' ? o.en.trim() : '';
    if (looksLikeLabel(vi) && (!en || en === vi)) {
      counts.set(vi, (counts.get(vi) ?? 0) + 1);
    }
    // vẫn đi sâu (phòng trường hợp lồng), nhưng bỏ vi/en để đỡ nhiễu
  }
  for (const [k, val] of Object.entries(o)) {
    if (k === 'vi' || k === 'en') continue;
    walk(val);
  }
}

async function main(): Promise<void> {
  let cursor: string | undefined;
  let scanned = 0;
  for (;;) {
    const page = await prisma.pageLayout.findMany({
      where: { deletedAt: null },
      select: { id: true, puckData: true, publishedPuckData: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!page.length) break;
    cursor = page[page.length - 1].id;
    scanned += page.length;
    for (const l of page) {
      walk(l.publishedPuckData);
      walk(l.puckData);
    }
    process.stdout.write(`\rĐã quét ${scanned} layout | nhãn phân biệt ${counts.size}   `);
  }

  const distinct = [...counts.entries()]
    .map(([vi, n]) => ({ vi, n }))
    .sort((a, b) => b.n - a.n);
  writeFileSync(join(__dirname, '_ui_labels.json'), JSON.stringify(distinct, null, 2), 'utf8');
  const totalOccurrences = distinct.reduce((s, d) => s + d.n, 0);
  console.log(
    `\n\nQuét ${scanned} layout. Nhãn UI chưa dịch: ${distinct.size ?? distinct.length} phân biệt / ${totalOccurrences} lần xuất hiện -> _ui_labels.json`,
  );
  console.log('\nTop 25 nhãn lặp nhiều nhất:');
  for (const d of distinct.slice(0, 25)) console.log(`  ${String(d.n).padStart(4)}x  ${d.vi.slice(0, 70)}`);
  await prisma.$disconnect();
}

main().catch((e: unknown) => { console.error(e); void prisma.$disconnect(); process.exit(1); });
