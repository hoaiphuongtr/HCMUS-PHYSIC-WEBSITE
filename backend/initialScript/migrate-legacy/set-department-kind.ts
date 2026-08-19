/**
 * set-department-kind.ts — đặt cờ phân loại cho một bộ môn/đơn vị, khỏi phụ
 * thuộc thao tác trên giao diện admin.
 *
 * `kind='unit'` = Đoàn–Hội, CLB… : bài KHÔNG lên trang chủ (feed của Khoa),
 * nhưng HIỆN trong danh mục của chính nó (xem feedDeptWhereWithUnits trong
 * post.service.ts).
 *
 * Xem hiện trạng tất cả:
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/set-department-kind.ts
 * Đặt:
 *   ... set-department-kind.ts doan-hoi unit
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const [slug, kind] = process.argv.slice(2);

async function main(): Promise<void> {
  if (!slug) {
    const all = await prisma.department.findMany({
      select: { slug: true, name: true, kind: true },
      orderBy: { name: 'asc' },
    });
    console.log('Hiện trạng:');
    for (const d of all) {
      console.log(
        `  ${d.kind === 'unit' ? 'ĐƠN VỊ  ' : 'bộ môn  '} ${d.slug.padEnd(24)} ${d.name}`,
      );
    }
    console.log('\nĐặt bằng: ... set-department-kind.ts <slug> <department|unit>');
    await prisma.$disconnect();
    return;
  }

  if (kind !== 'department' && kind !== 'unit') {
    console.error(`Giá trị kind phải là "department" hoặc "unit", nhận: ${kind}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const dept = await prisma.department.findUnique({ where: { slug } });
  if (!dept) {
    console.error(`Không có bộ môn nào slug = ${slug}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const updated = await prisma.department.update({
    where: { slug },
    data: { kind },
    select: { slug: true, name: true, kind: true },
  });
  console.log(
    `Đã đặt: ${updated.name} [${updated.slug}] : ${dept.kind} -> ${updated.kind}`,
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
