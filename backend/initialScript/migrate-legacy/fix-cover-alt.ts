import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const unwrap = (raw: string | null): string | null => {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{"')) return raw;
  try {
    const parsed = JSON.parse(trimmed) as { vi?: unknown; en?: unknown };
    if (typeof parsed.vi === 'string' && parsed.vi.trim()) return parsed.vi;
    if (typeof parsed.en === 'string' && parsed.en.trim()) return parsed.en;
    return raw;
  } catch {
    return raw;
  }
};

async function main(): Promise<void> {
  const posts = await prisma.post.findMany({
    where: { coverAlt: { startsWith: '{"' } },
    select: { id: true, coverAlt: true },
  });
  console.log(`Found ${posts.length} posts with JSON-string coverAlt`);
  let updated = 0;
  for (const p of posts) {
    const next = unwrap(p.coverAlt);
    if (next === p.coverAlt) continue;
    await prisma.post.update({ where: { id: p.id }, data: { coverAlt: next } });
    updated++;
  }
  console.log(`Done. ${updated} posts fixed.`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
