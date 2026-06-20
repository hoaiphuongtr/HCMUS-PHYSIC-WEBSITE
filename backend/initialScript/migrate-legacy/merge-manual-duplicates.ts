import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const isEmpty = (value: Prisma.JsonValue | null): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as { vi?: unknown; en?: unknown };
  const vi = typeof obj.vi === 'string' ? obj.vi.trim() : '';
  const en = typeof obj.en === 'string' ? obj.en.trim() : '';
  return vi === '' && en === '';
};

async function main(): Promise<void> {
  // 1) Find manual posts (legacyId IS NULL) with empty body
  const manualEmpty = await prisma.post.findMany({
    where: { legacyId: null },
    select: { id: true, slug: true, body: true, coverUrl: true, coverAlt: true, title: true, excerpt: true, status: true, publishedAt: true },
  });
  const candidates = manualEmpty.filter((p) => isEmpty(p.body));
  console.log(`Manual posts with empty body: ${candidates.length}`);

  let merged = 0;
  let noTwin = 0;
  for (const manual of candidates) {
    // legacy twin = post with legacyId != null AND slug = manual.slug + "-2" OR exact slug match
    const twin = await prisma.post.findFirst({
      where: {
        legacyId: { not: null },
        OR: [
          { slug: `${manual.slug}-2` },
          { slug: manual.slug },
        ],
      },
      select: { id: true, slug: true, body: true, coverUrl: true, coverAlt: true, title: true, excerpt: true, publishedAt: true, status: true, legacyId: true, layouts: { select: { id: true } } },
    });
    if (!twin) {
      noTwin++;
      continue;
    }

    // 2) Copy content from twin onto manual
    const titleJson: Prisma.InputJsonValue = (isEmpty(manual.title) ? twin.title : manual.title) as unknown as Prisma.InputJsonValue;
    const bodyJson: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput = isEmpty(twin.body)
      ? Prisma.DbNull
      : (twin.body as unknown as Prisma.InputJsonValue);
    const excerptJson: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput = isEmpty(twin.excerpt)
      ? Prisma.DbNull
      : (twin.excerpt as unknown as Prisma.InputJsonValue);

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: manual.id },
        data: {
          title: titleJson,
          body: bodyJson,
          excerpt: excerptJson,
          coverUrl: manual.coverUrl || twin.coverUrl,
          coverAlt: manual.coverAlt || twin.coverAlt,
          publishedAt: manual.publishedAt ?? twin.publishedAt,
        },
      });
      // 3) Delete twin's layouts (they point at twin id)
      for (const l of twin.layouts) {
        await tx.pageLayout.delete({ where: { id: l.id } });
      }
      // 4) Delete the legacy twin post itself
      await tx.post.delete({ where: { id: twin.id } });
    });
    merged++;
    if (merged % 10 === 0) console.log(`  merged ${merged}/${candidates.length}`);
  }
  console.log(`Done. merged=${merged} noTwin=${noTwin}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
