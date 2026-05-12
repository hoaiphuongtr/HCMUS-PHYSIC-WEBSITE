import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.$executeRaw`UPDATE "Post" SET "publishedAt" = "updatedAt" WHERE status = 'PUBLISHED' AND "publishedAt" IS NULL`;
  console.log('Rows updated:', updated);
  const total = await prisma.post.count({ where: { status: 'PUBLISHED' } });
  const stamped = await prisma.post.count({
    where: { status: 'PUBLISHED', publishedAt: { not: null } },
  });
  console.log(`PUBLISHED posts: ${stamped}/${total} have publishedAt set`);
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
