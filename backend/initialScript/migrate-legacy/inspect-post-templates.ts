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
    // Puck cất các khối LỒNG BÊN TRONG (vd trong Container) ở `zones`, không
    // nằm trong `content`. Không đọc zones là tưởng mọi mẫu giống hệt nhau.
    const zones = (t.puckData as { zones?: Record<string, PuckNode[]> } | null)
      ?.zones;
    console.log(`  cấu trúc : ${content.length} khối ở ngoài cùng`);

    /**
     * In cả khối con nằm TRONG props (Puck bản này dùng "slot": mảng component
     * cất thẳng trong props của khối cha, không nằm ở `zones`). Đọc thiếu chỗ
     * này là tưởng mọi mẫu chỉ có Header/Container/Footer giống hệt nhau.
     */
    const printNested = (props: Record<string, unknown>, depth: number) => {
      const pad = '   '.repeat(depth + 2);
      for (const [key, value] of Object.entries(props)) {
        if (!Array.isArray(value)) continue;
        const nodes = value.filter(
          (v): v is PuckNode =>
            !!v && typeof v === 'object' && 'type' in (v as object),
        );
        if (!nodes.length) continue;
        console.log(`${pad}└ ${key}: ${nodes.length} khối`);
        nodes.forEach((n, k) => {
          console.log(`${pad}   ${k + 1}. ${n.type ?? '?'}`);
          if (n.props) printNested(n.props, depth + 2);
        });
      }
    };

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
      if (c?.props) printNested(c.props, 0);
    });

    if (zones && Object.keys(zones).length) {
      for (const [zoneKey, nodes] of Object.entries(zones)) {
        console.log(`    [vùng lồng] ${zoneKey}`);
        (nodes ?? []).forEach((n, j) => {
          console.log(`       ${j + 1}. ${n?.type ?? '?'}`);
        });
      }
    } else {
      console.log('    [không có vùng lồng nào]');
    }
  }

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
