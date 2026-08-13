/**
 * recover-post-english.ts — khôi phục nội dung TIẾNG ANH cho bài viết từ dump gốc.
 *
 * Nguồn: _post_lang.json (do parse-legacy-postslang.mjs sinh từ bảng postslang).
 * Ghép: Post.legacyId == postslang.postid. Điền title.en / body.en / excerpt.en
 * cho các bài mà ô EN đang TRỐNG hoặc TRÙNG tiếng Việt, CHỈ KHI dump có bản EN
 * thật (khác bản VN của chính dump). Xử lý HTML bằng đúng bộ hàm di trú.
 *
 * Chạy theo trang (idempotent — chạy lại an toàn, bài đã điền sẽ bỏ qua):
 *   $env:DATABASE_URL="...@localhost:15432/..."
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/recover-post-english.ts
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/recover-post-english.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  decodeEntities,
  ensureTableBorderAttr,
  transformLegacyHtml,
} from './legacy-html';

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
const PAGE = 100;

type LangRec = { title: string; content: string; excerpt: string };
type Entry = { vi?: LangRec; en?: LangRec };
const MAP: Record<string, Entry> = JSON.parse(
  readFileSync(join(__dirname, '_post_lang.json'), 'utf8'),
);

type Loc = { vi?: string; en?: string } | null | undefined;
const asObj = (v: unknown): { vi?: string; en?: string } | null =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as { vi?: string; en?: string })
    : null;

/** Ô EN của bài đang cần điền? (trống hoặc trùng VN) */
const needs = (o: { vi?: string; en?: string }): boolean => {
  const en = (o.en ?? '').trim();
  return !en || en === (o.vi ?? '').trim();
};

async function main(): Promise<void> {
  let cursor: string | undefined;
  let scanned = 0;
  let touched = 0;
  let fTitle = 0;
  let fBody = 0;
  let fExcerpt = 0;

  for (;;) {
    const page = await prisma.post.findMany({
      where: { legacyId: { not: null }, deletedAt: null },
      select: { id: true, legacyId: true, title: true, body: true, excerpt: true },
      orderBy: { id: 'asc' },
      take: PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (page.length === 0) break;
    cursor = page[page.length - 1].id;
    scanned += page.length;

    for (const p of page) {
      const src = p.legacyId != null ? MAP[String(p.legacyId)] : undefined;
      if (!src?.en) continue;
      const srcVi = src.vi;
      let changed = false;

      const title = asObj(p.title as Loc);
      if (title && needs(title)) {
        const enT = (src.en.title ?? '').trim();
        const viT = (srcVi?.title ?? '').trim();
        if (enT && enT !== viT) {
          title.en = decodeEntities(src.en.title);
          fTitle++;
          changed = true;
        }
      }

      const body = asObj(p.body as Loc);
      if (body && needs(body)) {
        const enB = (src.en.content ?? '').trim();
        const viB = (srcVi?.content ?? '').trim();
        if (enB && enB !== viB) {
          body.en = ensureTableBorderAttr(transformLegacyHtml(src.en.content));
          fBody++;
          changed = true;
        }
      }

      const excerpt = asObj(p.excerpt as Loc);
      if (excerpt && needs(excerpt)) {
        const enE = (src.en.excerpt ?? '').trim();
        const viE = (srcVi?.excerpt ?? '').trim();
        if (enE && enE !== viE) {
          excerpt.en = decodeEntities(src.en.excerpt);
          fExcerpt++;
          changed = true;
        }
      }

      if (!changed) continue;
      touched++;
      if (APPLY) {
        await prisma.post.update({
          where: { id: p.id },
          data: {
            title: p.title as Prisma.InputJsonValue,
            ...(body ? { body: p.body as Prisma.InputJsonValue } : {}),
            ...(excerpt ? { excerpt: p.excerpt as Prisma.InputJsonValue } : {}),
          },
        });
      }
    }
    process.stdout.write(
      `\rĐã quét ${scanned} bài | sẽ sửa ${touched} (tiêu đề ${fTitle}, thân ${fBody}, tóm tắt ${fExcerpt})   `,
    );
  }

  console.log(
    `\n\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. ` +
      `quét=${scanned} bài sửa=${touched} | tiêu đề=${fTitle} thân bài=${fBody} tóm tắt=${fExcerpt}`,
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
