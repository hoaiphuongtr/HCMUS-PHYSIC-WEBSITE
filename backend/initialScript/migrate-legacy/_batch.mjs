import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const recs = JSON.parse(readFileSync(join(here, '_untranslated.json'), 'utf8'));

// Batch 2: hướng nghiên cứu + nhân sự (lý lịch GV). Bỏ khối > 4500 (nếu có).
const inBatch = (s) =>
  s.includes('/huong-nghien-cuu/') ||
  s.includes('/nhan-su/') ||
  s.startsWith('nhan-su/');

const batch = recs.filter((r) => inBatch(r.slug) && r.vi.length <= 4500);

writeFileSync(join(here, '_batch.json'), JSON.stringify(batch, null, 2), 'utf8');
const chars = batch.reduce((n, r) => n + r.vi.length, 0);
console.log(`Batch: ${batch.length} khối / ${new Set(batch.map((r) => r.slug)).size} trang / ${chars.toLocaleString()} ký tự -> _batch.json`);
for (const r of batch.sort((a, b) => a.vi.length - b.vi.length))
  console.log(`  ${String(r.vi.length).padStart(5)}  ${r.kind}  ${r.slug}`);
