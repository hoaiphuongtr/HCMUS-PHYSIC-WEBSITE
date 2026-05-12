import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const layouts = await prisma.pageLayout.findMany({
    where: { sourcePostId: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      puckData: true,
      publishedPuckData: true,
    },
  });
  for (const l of layouts) {
    console.log('---', l.name, l.slug, 'published=', l.isPublished);
    const pp = l.puckData as any;
    const content = pp?.content ?? [];
    const flatTypes: string[] = [];
    const walk = (nodes: any[]) => {
      for (const n of nodes) {
        if (n?.type) flatTypes.push(n.type);
        if (n?.props?.content && Array.isArray(n.props.content)) walk(n.props.content);
      }
    };
    walk(content);
    console.log('  types in puckData:', flatTypes.join(','));
    const findNode = (nodes: any[], type: string): any => {
      for (const n of nodes) {
        if (n?.type === type) return n;
        if (n?.props?.content && Array.isArray(n.props.content)) {
          const r = findNode(n.props.content, type);
          if (r) return r;
        }
      }
      return null;
    };
    const reader = findNode(content, 'PostReaderTools');
    if (reader) console.log('  PostReaderTools props:', JSON.stringify(reader.props));
    else console.log('  PostReaderTools: MISSING');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
