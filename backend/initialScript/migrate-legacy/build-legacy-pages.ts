/**
 * build-legacy-pages.ts — create the new-site PageLayouts that the legacy header
 * dropdowns point to but which were never migrated (legacy `pages`).
 *
 * Each new layout reuses the post template (SiteHeader → content → SiteFooter,
 * so header/footer auto-syndicate the homepage navbar) and injects the legacy
 * page's title + HTML body via injectPostIntoPuckData — reproducing the legacy
 * single-column content page (banner + title + body) 1-to-1.
 *
 * Idempotent: slugs that already exist as a PageLayout are skipped.
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker run -d --name legacy-mariadb -e MARIADB_ROOT_PASSWORD=root \
 *     -p 3309:3306 mariadb:10.6 ; import dump/legacy.sql into db `legacy`.
 *
 * Run:
 *   pnpm --filter backend exec tsx --env-file=.env \
 *     initialScript/migrate-legacy/build-legacy-pages.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { injectPostIntoPuckData } from '../../src/post/puck-inject';
import type { PostInjectPayload } from '../../src/post/puck-inject';
import { decodeEntities, rewriteImagePath, transformLegacyHtml } from './legacy-html';
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

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e'; // post-template-default

/** Legacy page ids referenced by the header dropdowns that need a new layout. */
const PAGE_IDS = [
  1, 128, 2, 134, // Trang chủ dropdown
  195, 203, 196, // Đội ngũ
  200, 236, 308, 8, 7, 125, 199, // Đào tạo
  311, // Hội nghị
  201, 243, 4, 5, 3, 6, // Nghiên cứu
  10, 129, 271, 280, // Hoạt động
  214, // Tuyển sinh — Việc làm ngành Vật lý (existed unpublished; republish from legacy)
  171, 14, // Cựu sinh viên
  292, // ASIIN 2024-2025
];

type PageRow = {
  id: number;
  slug: string;
  image: string | null;
  bgimage: string | null;
};

// Post-only chrome that legacy info pages don't have — removed from page layouts.
const DROP_TYPES = new Set(['PostReaderTools', 'PostTagList', 'PostEventInfo']);

type AnyNode = { type?: string; props?: Record<string, unknown> };

/**
 * Replace the injected PostBody (normalising renderer) with a LegacyHtml node
 * (faithful renderer that preserves legacy inline styles), and drop post-only
 * chrome. Returns a new tree.
 */
function pageBodyTransform(
  tree: unknown,
  html: { vi: string; en: string },
  slug: string,
): unknown {
  const walk = (nodes: AnyNode[]): AnyNode[] =>
    nodes
      .filter((n) => !(n?.type && DROP_TYPES.has(n.type)))
      .map((n) => {
        if (n?.type === 'PostBody') {
          return {
            type: 'LegacyHtml',
            props: { id: `legacy-body-${slug}`, html, injected: true },
          };
        }
        const props = { ...(n?.props ?? {}) } as Record<string, unknown>;
        for (const [k, v] of Object.entries(props)) {
          if (Array.isArray(v) && v.some((x) => x && typeof x === 'object' && 'type' in x)) {
            props[k] = walk(v as AnyNode[]);
          }
        }
        return { ...n, props };
      });
  const t = tree as { content?: AnyNode[] };
  return { ...t, content: walk(t.content ?? []) };
}
type LangRow = {
  pageid: number;
  langid: number;
  title: string | null;
  content: string | null;
  excerpt: string | null;
};

async function main(): Promise<void> {
  const template = await prisma.pageLayout.findUnique({
    where: { id: TEMPLATE_ID },
    select: { puckData: true, createdBy: true },
  });
  if (!template) throw new Error(`Post template ${TEMPLATE_ID} not found`);

  const legacy = await mysql.createConnection(LEGACY);

  const [pageRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT id, slug, image, bgimage FROM pages WHERE id IN (${PAGE_IDS.join(',')}) AND deleted = 0`,
  );
  const [langRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT pageid, langid, title, content, excerpt FROM pageslang WHERE pageid IN (${PAGE_IDS.join(',')})`,
  );
  await legacy.end();

  const pages = pageRows as unknown as PageRow[];
  const langByPage = new Map<number, LangRow[]>();
  for (const r of langRows as unknown as LangRow[]) {
    const arr = langByPage.get(r.pageid) ?? [];
    arr.push(r);
    langByPage.set(r.pageid, arr);
  }

  // Map slug -> existing layout id, so re-runs refresh content (slug is not unique
  // in the schema, so we can't use prisma upsert).
  const existingBySlug = new Map<string, string>(
    (await prisma.pageLayout.findMany({ select: { id: true, slug: true } })).map(
      (l) => [l.slug, l.id],
    ),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;
  const thin: string[] = [];
  const missing: number[] = [];

  for (const id of PAGE_IDS) {
    const page = pages.find((p) => p.id === id);
    if (!page) {
      missing.push(id);
      continue;
    }
    const langs = langByPage.get(id) ?? [];
    const vi = langs.find((l) => l.langid === 1);
    const en = langs.find((l) => l.langid === 2);
    const titleVi = decodeEntities((vi?.title ?? en?.title ?? page.slug).trim());
    const bodyVi = transformLegacyHtml(vi?.content ?? en?.content);
    const bodyEn = transformLegacyHtml(en?.content) || bodyVi;
    if (bodyVi.replace(/<[^>]+>/g, '').trim().length < 40) thin.push(page.slug);

    const coverUrl = rewriteImagePath(page.image) ?? rewriteImagePath(page.bgimage);

    const payload: PostInjectPayload = {
      title: titleVi,
      body: bodyVi,
      excerpt: vi?.excerpt ? decodeEntities(vi.excerpt) : null,
      coverUrl,
      coverAlt: titleVi,
      tags: [],
      category: '',
      categoryLabel: '',
      publishedAt: null,
      eventStartAt: null,
      eventEndAt: null,
      eventLocation: null,
    };

    // Inject title/cover via the template placeholders, then swap the normalising
    // PostBody for a faithful LegacyHtml node (localized vi+en) and drop post chrome.
    const injected = injectPostIntoPuckData(template.puckData, payload);
    const tree = pageBodyTransform(injected, { vi: bodyVi, en: bodyEn }, page.slug);
    try {
      const now = new Date();
      const existingId = existingBySlug.get(page.slug);
      if (existingId) {
        await prisma.pageLayout.update({
          where: { id: existingId },
          data: {
            name: titleVi || page.slug,
            description: payload.excerpt,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
          },
        });
        updated++;
        console.log(`  ~ ${page.slug}  (legacy page ${id}, updated)`);
      } else {
        const row = await prisma.pageLayout.create({
          data: {
            name: titleVi || page.slug,
            slug: page.slug,
            description: payload.excerpt,
            puckData: tree as unknown as Prisma.InputJsonValue,
            publishedPuckData: tree as unknown as Prisma.InputJsonValue,
            isPublished: true,
            publishedAt: now,
            createdBy: template.createdBy,
          },
        });
        existingBySlug.set(page.slug, row.id);
        created++;
        console.log(`  + ${page.slug}  (legacy page ${id})`);
      }
    } catch (err) {
      failed++;
      console.error(`  ! fail slug=${page.slug} page=${id}:`, (err as Error).message);
    }
  }

  console.log(
    `\nDone. created=${created} updated=${updated} failed=${failed}`,
  );
  if (missing.length) console.log(`legacy pages not found: ${missing.join(', ')}`);
  if (thin.length) console.log(`thin/near-empty content (created anyway): ${thin.join(', ')}`);
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
