/**
 * Phase 4: give bộ-môn content department-prefixed public URLs.
 * A post-derived layout owned by a specific department (not faculty) is re-slugged
 *   tin-tuc/<x>  →  <dept-slug>/tin-tuc/<x>
 * Faculty-wide layouts (dept_legacy_1 / null) keep tin-tuc/<x>.
 * Emits a redirect map (old locale-less path → new path) consumed by the public
 * proxy/middleware so existing links/SEO keep working. Idempotent.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { FACULTY_DEPT_ID } from '../../src/shared/helpers';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const REDIRECTS_OUT = join(
  __dirname,
  '../../../frontend-public/src/lib/legacy-redirects.json',
);

async function main(): Promise<void> {
  const depts = new Map(
    (await prisma.department.findMany({ select: { id: true, slug: true } })).map(
      (d) => [d.id, d.slug],
    ),
  );

  // bộ-môn, post-derived news layouts still under the flat tin-tuc/ namespace
  const layouts = await prisma.pageLayout.findMany({
    where: {
      sourcePostId: { not: null },
      departmentId: { not: null },
      slug: { startsWith: 'tin-tuc/' },
    },
    select: { id: true, slug: true, departmentId: true },
  });

  const redirects: Record<string, string> = {};
  let moved = 0;
  let skipped = 0;
  for (const l of layouts) {
    const deptSlug = l.departmentId ? depts.get(l.departmentId) : undefined;
    if (
      !deptSlug ||
      l.departmentId === FACULTY_DEPT_ID ||
      deptSlug === 'khoa' ||
      deptSlug === '/'
    ) {
      skipped++; // faculty-wide → keep tin-tuc/
      continue;
    }
    const newSlug = `${deptSlug}/${l.slug}`;
    if (newSlug === l.slug) {
      skipped++;
      continue;
    }
    await prisma.pageLayout.update({
      where: { id: l.id },
      data: { slug: newSlug },
    });
    redirects[l.slug] = newSlug; // old path → new path (locale-less)
    moved++;
  }

  // department landing pages moved from the (never-created) bo-mon/<slug> scheme
  for (const [, slug] of depts) {
    if (slug && slug !== 'khoa' && slug !== '/') {
      redirects[`bo-mon/${slug}`] = slug;
    }
  }

  writeFileSync(REDIRECTS_OUT, `${JSON.stringify(redirects, null, 2)}\n`);
  console.log(
    `Re-slugged ${moved} bộ-môn layouts (skipped ${skipped} faculty-wide). ` +
      `Wrote ${Object.keys(redirects).length} redirects → ${REDIRECTS_OUT}`,
  );
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
}
