import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const educational = 'cat_default_educational';
const scientific = 'cat_default_scientific';
const recruitment = 'cat_default_recruitment';
const event = 'cat_default_event';
const scholarship = 'cat_default_scholarship';

const KEYWORDS: Array<{ patterns: RegExp[]; target: string }> = [
  {
    target: scholarship,
    patterns: [/hoc[\s-]*bong/i, /scholarship/i],
  },
  {
    target: event,
    patterns: [
      /su[\s-]*kien/i,
      /event/i,
      /seminar/i,
      /hoi[\s-]*nghi/i,
      /hoi[\s-]*thao/i,
      /workshop/i,
      /toa[\s-]*dam/i,
    ],
  },
  {
    target: recruitment,
    patterns: [
      /tuyen[\s-]*dung/i,
      /viec[\s-]*lam/i,
      /recruit/i,
      /tuyen[\s-]*thuc[\s-]*tap/i,
      /intern/i,
      /career/i,
    ],
  },
  {
    target: scientific,
    patterns: [
      /khoa[\s-]*hoc/i,
      /nckh/i,
      /research/i,
      /nghien[\s-]*cuu/i,
      /thien[\s-]*van/i,
      /vu[\s-]*tru/i,
      /astronomy/i,
      /science/i,
    ],
  },
  {
    target: educational,
    patterns: [
      /giao[\s-]*vu/i,
      /hoc[\s-]*vu/i,
      /sinh[\s-]*vien/i,
      /hoat[\s-]*dong[\s-]*sinh[\s-]*vien/i,
      /thong[\s-]*bao/i,
      /tin[\s-]*tuc/i,
      /notice/i,
      /announce/i,
    ],
  },
];

const DEFAULT_IDS = new Set([
  educational,
  scientific,
  recruitment,
  event,
  scholarship,
]);

const classify = (slug: string, viName: string): string => {
  const probe = `${slug} ${viName}`;
  for (const { patterns, target } of KEYWORDS) {
    for (const re of patterns) {
      if (re.test(probe)) return target;
    }
  }
  return educational; // fallback bucket
};

async function main(): Promise<void> {
  const legacyCats = await prisma.category.findMany({
    where: { legacyId: { not: null } },
    select: { id: true, slug: true, name: true },
  });
  console.log(`Legacy categories to merge: ${legacyCats.length}`);

  const reassign: Record<string, number> = {};
  for (const cat of legacyCats) {
    const name = cat.name as { vi?: string; en?: string };
    const viName = name?.vi ?? '';
    const target = classify(cat.slug, viName);
    reassign[target] = (reassign[target] ?? 0) + 1;
    await prisma.post.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: target },
    });
  }
  console.log('Reassignment counts per default category:', reassign);

  const stillReferenced = await prisma.post.groupBy({
    by: ['categoryId'],
    _count: true,
  });
  const used = new Set(stillReferenced.map((r) => r.categoryId));
  let deleted = 0;
  for (const cat of legacyCats) {
    if (used.has(cat.id)) continue;
    if (DEFAULT_IDS.has(cat.id)) continue;
    await prisma.category.delete({ where: { id: cat.id } });
    deleted++;
  }
  console.log(`Deleted ${deleted} unused legacy categories`);

  const remaining = await prisma.category.count();
  console.log(`Categories remaining: ${remaining}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
