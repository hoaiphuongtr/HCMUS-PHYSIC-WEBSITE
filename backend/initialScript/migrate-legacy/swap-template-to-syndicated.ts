import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = {
  root?: unknown;
  content?: PuckNode[];
  zones?: Record<string, unknown>;
};

async function main(): Promise<void> {
  const tpl = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { puckData: true },
  });
  const tree = tpl?.puckData as PuckTree | null;
  if (!tree?.content) throw new Error('template missing content');

  const nextContent: PuckNode[] = [];
  let didHeader = false;
  let didFooter = false;
  for (const node of tree.content) {
    if (node.type === 'Navbar') {
      nextContent.push({ type: 'SiteHeader', props: { id: 'post-tpl-site-header' } });
      didHeader = true;
    } else if (node.type === 'FooterBlock') {
      nextContent.push({ type: 'SiteFooter', props: { id: 'post-tpl-site-footer' } });
      didFooter = true;
    } else {
      nextContent.push(node);
    }
  }
  if (!didHeader) {
    nextContent.unshift({ type: 'SiteHeader', props: { id: 'post-tpl-site-header' } });
  }
  if (!didFooter) {
    nextContent.push({ type: 'SiteFooter', props: { id: 'post-tpl-site-footer' } });
  }
  const nextTree: PuckTree = { ...tree, content: nextContent };
  await prisma.pageLayout.update({
    where: { id: TEMPLATE_ID },
    data: { puckData: nextTree as unknown as Prisma.InputJsonValue },
  });
  console.log('Template now uses SiteHeader/SiteFooter. Run reinject-attached-layouts.ts next.');
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
