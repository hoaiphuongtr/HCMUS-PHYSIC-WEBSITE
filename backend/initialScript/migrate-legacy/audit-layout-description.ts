/**
 * audit-layout-description.ts — soi ô "Mô tả" của các layout đã xuất bản.
 *
 * Mô tả này đi THẲNG ra thẻ <meta name="description"> công khai và ra ảnh chia sẻ
 * (xem `layout.description ??` trong app/[locale]/[...slug]/page.tsx). Nên ghi chú
 * nội bộ kiểu "Trang chủ mới - layout quốc tế, full-screen hero, animations" là
 * đang hiện ra cho người ngoài + Google đọc.
 *
 * Bỏ trống thì trang tự dùng mô tả mặc định chuẩn — thà trống còn hơn ghi chú kỹ thuật.
 *
 * Liệt kê (chỉ đọc):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/audit-layout-description.ts
 * Sửa một trang:
 *   ... audit-layout-description.ts --set trang-chu "Mô tả mới"
 * Xoá mô tả (để trang dùng mặc định):
 *   ... audit-layout-description.ts --clear trang-chu
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.slice(i + 1) : null;
};

/**
 * Tìm layout theo slug để SỬA.
 *
 * `slug` KHÔNG phải khoá duy nhất trong schema — một slug có thể ứng với nhiều
 * bản (bản nháp cũ, bản đã xoá mềm). `findFirst` trần dễ vớ nhầm bản không phải
 * bản đang chạy ngoài site, sửa xong nhìn ngoài vẫn y nguyên. Ở đây chỉ nhận
 * bản ĐÃ XUẤT BẢN và CHƯA XOÁ; nếu vẫn nhiều hơn một thì dừng để người xem lại.
 */
async function resolveLayout(slug: string): Promise<string | null> {
  const all = await prisma.pageLayout.findMany({
    where: { slug },
    select: { id: true, isPublished: true, deletedAt: true },
  });
  if (!all.length) {
    console.error(`Không có layout nào slug = ${slug}`);
    return null;
  }
  const live = all.filter((l) => l.isPublished && !l.deletedAt);
  if (all.length > 1) {
    console.log(
      `Lưu ý: slug "${slug}" có ${all.length} bản ` +
        `(đang xuất bản & chưa xoá: ${live.length}).`,
    );
  }
  if (live.length === 1) return live[0].id;
  if (live.length > 1) {
    console.error(
      `Có ${live.length} bản cùng đang xuất bản — không đoán được, hãy xử lý tay.`,
    );
    return null;
  }
  console.error(
    `Không bản nào của "${slug}" đang xuất bản (tìm thấy ${all.length} bản nháp/đã xoá).`,
  );
  return null;
}

/** Dấu hiệu ghi chú kỹ thuật lọt ra ngoài. */
const DEV_NOTE = /\b(layout|hero|search bar|animation|responsive|full-?screen|test|demo|todo|fix|wip|css|puck)\b/i;

async function main(): Promise<void> {
  const set = flag('--set');
  const clear = flag('--clear');

  if (set) {
    const [slug, ...rest] = set;
    const text = rest.join(' ').trim();
    if (!slug || !text) {
      console.error('Dùng: --set <slug> "mô tả mới"');
      process.exitCode = 1;
    } else {
      const id = await resolveLayout(slug);
      if (!id) {
        process.exitCode = 1;
      } else {
        const u = await prisma.pageLayout.update({
          where: { id },
          data: { description: text },
          select: { slug: true, description: true },
        });
        console.log(`Đã đặt mô tả cho ${u.slug}:\n  ${u.description}`);
      }
    }
    await prisma.$disconnect();
    return;
  }

  if (clear) {
    const slug = clear[0];
    // Thiếu slug mà vẫn chạy thì trước đây sẽ xoá mô tả của MỘT layout bất kỳ.
    if (!slug) {
      console.error('Dùng: --clear <slug>');
      process.exitCode = 1;
      await prisma.$disconnect();
      return;
    }
    const id = await resolveLayout(slug);
    if (!id) {
      process.exitCode = 1;
    } else {
      const u = await prisma.pageLayout.update({
        where: { id },
        data: { description: null },
        select: { slug: true },
      });
      console.log(`Đã xoá mô tả của ${u.slug} — trang sẽ dùng mô tả mặc định.`);
    }
    await prisma.$disconnect();
    return;
  }

  const rows = await prisma.pageLayout.findMany({
    where: { isPublished: true, deletedAt: null, description: { not: null } },
    select: { slug: true, description: true },
    orderBy: { slug: 'asc' },
  });

  const suspect = rows.filter((r) => DEV_NOTE.test(r.description ?? ''));
  const rest = rows.filter((r) => !DEV_NOTE.test(r.description ?? ''));

  console.log(`Layout đã xuất bản CÓ mô tả: ${rows.length}\n`);
  console.log(`${'='.repeat(64)}`);
  console.log(`NGHI LÀ GHI CHÚ KỸ THUẬT (${suspect.length}) — nên sửa hoặc xoá:`);
  for (const r of suspect) console.log(`\n  ${r.slug}\n    ${r.description}`);

  console.log(`\n${'='.repeat(64)}`);
  console.log(`Mô tả trông bình thường (${rest.length}) — liệt kê 20 cái đầu:`);
  for (const r of rest.slice(0, 20))
    console.log(`  ${r.slug}\n    ${(r.description ?? '').slice(0, 120)}`);

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
