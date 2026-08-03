/**
 * build-class-staff-pages.ts — migrate the last two legacy content families the
 * first pass missed: "lớp học" (`classes`) and the leftover "nhân sự" (`staffs`).
 *
 * Found by deploy/audit-dead-links.sh, not by hand: after migrating majors and
 * subjects, 103 internal links were still dead, and 35 of them matched
 * `legacy.classes` slugs exactly while 9 matched `legacy.staffs`.
 *
 * Both live under a DEPARTMENT prefix, taken from `legacy.depts` so a staff page
 * lands under the right bộ môn:
 *   classes → <dept-slug>/lop-hoc/<slug>
 *   staffs  → <dept-slug>/nhan-su/<slug>
 *
 * Same frame as the other migrated pages: SiteHeader → PageHero → LegacyPageBody
 * → SiteFooter. Idempotent: re-running refreshes content in place.
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker start legacy-mariadb
 *
 * Run (DATABASE_URL can point at the sandbox via deploy/tunnel-sandbox-db.py):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/build-class-staff-pages.ts
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

/** Hai họ nội dung, mỗi họ một bảng + một bảng lang + một tiền tố đường dẫn. */
const FAMILIES = [
  {
    table: 'classes',
    langTable: 'classeslang',
    fk: 'classid',
    segment: 'lop-hoc',
    // classes có bgimage + excerpt; staffs KHÔNG có cả hai (chỉ image + content).
    cols: 'id, slug, deptid, image, bgimage',
    langCols: 'langid, title, content, excerpt',
  },
  {
    table: 'staffs',
    langTable: 'staffslang',
    fk: 'staffid',
    segment: 'nhan-su',
    cols: 'id, slug, deptid, image, NULL AS bgimage',
    langCols: 'langid, title, content, NULL AS excerpt',
  },
] as const;

type Row = {
  id: number;
  slug: string;
  deptid: number | null;
  image: string | null;
  bgimage: string | null;
};

type LangRow = {
  fk: number;
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

  const legacy = await mysql.createConnection(LEGACY);

  // deptid → slug bộ môn, để trang nằm đúng dưới bộ môn của nó.
  const [deptRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, slug FROM depts WHERE deleted = 0',
  );
  const deptSlug = new Map<number, string>(
    (deptRows as unknown as { id: number; slug: string }[]).map((d) => [
      d.id,
      d.slug,
    ]),
  );

  const existingBySlug = new Map<string, string>(
    (await prisma.pageLayout.findMany({ select: { id: true, slug: true } })).map(
      (l) => [l.slug, l.id],
    ),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;
  let skippedNoDept = 0;

  for (const fam of FAMILIES) {
    const [rows] = await legacy.query<mysql.RowDataPacket[]>(
      `SELECT ${fam.cols} FROM ${fam.table} WHERE deleted = 0 AND status = 1 ORDER BY id`,
    );
    const [langs] = await legacy.query<mysql.RowDataPacket[]>(
      `SELECT ${fam.fk} AS fk, ${fam.langCols} FROM ${fam.langTable}`,
    );
    const byId = new Map<number, LangRow[]>();
    for (const r of langs as unknown as LangRow[]) {
      const arr = byId.get(r.fk) ?? [];
      arr.push(r);
      byId.set(r.fk, arr);
    }

    for (const row of rows as unknown as Row[]) {
      const dept = row.deptid ? deptSlug.get(row.deptid) : undefined;
      if (!dept) {
        // Không biết thuộc bộ môn nào thì không đoán đường dẫn — bỏ qua, để link
        // chết còn dễ phát hiện hơn là tạo trang ở chỗ sai.
        skippedNoDept += 1;
        continue;
      }
      const slug = `${dept}/${fam.segment}/${row.slug}`;
      const langsOf = byId.get(row.id) ?? [];
      const vi = langsOf.find((l) => l.langid === 1);
      const en = langsOf.find((l) => l.langid === 2);
      const titleVi = decodeEntities((vi?.title ?? en?.title ?? row.slug).trim());
      const titleEn = decodeEntities((en?.title ?? vi?.title ?? row.slug).trim());
      const bodyVi = transformLegacyHtml(vi?.content ?? en?.content);
      const bodyEn = transformLegacyHtml(en?.content) || bodyVi;
      const excerptVi = vi?.excerpt ? decodeEntities(vi.excerpt) : '';
      const excerptEn = en?.excerpt ? decodeEntities(en.excerpt) : excerptVi;
      const heroBg =
        rewriteImagePath(row.bgimage) ?? rewriteImagePath(row.image) ?? '';

      const tree = {
        root: {},
        content: [
          { type: 'SiteHeader', props: { id: `hdr-${row.slug}` } },
          {
            type: 'PageHero',
            props: {
              id: `hero-${row.slug}`,
              title: { vi: titleVi, en: titleEn },
              subtitle: { vi: excerptVi, en: excerptEn },
              bgImage: heroBg,
            },
          },
          {
            type: 'LegacyPageBody',
            props: {
              id: `body-${row.slug}`,
              html: { vi: bodyVi, en: bodyEn },
            },
          },
          { type: 'SiteFooter', props: { id: `ftr-${row.slug}` } },
        ],
      };

      try {
        const now = new Date();
        const existingId = existingBySlug.get(slug);
        if (existingId) {
          await prisma.pageLayout.update({
            where: { id: existingId },
            data: {
              name: titleVi || row.slug,
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
              name: titleVi || row.slug,
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
      } catch (err) {
        failed += 1;
        console.error(`  ! fail ${slug}:`, (err as Error).message);
      }
    }
    console.log(`${fam.table}: xong`);
  }

  await legacy.end();
  console.log(
    `Done. created=${created} updated=${updated} failed=${failed} bo_qua_khong_ro_bo_mon=${skippedNoDept}`,
  );
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
