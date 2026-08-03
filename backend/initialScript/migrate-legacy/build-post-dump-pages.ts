/**
 * build-post-dump-pages.ts — di trú các trang được tạo trên site cũ SAU mốc dump.
 *
 * Bản dump MariaDB dừng ở 14/06/2026, nên trang nào Khoa đăng sau đó không có
 * trong `pages`/`posts` — kiểm tra link chết thấy 404 mà không tìm được nguồn.
 * Những trang này chỉ còn tồn tại ở origin cũ, nên script lấy HTML trực tiếp từ
 * đó (theo IP + header Host, vì tên miền đã trỏ sang site mới) rồi bóc phần
 * nội dung trong `div.main.col-md-9`.
 *
 * Dùng lại đúng khung như các trang đã di trú: SiteHeader → PageHero →
 * LegacyPageBody → SiteFooter. Chạy lại được nhiều lần: có sẵn thì cập nhật.
 *
 * KHÔNG cần legacy MariaDB — chỉ cần mạng tới origin cũ.
 *
 * Chạy (DATABASE_URL có thể trỏ sandbox qua deploy/tunnel-sandbox-db.py):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/build-post-dump-pages.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as https from 'node:https';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { decodeEntities, transformLegacyHtml } from './legacy-html';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

/** Origin cũ: tên miền đã cắt sang site mới nên phải đi bằng IP + Host header. */
const LEGACY_ORIGIN_IP = '112.78.11.146';
const LEGACY_HOST = 'phys.hcmus.edu.vn';

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e'; // post-template-default (lấy createdBy)

/** Đường dẫn trên site cũ → slug công khai trên site mới. */
const TARGETS: Record<string, string> = {
  'bai-baohoi-nghi-trong-nuoc-2026.html': 'bai-baohoi-nghi-trong-nuoc-2026',
  'bai-baohoi-nghi-thuoc-danh-muc-scopusisi-nam-2026.html':
    'bai-baohoi-nghi-thuoc-danh-muc-scopusisi-nam-2026',
  // Dump ghi deleted=1 nhưng site cũ vẫn phục vụ bài này và trang tin bộ môn vẫn
  // trỏ tới, nên lấy từ origin để giữ đúng hiện trạng công khai.
  'vat-ly-dia-cau/tin-tuc/thong-tin-tuyen-dung-thang-032021':
    'vat-ly-dia-cau/tin-tuc/thong-tin-tuyen-dung-thang-032021',
};

function fetchLegacy(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: LEGACY_ORIGIN_IP,
        port: 443,
        path: `/${path}`,
        method: 'GET',
        headers: { Host: LEGACY_HOST },
        servername: LEGACY_HOST,
        // Chứng chỉ cấp cho tên miền, còn ta gọi bằng IP nên phải bỏ qua kiểm tra.
        rejectUnauthorized: false,
        timeout: 30_000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c: string) => (body += c));
        res.on('end', () => resolve(body));
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

/**
 * Bóc phần nội dung bằng cách đếm thẻ div lồng nhau.
 *
 * Trang tĩnh dùng `div.main.col-md-9`, còn trang bài viết dùng
 * `div.blogpost-content` (nằm trong `div.main.col-lg-9`) — thử lần lượt và lấy
 * lớp hẹp nhất trước để không kéo theo tiêu đề/ngày đăng của khung blog.
 */
const CONTENT_CLASSES = ['blogpost-content', 'main col-md-9', 'main col-lg-9'];

function extractByClass(html: string, cls: string): string | null {
  const open = new RegExp(`<div[^>]*class="${cls}"[^>]*>`).exec(html);
  if (!open) return null;
  const from = open.index + open[0].length;
  let depth = 1;
  const tag = /<\/?div\b/g;
  tag.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(html))) {
    depth += m[0] === '<div' ? 1 : -1;
    if (depth === 0) return html.slice(from, m.index);
  }
  return null;
}

function extractMain(html: string): string | null {
  for (const cls of CONTENT_CLASSES) {
    const found = extractByClass(html, cls);
    if (found && found.trim().length > 0) return found;
  }
  return null;
}

function extractTitle(html: string): string {
  const m = /<title>([\s\S]*?)<\/title>/.exec(html);
  // Title trên site cũ có hậu tố "| Khoa Vật lý - Vật lý kỹ thuật".
  return decodeEntities((m?.[1] ?? '').split('|')[0].trim());
}

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

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [legacyPath, slug] of Object.entries(TARGETS)) {
    try {
      const html = await fetchLegacy(legacyPath);
      const main = extractMain(html);
      if (!main) throw new Error('không tìm được div.main.col-md-9');
      const body = transformLegacyHtml(main);
      if (body.length < 200)
        throw new Error(`nội dung quá ngắn (${body.length}b), nghi là trang lỗi`);
      const title = extractTitle(html) || slug;

      const tree = {
        root: {},
        content: [
          { type: 'SiteHeader', props: { id: `hdr-${slug}` } },
          {
            type: 'PageHero',
            props: {
              id: `hero-${slug}`,
              title: { vi: title, en: title },
              subtitle: { vi: '', en: '' },
              bgImage: '',
            },
          },
          {
            type: 'LegacyPageBody',
            props: { id: `body-${slug}`, html: { vi: body, en: body } },
          },
          { type: 'SiteFooter', props: { id: `ftr-${slug}` } },
        ],
      };

      const now = new Date();
      // slug không có unique index nên phải findFirst, không dùng findUnique được.
      const existing = await prisma.pageLayout.findFirst({
        where: { slug },
        select: { id: true },
      });
      const data = {
        name: title,
        puckData: tree as unknown as Prisma.InputJsonValue,
        publishedPuckData: tree as unknown as Prisma.InputJsonValue,
        isPublished: true,
        publishedAt: now,
      };
      if (existing) {
        await prisma.pageLayout.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.pageLayout.create({ data: { ...data, slug, createdBy: owner } });
        created += 1;
      }
      console.log(`  ${existing ? '~' : '+'} ${slug}  (${body.length}b)`);
    } catch (err) {
      failed += 1;
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
