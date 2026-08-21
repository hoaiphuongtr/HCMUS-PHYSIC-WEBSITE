/**
 * set-department-category.ts — gán DANH MỤC MẶC ĐỊNH cho một đơn vị.
 *
 * Bài do tài khoản thuộc đơn vị đó đăng sẽ LUÔN được gắn danh mục này, dù người
 * đăng có nhớ tick hay không (ép ở backend trong cloneIntoLayout). Đây là chỗ
 * chốt để bài của CLB luôn nằm trong mục Câu lạc bộ, bài của Đoàn – Hội luôn
 * nằm trong mục Đoàn – Hội.
 *
 * Xem hiện trạng:
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/set-department-category.ts
 * Gán:
 *   ... set-department-category.ts cau-lac-bo Club
 *   ... set-department-category.ts doan-hoi doan-hoi-sinh-vien
 * Gỡ:
 *   ... set-department-category.ts cau-lac-bo --none
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const [deptSlug, catSlug] = process.argv.slice(2);

async function main(): Promise<void> {
  if (!deptSlug) {
    const rows = await prisma.department.findMany({
      select: { slug: true, name: true, kind: true, defaultCategoryId: true },
      orderBy: { name: 'asc' },
    });
    const cats = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const byId = new Map(cats.map((c) => [c.id, c.slug]));

    console.log('Hiện trạng (đơn vị → danh mục mặc định):\n');
    for (const d of rows) {
      const mapped = d.defaultCategoryId
        ? (byId.get(d.defaultCategoryId) ?? '(danh mục đã bị xoá)')
        : '—';
      console.log(
        `  ${d.kind === 'unit' ? 'ĐƠN VỊ ' : 'bộ môn '} ${d.slug.padEnd(22)} → ${mapped}`,
      );
    }
    console.log('\nDanh mục có thể gán:');
    console.log(`  ${cats.map((c) => c.slug).join(', ')}`);
    console.log('\nGán: ... set-department-category.ts <dept-slug> <category-slug>');
    await prisma.$disconnect();
    return;
  }

  const dept = await prisma.department.findUnique({
    where: { slug: deptSlug },
    select: { id: true, name: true, kind: true },
  });
  if (!dept) {
    console.error(`Không có đơn vị nào slug = ${deptSlug}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  if (catSlug === '--none') {
    await prisma.department.update({
      where: { id: dept.id },
      data: { defaultCategoryId: null },
    });
    console.log(`Đã gỡ danh mục mặc định của ${dept.name}.`);
    await prisma.$disconnect();
    return;
  }

  if (!catSlug) {
    console.error('Thiếu category-slug. Dùng --none để gỡ.');
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const cat = await prisma.category.findFirst({
    where: { slug: catSlug },
    select: { id: true, name: true },
  });
  if (!cat) {
    console.error(`Không có danh mục nào slug = ${catSlug}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  await prisma.department.update({
    where: { id: dept.id },
    data: { defaultCategoryId: cat.id },
  });
  const catName =
    typeof cat.name === 'object' && cat.name
      ? ((cat.name as { vi?: string }).vi ?? catSlug)
      : catSlug;
  console.log(`Đã gán: ${dept.name} → danh mục "${catName}" [${catSlug}]`);
  if (dept.kind !== 'unit') {
    console.log(
      'Lưu ý: đơn vị này đang gắn cờ "bộ môn". Bài của nó vẫn sẽ được gắn danh' +
        ' mục trên, nhưng cân nhắc đổi sang "unit" nếu đây là CLB/Đoàn–Hội.',
    );
  }
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
