/**
 * apply-translations.ts — ghi bản dịch tiếng Anh vào layout.
 *
 * Đọc _batch.json (slug/kind/vi đã trích) + _translated.json (slug/kind/en do
 * Claude dịch, CÙNG THỨ TỰ). Với mỗi khối, tìm trong cây layout (cả puckData nháp
 * lẫn publishedPuckData) ô có vi khớp và en đang TRỐNG hoặc TRÙNG vi, rồi đặt en.
 * KHÔNG đụng ô đã có bản dịch thật (idempotent, an toàn chạy lại).
 *
 * Chạy (mặc định chỉ liệt kê; thêm --apply để ghi):
 *   $env:DATABASE_URL="...@localhost:15432/..."
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/apply-translations.ts
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/apply-translations.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
      keepAlive: true,
      idleTimeoutMillis: 0,
    }),
  ),
});

const APPLY = process.argv.includes('--apply');
const dir = __dirname;

type Batch = { slug: string; kind: 'html' | 'title'; vi: string };
type Trans = { slug: string; kind: 'html' | 'title'; en: string };
type Job = { kind: 'html' | 'title'; vi: string; en: string };

const batch: Batch[] = JSON.parse(readFileSync(join(dir, '_batch.json'), 'utf8'));
const trans: Trans[] = JSON.parse(
  readFileSync(join(dir, '_translated.json'), 'utf8'),
);
if (batch.length !== trans.length) {
  throw new Error(`Lệch số lượng: batch=${batch.length} trans=${trans.length}`);
}

const bySlug = new Map<string, Job[]>();
for (let i = 0; i < batch.length; i++) {
  const b = batch[i];
  const t = trans[i];
  if (b.slug !== t.slug || b.kind !== t.kind) {
    throw new Error(`Lệch thứ tự tại ${i}: ${b.slug}/${b.kind} vs ${t.slug}/${t.kind}`);
  }
  if (!bySlug.has(b.slug)) bySlug.set(b.slug, []);
  bySlug.get(b.slug)?.push({ kind: b.kind, vi: b.vi, en: t.en });
}

function applyToTree(tree: unknown, jobs: Job[]): number {
  let n = 0;
  const content = (tree as { content?: unknown[] })?.content;
  if (!Array.isArray(content)) return 0;
  for (const node of content) {
    const nn = node as { type?: string; props?: Record<string, unknown> };
    const props = nn?.props;
    if (!props) continue;

    if (nn.type === 'PageHero') {
      const title = props.title as { vi?: string; en?: string } | undefined;
      if (title && typeof title === 'object') {
        for (const j of jobs) {
          if (j.kind !== 'title' || !j.en) continue;
          if ((title.vi ?? '').trim() !== j.vi.trim()) continue;
          const cur = title.en ?? '';
          if (!cur || cur === title.vi) {
            title.en = j.en;
            n++;
          }
        }
      }
    }

    const doHtml = (h: unknown) => {
      const o = h as { vi?: string; en?: string } | undefined;
      if (!o || typeof o !== 'object') return;
      for (const j of jobs) {
        if (j.kind !== 'html' || !j.en) continue;
        if ((o.vi ?? '') !== j.vi) continue;
        const cur = o.en ?? '';
        if (!cur || cur === o.vi) {
          o.en = j.en;
          n++;
        }
      }
    };
    doHtml(props.html);
    const sections = props.sections;
    if (Array.isArray(sections)) {
      for (const s of sections) doHtml((s as { html?: unknown })?.html);
    }
  }
  return n;
}

async function main(): Promise<void> {
  const slugs = [...bySlug.keys()];
  const layouts = await prisma.pageLayout.findMany({
    where: { slug: { in: slugs }, deletedAt: null },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
  });

  let touched = 0;
  let total = 0;
  for (const l of layouts) {
    const jobs = bySlug.get(l.slug);
    if (!jobs) continue;
    const draft = l.puckData as unknown;
    const pub = l.publishedPuckData as unknown;
    const n = applyToTree(draft, jobs) + applyToTree(pub, jobs);
    if (n === 0) continue;
    touched++;
    total += n;
    console.log(`  + ${l.slug}: ${n} ô`);
    if (APPLY) {
      await prisma.pageLayout.update({
        where: { id: l.id },
        data: {
          puckData: draft as Prisma.InputJsonValue,
          ...(pub ? { publishedPuckData: pub as Prisma.InputJsonValue } : {}),
        },
      });
    }
  }

  const found = new Set(layouts.map((l) => l.slug));
  for (const s of slugs) if (!found.has(s)) console.log(`  ! không thấy layout: ${s}`);

  console.log(
    `\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. layout=${touched} ô=${total}`,
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
