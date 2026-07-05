/**
 * Phase 0 of department-scoped permissions: clean up department data so slugs are
 * usable as URL prefixes.
 *  - Merge the two "Vật lý Tin học" departments into the legacy row (dept_legacy_2),
 *    which is what legacy posts.deptid=2 maps to. Repoint the newer row's users, delete
 *    it, then give dept_legacy_2 the canonical slug `vat-ly-tin-hoc`.
 *  - Give the main faculty (dept_legacy_1, slug "/") a clean slug `khoa`. It's the
 *    faculty-wide / no-URL-prefix bucket.
 * Idempotent. Only User.departmentId FKs to Department (verified), so no content repoint needed yet.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const CANONICAL_VLTH = 'dept_legacy_2'; // keep (legacy posts.deptid=2 maps here)
const DUP_VLTH = 'cmq3a1sl800006cuh3gk6goaf'; // newer duplicate, slug vat-ly-tin-hoc
export const FACULTY_DEPT_ID = 'dept_legacy_1'; // Khoa Vật lý — faculty-wide bucket

async function main(): Promise<void> {
  const dup = await prisma.department.findUnique({ where: { id: DUP_VLTH } });
  const canonical = await prisma.department.findUnique({ where: { id: CANONICAL_VLTH } });

  if (dup && canonical) {
    // 1. repoint the duplicate's users onto the canonical row
    const moved = await prisma.user.updateMany({
      where: { departmentId: DUP_VLTH },
      data: { departmentId: CANONICAL_VLTH },
    });
    // 2. delete the duplicate (frees the `vat-ly-tin-hoc` slug)
    await prisma.department.delete({ where: { id: DUP_VLTH } });
    // 3. give canonical the clean slug
    await prisma.department.update({
      where: { id: CANONICAL_VLTH },
      data: { slug: 'vat-ly-tin-hoc' },
    });
    console.log(`Merged VLTH: moved ${moved.count} user(s), deleted ${DUP_VLTH}, canonical slug → vat-ly-tin-hoc`);
  } else {
    console.log('VLTH merge: already done or rows missing (skipping)');
  }

  // faculty dept: replace slug "/" with a clean value
  const faculty = await prisma.department.findUnique({ where: { id: FACULTY_DEPT_ID } });
  if (faculty && faculty.slug !== 'khoa') {
    await prisma.department.update({ where: { id: FACULTY_DEPT_ID }, data: { slug: 'khoa' } });
    console.log(`Faculty dept slug "${faculty.slug}" → khoa`);
  }

  const depts = await prisma.department.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { id: 'asc' },
  });
  console.log('Departments now:');
  for (const d of depts) console.log(`  ${d.id}  ${d.slug}  ${d.name}`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
