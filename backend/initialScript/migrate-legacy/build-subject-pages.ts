/**
 * build-subject-pages.ts — migrate the legacy "môn học" (subject) pages.
 *
 * Every curriculum table on the site links each course to
 * https://phys.hcmus.edu.vn/mon-hoc/<slug>. None of those pages existed on the new
 * site: the content lives in the legacy `subjects` / `subjectslang` tables, which
 * the first migration pass never touched (same blind spot as `majors`).
 *
 * A link audit over all published layouts found 585 dead internal links; 429 of
 * them — 73% — are these course pages.
 *
 * Same frame as the other migrated section pages: SiteHeader → PageHero →
 * LegacyPageBody → SiteFooter. Idempotent: re-running refreshes content in place.
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker start legacy-mariadb
 *
 * Run:
 *   pnpm --filter backend exec tsx --env-file=.env \
 *     initialScript/migrate-legacy/build-subject-pages.ts
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

/** The old site serves these at /mon-hoc/<slug>; keep the same public path. */
const SLUG_PREFIX = 'mon-hoc/';

type SubjectRow = {
  id: number;
  code: string | null;
  slug: string;
  image: string | null;
  bgimage: string | null;
};

type SubjectLangRow = {
  subjectid: number;
  langid: number;
  title: string | null;
  content: string | null;
  excerpt: string | null;
};

async function main(): Promise<void> {
  // PageLayout.createdBy là NOT NULL — mượn chủ sở hữu của layout mẫu.
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
  const [subjectRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, code, slug, image, bgimage FROM subjects WHERE deleted = 0 AND status = 1 ORDER BY id',
  );
  const [langRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT subjectid, langid, title, content, excerpt FROM subjectslang',
  );
  await legacy.end();

  const subjects = subjectRows as unknown as SubjectRow[];
  const langBySubject = new Map<number, SubjectLangRow[]>();
  for (const r of langRows as unknown as SubjectLangRow[]) {
    const arr = langBySubject.get(r.subjectid) ?? [];
    arr.push(r);
    langBySubject.set(r.subjectid, arr);
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
  const thin: string[] = [];

  for (const subject of subjects) {
    const slug = `${SLUG_PREFIX}${subject.slug}`;
    const langs = langBySubject.get(subject.id) ?? [];
    const vi = langs.find((l) => l.langid === 1);
    const en = langs.find((l) => l.langid === 2);
    const titleVi = decodeEntities(
      (vi?.title ?? en?.title ?? subject.slug).trim(),
    );
    const titleEn = decodeEntities(
      (en?.title ?? vi?.title ?? subject.slug).trim(),
    );
    const bodyVi = transformLegacyHtml(vi?.content ?? en?.content);
    const bodyEn = transformLegacyHtml(en?.content) || bodyVi;
    if (bodyVi.replace(/<[^>]+>/g, '').trim().length < 40) thin.push(slug);
    const excerptVi = vi?.excerpt ? decodeEntities(vi.excerpt) : '';
    const excerptEn = en?.excerpt ? decodeEntities(en.excerpt) : excerptVi;
    const heroBg =
      rewriteImagePath(subject.bgimage) ?? rewriteImagePath(subject.image) ?? '';

    const tree = {
      root: {},
      content: [
        { type: 'Header', props: { id: `hdr-${subject.slug}` } },
        {
          type: 'PageHero',
          props: {
            id: `hero-${subject.slug}`,
            title: { vi: titleVi, en: titleEn },
            subtitle: { vi: excerptVi, en: excerptEn },
            bgImage: heroBg,
          },
        },
        {
          type: 'LegacyPageBody',
          props: {
            id: `body-${subject.slug}`,
            html: { vi: bodyVi, en: bodyEn },
          },
        },
        { type: 'Footer', props: { id: `ftr-${subject.slug}` } },
      ],
    };

    try {
      const now = new Date();
      const existingId = existingBySlug.get(slug);
      if (existingId) {
        await prisma.pageLayout.update({
          where: { id: existingId },
          data: {
            name: titleVi || subject.slug,
            description: excerptVi || null,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
          },
        });
        updated++;
      } else {
        const row = await prisma.pageLayout.create({
          data: {
            name: titleVi || subject.slug,
            slug,
            description: excerptVi || null,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
            createdBy: owner,
          },
        });
        existingBySlug.set(slug, row.id);
        created++;
      }
    } catch (err) {
      failed++;
      console.error(`  ! fail ${slug}:`, (err as Error).message);
    }
  }

  console.log(`Done. created=${created} updated=${updated} failed=${failed}`);
  if (thin.length)
    console.log(`nội dung mỏng (vẫn tạo): ${thin.length} trang`);
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
