/**
 * Phase 1 backfill: stamp Post/PageLayout with a departmentId derived from the
 * legacy source (posts.deptid), since the original migration dropped it.
 *   - Post.departmentId  ← `dept_legacy_${posts.deptid}` (via Post.legacyId)
 *   - PageLayout.departmentId ← its sourcePost.departmentId (post-derived layouts)
 * Faculty-wide content = dept_legacy_1. Section pages / non-legacy rows stay null
 * (treated as faculty-wide by the scope helper). Media left null (stamped on new uploads).
 * Requires the legacy MariaDB (localhost:3309, db `legacy`). Idempotent.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});
const LEGACY = { host: 'localhost', port: 3309, user: 'root', password: 'root', database: 'legacy' };

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function main(): Promise<void> {
  const legacy = await mysql.createConnection(LEGACY);
  const [rows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, deptid FROM posts WHERE deleted = 0',
  );
  await legacy.end();
  const deptOfLegacyPost = new Map<number, number>();
  for (const r of rows as Array<{ id: number; deptid: number }>) {
    deptOfLegacyPost.set(r.id, r.deptid);
  }

  const validDeptIds = new Set(
    (await prisma.department.findMany({ select: { id: true } })).map((d) => d.id),
  );

  // group migrated posts by target department
  const posts = await prisma.post.findMany({
    where: { legacyId: { not: null } },
    select: { legacyId: true },
  });
  const byDept = new Map<string, number[]>();
  let unmapped = 0;
  for (const p of posts) {
    const deptid = deptOfLegacyPost.get(p.legacyId as number);
    if (!deptid) {
      unmapped++;
      continue;
    }
    const deptId = `dept_legacy_${deptid}`;
    if (!validDeptIds.has(deptId)) {
      unmapped++;
      continue;
    }
    const arr = byDept.get(deptId) ?? [];
    arr.push(p.legacyId as number);
    byDept.set(deptId, arr);
  }

  let postUpdated = 0;
  for (const [deptId, legacyIds] of byDept) {
    for (const c of chunk(legacyIds, 500)) {
      const res = await prisma.post.updateMany({
        where: { legacyId: { in: c } },
        data: { departmentId: deptId },
      });
      postUpdated += res.count;
    }
    console.log(`  Post → ${deptId}: ${legacyIds.length}`);
  }

  // PageLayout.departmentId ← sourcePost.departmentId (single SQL join-update)
  const layoutRes: number = await prisma.$executeRawUnsafe(
    `UPDATE "PageLayout" pl SET "departmentId" = p."departmentId"
     FROM "Post" p WHERE pl."sourcePostId" = p."id" AND p."departmentId" IS NOT NULL`,
  );

  console.log(`\nDone. posts stamped=${postUpdated} (unmapped=${unmapped}), layouts stamped=${layoutRes}`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
