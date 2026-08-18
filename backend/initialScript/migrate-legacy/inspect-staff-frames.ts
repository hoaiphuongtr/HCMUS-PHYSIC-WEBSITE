/**
 * inspect-staff-frames.ts — CHỈ ĐỌC. Soi các trang nhân sự bị convert-staff-to-profile
 * bỏ qua ("khung đã dựng tay") để biết chúng là gì trước khi quyết định.
 *
 * In ra: khung component, đã xuất bản chưa, và có trang "song sinh" cùng tên người
 * hay không (site cũ đẻ ra 2 kiểu slug: `pgs-ts-x` và `pgsts-x`).
 *
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/inspect-staff-frames.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

type PuckNode = { type?: string };

const STANDARD = ['Header', 'PageHero', 'LegacyPageBody', 'Footer'].join('>');
const CONVERTED = ['Header', 'PageHero', 'StaffProfile', 'Footer'].join('>');

/** Bỏ tiền tố học vị + dấu gạch để hai kiểu slug của cùng một người khớp nhau. */
function personKey(slug: string): string {
  const last = slug.split('/').pop() ?? slug;
  return last
    .replace(
      /^(pgs-?ts|gs-?ts|gvc-?ts|gvc-?ths|gv-?ths|ncs-?ths|ncs|hvch|ths|ts|cn|ks|co|gvc|gv)-/,
      '',
    )
    .replace(/\d+$/, '')
    .replace(/-/g, '');
}

async function main(): Promise<void> {
  const pages = await prisma.pageLayout.findMany({
    where: { slug: { contains: '/nhan-su/' } },
    select: {
      id: true,
      slug: true,
      puckData: true,
      isPublished: true,
      updatedAt: true,
    },
    orderBy: { slug: 'asc' },
  });

  const frameOf = (p: (typeof pages)[number]) => {
    const content = (p.puckData as { content?: PuckNode[] } | null)?.content;
    if (!Array.isArray(content)) return '(không có content)';
    return content.map((c) => c?.type ?? '?').join('>');
  };

  const byPerson = new Map<string, typeof pages>();
  for (const p of pages) {
    const k = personKey(p.slug);
    byPerson.set(k, [...(byPerson.get(k) ?? []), p]);
  }

  const odd = pages.filter((p) => {
    const f = frameOf(p);
    return f !== STANDARD && f !== CONVERTED;
  });

  console.log(`Tổng trang nhân sự: ${pages.length}`);
  console.log(`Khung chuẩn (chuyển được): ${pages.length - odd.length}`);
  console.log(`Khung lạ (đang bị bỏ qua): ${odd.length}\n`);

  console.log('=== CHI TIẾT CÁC TRANG KHUNG LẠ ===');
  for (const p of odd) {
    const twins = (byPerson.get(personKey(p.slug)) ?? []).filter(
      (t) => t.id !== p.id,
    );
    console.log(`\n${p.slug}`);
    console.log(`  khung      : ${frameOf(p)}`);
    console.log(
      `  xuất bản   : ${p.isPublished ? 'CÓ' : 'không'} | sửa lần cuối: ${p.updatedAt.toISOString().slice(0, 10)}`,
    );
    if (twins.length) {
      for (const t of twins) {
        console.log(
          `  song sinh  : ${t.slug} [${frameOf(t)}] ${t.isPublished ? '(đã xuất bản)' : '(chưa xuất bản)'}`,
        );
      }
    } else {
      console.log('  song sinh  : KHÔNG có — đây là trang DUY NHẤT của người này');
    }
  }

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
