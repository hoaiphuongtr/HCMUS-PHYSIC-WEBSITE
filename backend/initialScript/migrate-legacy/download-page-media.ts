/**
 * download-page-media.ts — fetch the images/PDFs referenced by the legacy section
 * pages (built by build-legacy-pages.ts) into backend/uploads/legacy/, so the
 * rewritten /uploads/legacy/... srcs resolve locally instead of hitting the live
 * site. Mirrors download-media.ts but sources paths from the legacy `pages`
 * content (img + iframe srcs + page.image/bgimage).
 *
 * Run after build-legacy-pages.ts, with the legacy MariaDB up:
 *   pnpm --filter backend exec tsx --env-file=.env \
 *     initialScript/migrate-legacy/download-page-media.ts
 */
import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as mysql from 'mysql2/promise';

const LEGACY_BASE = 'https://phys.hcmus.edu.vn';
const UPLOAD_ROOT = join(__dirname, '../../uploads/legacy');
const CONCURRENCY = 6;

const LEGACY = {
  host: 'localhost',
  port: 3309,
  user: 'root',
  password: 'root',
  database: 'legacy',
};

const PAGE_IDS = [
  1, 128, 2, 134, 195, 203, 196, 200, 236, 308, 8, 7, 125, 199, 311, 201, 243,
  4, 5, 3, 6, 10, 129, 271, 280, 171, 14, 292,
];

/** Normalise any legacy asset reference to a `/uploads/<path>` form (no /legacy/). */
function normalize(raw: string): string | null {
  let src = raw.trim();
  if (!src) return null;
  if (src.startsWith(LEGACY_BASE)) src = src.slice(LEGACY_BASE.length);
  if (!src.startsWith('/uploads/')) return null;
  return src.replace(/^\/uploads\/legacy\//, '/uploads/');
}

function collect(html: string | null, out: Set<string>): void {
  if (!html) return;
  const rx = /(?:<img[^>]+src|<iframe[^>]+src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html)) !== null) {
    const n = normalize(m[1]);
    if (n) out.add(n);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

type Stats = { attempted: number; ok: number; skipped: number; failed: number };

async function downloadOne(path: string, stats: Stats): Promise<void> {
  stats.attempted++;
  // Decode each segment with decodeURIComponent so reserved chars (%26 -> &)
  // land on disk exactly as express.static will decode the request URL.
  // decodeURI() leaves & ? = + # encoded and would mis-name those files.
  const rel = path.replace(/^\/uploads\//, '');
  const decoded = rel
    .split('/')
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .join('/');
  const local = join(UPLOAD_ROOT, decoded);
  if (await fileExists(local)) {
    stats.skipped++;
    return;
  }
  try {
    const res = await fetch(LEGACY_BASE + path);
    if (!res.ok || !res.body) {
      stats.failed++;
      console.warn(`  ! ${res.status} ${path}`);
      return;
    }
    await mkdir(dirname(local), { recursive: true });
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(local));
    stats.ok++;
  } catch (err) {
    stats.failed++;
    console.warn(`  ! err ${path}: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  const legacy = await mysql.createConnection(LEGACY);
  const [pageRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT image, bgimage FROM pages WHERE id IN (${PAGE_IDS.join(',')})`,
  );
  const [langRows] = await legacy.query<mysql.RowDataPacket[]>(
    `SELECT content FROM pageslang WHERE pageid IN (${PAGE_IDS.join(',')})`,
  );
  await legacy.end();

  const paths = new Set<string>();
  for (const r of pageRows as Array<{ image: string | null; bgimage: string | null }>) {
    for (const v of [r.image, r.bgimage]) {
      if (v) {
        const n = normalize(v);
        if (n) paths.add(n);
      }
    }
  }
  for (const r of langRows as Array<{ content: string | null }>) {
    collect(r.content, paths);
  }

  const list = [...paths];
  console.log(`Found ${list.length} unique assets to fetch.`);
  await mkdir(UPLOAD_ROOT, { recursive: true });

  const stats: Stats = { attempted: 0, ok: 0, skipped: 0, failed: 0 };
  const queue = [...list];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) break;
        await downloadOne(next, stats);
      }
    }),
  );
  console.log('Done.', stats);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
