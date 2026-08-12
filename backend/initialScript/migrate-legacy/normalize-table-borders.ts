/**
 * normalize-table-borders.ts — vá nội dung ĐÃ LƯU mà thẻ <table> thiếu thuộc
 * tính `border`.
 *
 * Trang công khai nhận diện "bảng dữ liệu" (để kẻ đường và ép bố cục cột) dựa
 * vào dấu hiệu trong chính HTML. Nội dung lấy từ trang render của site cũ không
 * còn thuộc tính đó, còn nội dung lấy từ dump thì có — nên hai bản ngôn ngữ của
 * cùng một trang hiện khác hẳn nhau. Đo trên trang Giảng viên cơ hữu: bản Việt
 * 28/28 bảng được nhận diện, bản Anh chỉ 15/27, 12 bảng còn lại mất đường kẻ và
 * ảnh chồng lên chữ.
 *
 * Script chỉ thêm `border="0"` vào thẻ <table> nào CHƯA có thuộc tính border —
 * không đụng nội dung, không đổi thuộc tính đã có.
 *
 * Chạy (mặc định chỉ đếm, thêm --apply để ghi thật):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/normalize-table-borders.ts
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/normalize-table-borders.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { ensureTableBorderAttr } from './legacy-html';
import { flushCache } from './flush-cache';

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

/** Số thẻ <table> chưa có thuộc tính border trong một chuỗi HTML. */
function countMissing(html: string): number {
  const tables = html.match(/<table\b[^>]*>/gi) ?? [];
  return tables.filter((t) => !/\bborder\s*=/i.test(t)).length;
}

/**
 * Duyệt cây Puck, sửa tại chỗ mọi ô html (kể cả trong sections).
 *
 * CHỈ vá khi bản ngôn ngữ KIA của cùng khối có `border=` mà bản này không —
 * đúng dấu hiệu "một bản lấy từ dump, bản kia lấy từ trang render". Không vá
 * đại trà: nhiều trang legacy vốn có bảng bố cục không viền ở CẢ hai ngôn ngữ,
 * thêm thuộc tính vào đó sẽ tự dưng kẻ khung cho chúng.
 */
function normalizeTree(tree: unknown): number {
  let patched = 0;
  const hasBorderAttr = (html: string) =>
    (html.match(/<table\b[^>]*>/gi) ?? []).some((t) => /\bborder\s*=/i.test(t));

  const fixLocalized = (node: Record<string, unknown> | undefined) => {
    if (!node) return;
    const vi = typeof node.vi === 'string' ? node.vi : '';
    const en = typeof node.en === 'string' ? node.en : '';
    if (!vi.includes('<table') || !en.includes('<table')) return;
    for (const [lang, self, other] of [
      ['vi', vi, en],
      ['en', en, vi],
    ] as const) {
      const missing = countMissing(self);
      if (missing === 0 || !hasBorderAttr(other)) continue;
      node[lang] = ensureTableBorderAttr(self);
      patched += missing;
    }
  };

  const content = (tree as { content?: unknown[] })?.content;
  if (!Array.isArray(content)) return 0;
  for (const item of content) {
    const props = (item as { props?: Record<string, unknown> })?.props;
    if (!props) continue;
    fixLocalized(props.html as Record<string, unknown> | undefined);
    const sections = props.sections;
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        fixLocalized((sec as { html?: Record<string, unknown> })?.html);
      }
    }
  }
  return patched;
}

async function main(): Promise<void> {
  const layouts = await prisma.pageLayout.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
  });

  let touchedLayouts = 0;
  let patchedTables = 0;

  for (const layout of layouts) {
    const draft = layout.puckData as unknown;
    const published = layout.publishedPuckData as unknown;
    const n = normalizeTree(draft) + normalizeTree(published);
    if (n === 0) continue;
    touchedLayouts += 1;
    patchedTables += n;
    console.log(`  + ${layout.slug}: ${n} bảng`);
    if (!APPLY) continue;
    await prisma.pageLayout.update({
      where: { id: layout.id },
      data: {
        puckData: draft as Prisma.InputJsonValue,
        ...(published
          ? { publishedPuckData: published as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  console.log(
    `\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. ` +
      `layout=${touchedLayouts} bảng đã vá=${patchedTables}`,
  );
  if (APPLY) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
