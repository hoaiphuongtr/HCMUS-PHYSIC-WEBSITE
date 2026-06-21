import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const ENTITY_MAP: Record<string, string> = {
  '&#34;': '"',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&hellip;': '…',
  '&#8230;': '…',
};

const PREFIX_RE = /^\s*\[(news|notice|thông\s*báo|thong\s*bao|tin)\]\s*/i;

const decodeEntities = (raw: string): string => {
  let out = raw;
  for (const [from, to] of Object.entries(ENTITY_MAP)) {
    out = out.split(from).join(to);
  }
  out = out.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCharCode(Number(code)),
  );
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );
  return out;
};

const stripPrefix = (raw: string): string => raw.replace(PREFIX_RE, '');

const cleanString = (raw: string): string =>
  stripPrefix(decodeEntities(raw)).trim();

const cleanLocalized = (
  value: Prisma.JsonValue | null,
): { vi?: string; en?: string } | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as { vi?: unknown; en?: unknown };
  const next: { vi?: string; en?: string } = {};
  let changed = false;
  if (typeof obj.vi === 'string') {
    const cleaned = cleanString(obj.vi);
    if (cleaned !== obj.vi) changed = true;
    next.vi = cleaned;
  }
  if (typeof obj.en === 'string') {
    const cleaned = cleanString(obj.en);
    if (cleaned !== obj.en) changed = true;
    next.en = cleaned;
  }
  return changed ? next : null;
};

async function main(): Promise<void> {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, coverAlt: true },
  });
  let titlesFixed = 0;
  let altsFixed = 0;
  for (const p of posts) {
    const nextTitle = cleanLocalized(p.title as Prisma.JsonValue);
    let nextAlt: string | null = null;
    if (p.coverAlt) {
      const cleaned = cleanString(p.coverAlt);
      if (cleaned !== p.coverAlt) nextAlt = cleaned;
    }
    if (!nextTitle && nextAlt === null) continue;
    await prisma.post.update({
      where: { id: p.id },
      data: {
        ...(nextTitle
          ? { title: nextTitle as unknown as Prisma.InputJsonValue }
          : {}),
        ...(nextAlt !== null ? { coverAlt: nextAlt } : {}),
      },
    });
    if (nextTitle) titlesFixed++;
    if (nextAlt !== null) altsFixed++;
  }
  console.log(`titles fixed: ${titlesFixed}`);
  console.log(`coverAlts fixed: ${altsFixed}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
