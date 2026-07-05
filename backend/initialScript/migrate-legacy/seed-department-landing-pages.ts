/**
 * Phase 4: create a landing page at /<dept-slug> for each bộ môn (replacing the
 * never-created bo-mon/<slug> scheme). The layout is cloned from the published
 * homepage ("lấy của home page") and stamped with the department so that
 * department's admin can edit it. Idempotent (skips existing slugs).
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { FACULTY_DEPT_ID } from '../../src/shared/helpers';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

async function main(): Promise<void> {
  const home = await prisma.pageLayout.findFirst({
    where: { slug: 'trang-chu', isPublished: true },
    select: { publishedPuckData: true, puckData: true, createdBy: true },
  });
  if (!home) throw new Error('Published homepage (trang-chu) not found');
  const basePuck = (home.publishedPuckData ?? home.puckData) as Prisma.InputJsonValue;

  const depts = await prisma.department.findMany({
    where: { id: { not: FACULTY_DEPT_ID }, slug: { notIn: ['khoa', '/'] } },
    select: { id: true, slug: true, name: true },
  });

  const existing = new Set(
    (
      await prisma.pageLayout.findMany({
        where: { slug: { in: depts.map((d) => d.slug) } },
        select: { slug: true },
      })
    ).map((l) => l.slug),
  );

  let created = 0;
  for (const d of depts) {
    if (existing.has(d.slug)) {
      console.log(`  = ${d.slug} (exists, skip)`);
      continue;
    }
    const now = new Date();
    await prisma.pageLayout.create({
      data: {
        name: `${d.name} — Trang bộ môn`,
        slug: d.slug,
        description: `Trang chủ bộ môn ${d.name}`,
        puckData: basePuck,
        publishedPuckData: basePuck,
        isPublished: true,
        publishedAt: now,
        departmentId: d.id,
        createdBy: home.createdBy,
      },
    });
    created++;
    console.log(`  + ${d.slug}  (${d.name})`);
  }
  console.log(`\nDone. created=${created}/${depts.length} landing pages.`);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
}
