import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const recs = JSON.parse(readFileSync(join(here, '_untranslated.json'), 'utf8'));

const cat = (s) => {
  if (s.startsWith('mon-hoc/')) return 'mon-hoc (đề cương)';
  if (s.includes('/nhan-su/') || s.startsWith('nhan-su/')) return 'nhan-su (lý lịch)';
  if (s.includes('/lop-hoc/')) return 'lop-hoc (danh sách lớp/HB)';
  if (s.includes('/huong-nghien-cuu/')) return 'huong-nghien-cuu';
  if (s.includes('/tin-tuc/') || s.includes('bai-bao') || s.includes('hoi-nghi')) return 'tin-tuc/bài báo';
  return 'TRANG CHÍNH (ưu tiên)';
};

const bySlug = new Map();
for (const r of recs) {
  const e = bySlug.get(r.slug) ?? { chars: 0, blocks: 0 };
  e.chars += r.vi.length; e.blocks += 1;
  bySlug.set(r.slug, e);
}

const byCat = new Map();
for (const [slug, e] of bySlug) {
  const c = cat(slug);
  const g = byCat.get(c) ?? { chars: 0, pages: 0 };
  g.chars += e.chars; g.pages += 1;
  byCat.set(c, g);
}

console.log('=== THEO NHÓM ===');
for (const [c, g] of [...byCat.entries()].sort((a, b) => b[1].chars - a[1].chars))
  console.log(`${String(g.pages).padStart(3)} trang  ${String(Math.round(g.chars/1000)).padStart(5)}k ký tự  ${c}`);

console.log('\n=== TRANG CHÍNH (ưu tiên) — từng trang, sắp theo ký tự ===');
for (const [slug, e] of [...bySlug.entries()].filter(([s]) => cat(s) === 'TRANG CHÍNH (ưu tiên)').sort((a, b) => a[1].chars - b[1].chars))
  console.log(`${String(e.chars).padStart(6)} ký tự  ${e.blocks}b  ${slug}`);
