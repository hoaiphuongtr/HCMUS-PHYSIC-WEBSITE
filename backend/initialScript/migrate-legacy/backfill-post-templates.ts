/**
 * backfill-post-templates.ts — bật cờ `isPostTemplate` cho các layout đang được
 * dùng làm mẫu tạo bài.
 *
 * VÌ SAO CẦN: trước đây hệ thống SUY ĐOÁN layout mẫu bằng
 * `categoryId != null && sourcePostId == null`. Nay đổi sang cờ tường minh, nên
 * nếu không backfill thì sau khi deploy danh sách mẫu RỖNG và không ai tạo được
 * bài mới. Chạy script này NGAY SAU khi thêm cột.
 *
 * Mặc định chỉ liệt kê (chỉ đọc):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/backfill-post-templates.ts
 * Bật cờ cho các layout liệt kê ở trên:
 *   ... backfill-post-templates.ts --apply
 * Bật/tắt thủ công một layout:
 *   ... backfill-post-templates.ts --set <slug> on|off
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const args = process.argv.slice(2);
// --apply     : CHỈ bật cho 2 mẫu hệ thống vốn đang dùng (an toàn — giữ y
//               nguyên hành vi hiện tại).
// --apply-all : bật cho MỌI ứng viên theo luật suy đoán cũ, tức đúng đống hỗn
//               tạp mà ta đang muốn dọn. Cân nhắc kỹ.
const APPLY = args.includes('--apply');
const APPLY_ALL = args.includes('--apply-all');

/** Hai mẫu trình soạn bài vốn ép cứng — xem KIND_TEMPLATE bên frontend. */
const KNOWN_TEMPLATE_IDS = ['cat_tmpl_scientific-information', 'cat_tmpl_event'];
const setIdx = args.indexOf('--set');
const setArgs = setIdx >= 0 ? args.slice(setIdx + 1) : null;

async function main(): Promise<void> {
  if (setArgs) {
    const [slug, onOff] = setArgs;
    if (!slug || (onOff !== 'on' && onOff !== 'off')) {
      console.error('Dùng: --set <slug> on|off');
      process.exitCode = 1;
      await prisma.$disconnect();
      return;
    }
    const found = await prisma.pageLayout.findMany({
      where: { slug, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!found.length) {
      console.error(`Không có layout nào slug = ${slug}`);
      process.exitCode = 1;
    } else if (found.length > 1) {
      console.error(`slug "${slug}" có ${found.length} bản — xử lý tay cho chắc.`);
      process.exitCode = 1;
    } else {
      await prisma.pageLayout.update({
        where: { id: found[0].id },
        data: { isPostTemplate: onOff === 'on' },
      });
      console.log(
        `${onOff === 'on' ? 'ĐÃ ĐÁNH DẤU' : 'ĐÃ BỎ ĐÁNH DẤU'} mẫu: ${found[0].name} [${slug}]`,
      );
    }
    await prisma.$disconnect();
    return;
  }

  // Ứng viên = đúng luật suy đoán CŨ, để giữ nguyên hành vi hiện tại.
  const candidates = await prisma.pageLayout.findMany({
    where: {
      categoryId: { not: null },
      sourcePostId: null,
      deletedAt: null,
      isPostTemplate: false,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { slug: true } },
    },
    orderBy: { name: 'asc' },
  });

  const already = await prisma.pageLayout.count({
    where: { isPostTemplate: true, deletedAt: null },
  });

  const known = await prisma.pageLayout.findMany({
    where: { id: { in: KNOWN_TEMPLATE_IDS }, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Đã đánh dấu sẵn: ${already}\n`);
  console.log('='.repeat(60));
  console.log(`KHUYẾN NGHỊ — 2 mẫu hệ thống vốn đang dùng (${known.length}):`);
  for (const k of known) console.log(`  ${k.slug}\n    ${k.name}`);
  console.log('  -> bật bằng:  --apply');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOÀN BỘ ứng viên theo luật suy đoán CŨ (${candidates.length}):`);
  for (const c of candidates) {
    console.log(`  ${c.slug}\n    ${c.name}  [danh mục: ${c.category?.slug}]`);
  }
  console.log('  -> bật hết bằng:  --apply-all  (thường KHÔNG nên)');

  const targets = APPLY_ALL
    ? candidates.map((c) => c.id)
    : APPLY
      ? known.map((k) => k.id)
      : [];

  if (!targets.length) {
    console.log('\n(chưa ghi gì)');
    await prisma.$disconnect();
    return;
  }

  const res = await prisma.pageLayout.updateMany({
    where: { id: { in: targets } },
    data: { isPostTemplate: true },
  });
  console.log(`\nĐã bật cờ cho ${res.count} layout.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
