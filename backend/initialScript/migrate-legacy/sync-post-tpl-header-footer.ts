import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const HOME_SLUG = 'trang-chu';
const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = { root?: unknown; content?: PuckNode[]; zones?: Record<string, unknown> };

const reId = (node: PuckNode, suffix: string): PuckNode => {
  const cloned = JSON.parse(JSON.stringify(node)) as PuckNode;
  if (cloned.props && typeof cloned.props === 'object') {
    cloned.props.id = `post-tpl-${suffix}`;
  }
  return cloned;
};

async function main(): Promise<void> {
  const home = await prisma.pageLayout.findFirst({
    where: { slug: HOME_SLUG, isPublished: true },
    select: { publishedPuckData: true, puckData: true },
  });
  const homeData = (home?.publishedPuckData ?? home?.puckData) as PuckTree | null;
  if (!homeData?.content) throw new Error('home layout missing content');
  const homeNavbar = homeData.content.find((n) => n.type === 'Navbar');
  const homeFooter = homeData.content.find((n) => n.type === 'FooterBlock');
  if (!homeNavbar || !homeFooter) throw new Error('home missing Navbar or FooterBlock');

  const tpl = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { puckData: true },
  });
  const tplData = tpl?.puckData as PuckTree | null;
  if (!tplData?.content) throw new Error('template missing content');

  const navbar = reId(homeNavbar, 'navbar');
  const footer = reId(homeFooter, 'footer');

  const nextContent: PuckNode[] = [];
  let injectedNav = false;
  for (const node of tplData.content) {
    if (node.type === 'Navbar') {
      nextContent.push(navbar);
      injectedNav = true;
    } else if (node.type === 'FooterBlock') {
      continue;
    } else {
      nextContent.push(node);
    }
  }
  if (!injectedNav) nextContent.unshift(navbar);
  nextContent.push(footer);

  const nextTree: PuckTree = { ...tplData, content: nextContent };
  await prisma.pageLayout.update({
    where: { id: TEMPLATE_ID },
    data: {
      puckData: nextTree as unknown as Prisma.InputJsonValue,
    },
  });
  console.log('Template synced. Now run reinject-attached-layouts.ts + refresh-news-snapshots.ts to propagate.');
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
