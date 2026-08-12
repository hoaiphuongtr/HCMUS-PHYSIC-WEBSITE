/**
 * build-missing-dept-pages.ts — migrate the last legacy `pages` that dead-link
 * auditing turned up.
 *
 * These are department sub-pages (Đào tạo cao học, Phòng thí nghiệm, Hội cựu SV,
 * Thời khoá biểu, CLB USAC…) that the first pass missed because
 * build-legacy-pages.ts works from a hardcoded list of page IDs — anything not on
 * that list was simply never looked at.
 *
 * Each entry maps a legacy slug to the exact path the site's own content links to,
 * so the URL matches instead of needing a redirect. Verified one by one against
 * the old site: only pages that really serve content are listed here (several
 * sibling URLs 404 on the old site too and are deliberately left out).
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker start legacy-mariadb
 *
 * Run (DATABASE_URL can point at the sandbox via deploy/tunnel-sandbox-db.py):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/build-missing-dept-pages.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  decodeEntities,
  rewriteImagePath,
  transformLegacyHtml,
} from './legacy-html';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const LEGACY = {
  host: 'localhost',
  port: 3309,
  user: 'root',
  password: 'root',
  database: 'legacy',
};

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e'; // post-template-default (for createdBy)

/** legacy `pages`.slug → đường dẫn công khai mà nội dung site đang trỏ tới. */
const TARGETS: Record<string, string> = {
  'nghien-cuu-khoa-hoc-1588756284': 'vat-ly-ly-thuyet/nghien-cuu-khoa-hoc-1588756284',
  'phong-thi-nghiem-1591431105': 'vat-ly-ly-thuyet/phong-thi-nghiem-1591431105',
  'thong-tin-nghe-nghiep-1591433182': 'vat-ly-ly-thuyet/thong-tin-nghe-nghiep-1591433182',
  'hoi-cuu-sv-1591433198': 'vat-ly-ly-thuyet/hoi-cuu-sv-1591433198',
  'dao-tao-cao-hoc-1591433792': 'vat-ly-ly-thuyet/dao-tao-cao-hoc-1591433792',
  'dao-tao-cao-hoc-1591429400': 'vat-ly-chat-ran/dao-tao-cao-hoc-1591429400',
  'dao-tao-cao-hoc-1591455438': 'vat-ly-ung-dung/dao-tao-cao-hoc-1591455438',
  'gioi-thieu-1591457235': 'vat-ly-dien-tu/gioi-thieu-1591457235',
  'hoi-cuu-sv-1591542472': 'vat-ly-tin-hoc/hoi-cuu-sv-1591542472',
  'thoi-khoa-bieu-1599631759': 'vat-ly-tin-hoc/thoi-khoa-bieu-1599631759',
  clbusac: 'vat-ly-dia-cau/clbusac',
  ptnk: 'vat-ly-dia-cau/ptnk',
  'nganh-vat-ly-hoc': 'nganh-hoc/nganh-vat-ly-hoc',
  'de-tai-nghien-cuu-nam-20251764313635': 'de-tai-nghien-cuu-nam-20251764313635',
};

type PageRow = {
  slug: string;
  image: string | null;
  bgimage: string | null;
};

type LangRow = {
  slug: string;
  langid: number;
  title: string | null;
  content: string | null;
  excerpt: string | null;
};

async function main(): Promise<void> {
  const template = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { createdBy: true },
  });
  const owner =
    template?.createdBy ??
    (await prisma.pageLayout.findFirst({ select: { createdBy: true } }))
      ?.createdBy;
  if (!owner) throw new Error('Không tìm được người tạo để gán cho layout mới');

  const wanted = Object.keys(TARGETS);
  const placeholders = wanted.map(() => '?').join(',');
  const legacy = await mysql.createConnection(LEGACY);
  const [pageRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT slug, image, bgimage FROM pages WHERE deleted = 0 AND slug IN (${placeholders})`,
    wanted,
  );
  const [langRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT p.slug, l.langid, l.title, l.content, l.excerpt
       FROM pages p JOIN pageslang l ON l.pageid = p.id
      WHERE p.slug IN (${placeholders})`,
    wanted,
  );
  await legacy.end();

  const langBySlug = new Map<string, LangRow[]>();
  for (const r of langRows as unknown as LangRow[]) {
    const arr = langBySlug.get(r.slug) ?? [];
    arr.push(r);
    langBySlug.set(r.slug, arr);
  }

  const existingBySlug = new Map<string, string>(
    (await prisma.pageLayout.findMany({ select: { id: true, slug: true } })).map(
      (l) => [l.slug, l.id],
    ),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;
  const notFound = new Set(wanted);

  for (const page of pageRows as unknown as PageRow[]) {
    notFound.delete(page.slug);
    const slug = TARGETS[page.slug];
    if (!slug) continue;
    const langs = langBySlug.get(page.slug) ?? [];
    const vi = langs.find((l) => l.langid === 1);
    const en = langs.find((l) => l.langid === 2);
    const titleVi = decodeEntities((vi?.title ?? en?.title ?? page.slug).trim());
    const titleEn = decodeEntities((en?.title ?? vi?.title ?? page.slug).trim());
    const bodyVi = transformLegacyHtml(vi?.content ?? en?.content);
    const bodyEn = transformLegacyHtml(en?.content) || bodyVi;
    const excerptVi = vi?.excerpt ? decodeEntities(vi.excerpt) : '';
    const excerptEn = en?.excerpt ? decodeEntities(en.excerpt) : excerptVi;
    const heroBg =
      rewriteImagePath(page.bgimage) ?? rewriteImagePath(page.image) ?? '';

    const tree = {
      root: {},
      content: [
        { type: 'Header', props: { id: `hdr-${page.slug}` } },
        {
          type: 'PageHero',
          props: {
            id: `hero-${page.slug}`,
            title: { vi: titleVi, en: titleEn },
            subtitle: { vi: excerptVi, en: excerptEn },
            bgImage: heroBg,
          },
        },
        {
          type: 'LegacyPageBody',
          props: {
            id: `body-${page.slug}`,
            html: { vi: bodyVi, en: bodyEn },
          },
        },
        { type: 'Footer', props: { id: `ftr-${page.slug}` } },
      ],
    };

    try {
      const now = new Date();
      const existingId = existingBySlug.get(slug);
      if (existingId) {
        await prisma.pageLayout.update({
          where: { id: existingId },
          data: {
            name: titleVi || page.slug,
            description: excerptVi || null,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
          },
        });
        updated += 1;
      } else {
        const made = await prisma.pageLayout.create({
          data: {
            name: titleVi || page.slug,
            slug,
            description: excerptVi || null,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
            createdBy: owner,
          },
        });
        existingBySlug.set(slug, made.id);
        created += 1;
      }
      console.log(`  ${existingId ? '~' : '+'} ${slug}  (${bodyVi.length}b)`);
    } catch (err) {
      failed += 1;
      console.error(`  ! fail ${slug}:`, (err as Error).message);
    }
  }

  console.log(`\nDone. created=${created} updated=${updated} failed=${failed}`);
  if (notFound.size)
    console.log(`không có trong dump: ${[...notFound].join(', ')}`);
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
