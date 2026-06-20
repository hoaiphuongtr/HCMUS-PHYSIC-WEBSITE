import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const PREFIX = 'tin-tuc/';

async function main(): Promise<void> {
  const layouts = await prisma.pageLayout.findMany({
    where: { sourcePostId: { not: null } },
    select: { id: true, slug: true },
  });
  const taken = new Set<string>(
    (await prisma.pageLayout.findMany({ select: { slug: true } })).map((l) => l.slug),
  );
  let renamed = 0;
  let skipped = 0;
  for (const l of layouts) {
    if (l.slug.startsWith(PREFIX)) {
      skipped++;
      continue;
    }
    const base = l.slug;
    let next = `${PREFIX}${base}`;
    let n = 2;
    while (taken.has(next) && next !== l.slug) {
      next = `${PREFIX}${base}-${n}`;
      n++;
    }
    taken.delete(l.slug);
    taken.add(next);
    await prisma.pageLayout.update({ where: { id: l.id }, data: { slug: next } });
    renamed++;
    if (renamed % 200 === 0) console.log(`  ${renamed}/${layouts.length}`);
  }
  console.log(`Done. renamed=${renamed} already-prefixed=${skipped}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
