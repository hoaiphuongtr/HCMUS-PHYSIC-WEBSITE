/**
 * inspect-post-templates.ts — CHỈ ĐỌC. In cấu trúc các layout mẫu đang dùng.
 *
 * Dùng để dựng mẫu MỚI cho khớp chuẩn hiện có: biết mỗi mẫu gồm những khối nào,
 * xếp theo thứ tự nào, thay vì đoán.
 *
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/inspect-post-templates.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

type PuckNode = { type?: string; props?: Record<string, unknown> };

async function main(): Promise<void> {
  const templates = await prisma.pageLayout.findMany({
    where: { isPostTemplate: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      puckData: true,
      departmentId: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Có ${templates.length} layout mẫu.\n`);

  for (const t of templates) {
    const content = (t.puckData as { content?: PuckNode[] } | null)?.content;
    console.log('='.repeat(64));
    console.log(`${t.name}`);
    console.log(`  id       : ${t.id}`);
    console.log(`  slug     : ${t.slug}`);
    console.log(`  danh mục : ${t.category?.slug ?? '(không có)'}`);
    console.log(`  bộ môn   : ${t.departmentId ?? '(của Khoa)'}`);
    if (!Array.isArray(content)) {
      console.log('  cấu trúc : (không đọc được puckData)');
      continue;
    }
    console.log(`  cấu trúc : ${content.length} khối`);
    content.forEach((c, i) => {
      const props = c?.props ?? {};
      // In vài prop dễ nhận biết để phân biệt các mẫu với nhau.
      const hints = ['id', 'title', 'name', 'html', 'src', 'columns']
        .filter((k) => k in props)
        .map((k) => {
          const v = props[k];
          const short =
            typeof v === 'string'
              ? v.slice(0, 32)
              : typeof v === 'object' && v
                ? JSON.stringify(v).slice(0, 32)
                : String(v);
          return `${k}=${short}`;
        })
        .join(' ');
      console.log(`    ${i + 1}. ${c?.type ?? '?'}${hints ? `  (${hints})` : ''}`);
    });
  }

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
