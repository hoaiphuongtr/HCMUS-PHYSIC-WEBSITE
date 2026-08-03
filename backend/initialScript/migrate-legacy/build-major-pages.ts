/**
 * build-major-pages.ts — migrate the legacy "ngành học" (major) pages.
 *
 * The admissions table on /tuyen-sinh-dai-hoc links every programme to
 * https://phys.hcmus.edu.vn/nganh-hoc/<slug>. Those pages live in the legacy
 * `majors` / `majorslang` tables (NOT `pages`, which is why the first migration
 * pass missed them) and every one of those links 404s on the new site.
 *
 * Unlike a legacy `page`, a major is stored as NINE separate HTML columns — one
 * per tab of the old programme page. They stay as TABS (LegacyPageBody.sections):
 * stitching them into one document made a page far too long to read.
 *
 * Same frame as the other migrated section pages: SiteHeader → PageHero →
 * LegacyPageBody → SiteFooter. Idempotent: re-running refreshes content in place.
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker start legacy-mariadb   # or create it and import dump/legacy.sql
 *
 * Run:
 *   pnpm --filter backend exec tsx --env-file=.env \
 *     initialScript/migrate-legacy/build-major-pages.ts
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

/** The old site serves these at /nganh-hoc/<slug>; keep the same public path. */
const SLUG_PREFIX = 'nganh-hoc/';

/**
 * The nine content columns, in the order the old programme page showed them,
 * with the headings that page used.
 */
const SECTIONS = [
  { col: 'content', vi: 'Giới thiệu chung', en: 'Overview' },
  { col: 'stdout', vi: 'Chuẩn đầu ra', en: 'Learning outcomes' },
  { col: 'curriculum', vi: 'Chương trình đào tạo', en: 'Curriculum' },
  { col: 'prospects', vi: 'Triển vọng nghề nghiệp', en: 'Career prospects' },
  { col: 'fee', vi: 'Học phí', en: 'Tuition' },
  { col: 'researches', vi: 'Hướng nghiên cứu', en: 'Research' },
  { col: 'students', vi: 'Sinh viên', en: 'Students' },
  { col: 'alumni', vi: 'Cựu sinh viên', en: 'Alumni' },
  { col: 'rpartners', vi: 'Đối tác', en: 'Partners' },
] as const;

type MajorRow = {
  id: number;
  slug: string;
  image: string | null;
  bgimage: string | null;
};

type MajorLangRow = {
  majorid: number;
  langid: number;
  title: string | null;
} & Record<string, string | null | number>;

/**
 * Mỗi tab của trang ngành cũ là một cột HTML riêng, nên giữ nguyên dạng TAB thay vì
 * ghép hết vào một trang: ghép lại thì trang dài tới mức không ai cuộn hết.
 * Bỏ qua tab chỉ có markup rỗng ("<p>&nbsp;</p>") để không sinh tab trống.
 */
const buildSections = (
  vi: MajorLangRow | undefined,
  en: MajorLangRow | undefined,
): { title: { vi: string; en: string }; html: { vi: string; en: string } }[] => {
  const out: {
    title: { vi: string; en: string };
    html: { vi: string; en: string };
  }[] = [];
  for (const section of SECTIONS) {
    const htmlVi = transformLegacyHtml(
      (vi ?? en)?.[section.col] as string | null,
    );
    const htmlEn = transformLegacyHtml(en?.[section.col] as string | null);
    const hasVi = htmlVi.replace(/<[^>]+>/g, '').trim().length >= 10;
    const hasEn = htmlEn.replace(/<[^>]+>/g, '').trim().length >= 10;
    if (!hasVi && !hasEn) continue;
    out.push({
      title: { vi: section.vi, en: section.en },
      html: { vi: hasVi ? htmlVi : htmlEn, en: hasEn ? htmlEn : htmlVi },
    });
  }
  return out;
};

async function main(): Promise<void> {
  // PageLayout.createdBy là NOT NULL — mượn chủ sở hữu của layout mẫu, nếu không
  // có thì lấy layout bất kỳ đang tồn tại.
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
  const [majorRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, slug, image, bgimage FROM majors WHERE deleted = 0 AND status = 1 ORDER BY id',
  );
  const cols = SECTIONS.map((s) => s.col).join(', ');
  const [langRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT majorid, langid, title, ${cols} FROM majorslang`,
  );
  await legacy.end();

  const majors = majorRows as unknown as MajorRow[];
  const langByMajor = new Map<number, MajorLangRow[]>();
  for (const r of langRows as unknown as MajorLangRow[]) {
    const arr = langByMajor.get(r.majorid) ?? [];
    arr.push(r);
    langByMajor.set(r.majorid, arr);
  }

  // slug is not unique in the schema, so upsert by hand.
  const existingBySlug = new Map<string, string>(
    (await prisma.pageLayout.findMany({ select: { id: true, slug: true } })).map(
      (l) => [l.slug, l.id],
    ),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const major of majors) {
    const slug = `${SLUG_PREFIX}${major.slug}`;
    const langs = langByMajor.get(major.id) ?? [];
    const vi = langs.find((l) => l.langid === 1);
    const en = langs.find((l) => l.langid === 2);
    const titleVi = decodeEntities((vi?.title ?? en?.title ?? major.slug).trim());
    const titleEn = decodeEntities((en?.title ?? vi?.title ?? major.slug).trim());
    const sections = buildSections(vi, en);
    const heroBg =
      rewriteImagePath(major.bgimage) ?? rewriteImagePath(major.image) ?? '';

    const tree = {
      root: {},
      content: [
        { type: 'SiteHeader', props: { id: `hdr-${major.slug}` } },
        {
          type: 'PageHero',
          props: {
            id: `hero-${major.slug}`,
            title: { vi: titleVi, en: titleEn },
            subtitle: { vi: '', en: '' },
            bgImage: heroBg,
          },
        },
        {
          type: 'LegacyPageBody',
          props: {
            id: `body-${major.slug}`,
            // html để trống: khi có sections thì trang render dạng tab.
            html: { vi: '', en: '' },
            sections,
          },
        },
        { type: 'SiteFooter', props: { id: `ftr-${major.slug}` } },
      ],
    };

    try {
      const now = new Date();
      const existingId = existingBySlug.get(slug);
      if (existingId) {
        await prisma.pageLayout.update({
          where: { id: existingId },
          data: {
            name: titleVi || major.slug,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
          },
        });
        updated++;
        console.log(`  ~ ${slug}  (${sections.length} muc)`);
      } else {
        const row = await prisma.pageLayout.create({
          data: {
            name: titleVi || major.slug,
            slug,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
            createdBy: owner,
          },
        });
        existingBySlug.set(slug, row.id);
        created++;
        console.log(`  + ${slug}  (${sections.length} muc)`);
      }
    } catch (err) {
      failed++;
      console.error(`  ! fail ${slug}:`, (err as Error).message);
    }
  }

  console.log(`\nDone. created=${created} updated=${updated} failed=${failed}`);
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
