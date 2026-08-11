/**
 * backfill-english-content.ts — lấy lại nội dung TIẾNG ANH bị mất khi di trú.
 *
 * Site cũ có bản Anh ở `/en/<đường-dẫn>.html` cho hầu hết trang, nhưng bản di
 * trú lại chép nguyên tiếng Việt sang ô tiếng Anh: đếm trên dữ liệu thật có 142
 * khối nội dung đang để `en` trùng khít `vi`, trong khi site cũ thật sự có bản
 * dịch ("TRAINING PROGRAM PHYSICS 2023"…). Người xem bấm English thì đọc tiếng
 * Việt.
 *
 * Script dò từng layout như vậy, lấy bản `/en/` từ origin cũ và ghi đè ô tiếng
 * Anh. Chỉ ghi khi nội dung lấy về KHÁC bản tiếng Việt — trang nào site cũ vốn
 * để giống nhau (danh mục công bố, bảng số liệu) thì giữ nguyên.
 *
 * Origin cũ đi bằng IP + header Host vì tên miền đã trỏ sang site mới.
 *
 * Chạy (mặc định chỉ liệt kê, thêm --apply để ghi thật):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/backfill-english-content.ts
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/backfill-english-content.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as https from 'node:https';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { transformLegacyHtml } from './legacy-html';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  // Script tải hàng trăm trang từ origin cũ nên kết nối DB nằm không nhiều phút
  // liền; không bật keepAlive thì đường hầm SSH rớt giữa chừng ("Connection
  // terminated unexpectedly") và mất phần chưa ghi.
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
      keepAlive: true,
      idleTimeoutMillis: 0,
    }),
  ),
});

const LEGACY_ORIGIN_IP = '112.78.11.146';
const LEGACY_HOST = 'phys.hcmus.edu.vn';
const APPLY = process.argv.includes('--apply');

/** Các lớp bọc nội dung của site cũ, thử lần lượt, hẹp nhất trước. */
const CONTENT_CLASSES = [
  'blogpost-content',
  'main col-md-9',
  'main col-lg-9',
  'main col-12',
];

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
        rejectUnauthorized: false,
        timeout: 40_000,
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

/** Trang không tồn tại vẫn trả 200 kèm trang soft-404 → nhận ra bằng tiêu đề. */
function isSoft404(html: string): boolean {
  return /<title>\s*404/i.test(html);
}

type Localized = { vi?: string; en?: string } | null | undefined;

/** Khối nội dung cần vá: html chính của LegacyPageBody/PostBody và từng tab. */
type Slot = { get: () => Localized; set: (en: string) => void };

/** Tiêu đề trang (PageHero) cũng bị chép tiếng Việt sang ô tiếng Anh. */
function collectTitleSlots(tree: unknown): Slot[] {
  const out: Slot[] = [];
  const content = (tree as { content?: unknown[] })?.content;
  if (!Array.isArray(content)) return out;
  for (const node of content) {
    if ((node as { type?: string })?.type !== 'PageHero') continue;
    const title = (node as { props?: { title?: Localized } })?.props?.title;
    if (title && typeof title === 'object') {
      out.push({
        get: () => title,
        set: (en) => ((title as { en?: string }).en = en),
      });
    }
  }
  return out;
}

/**
 * Trang nào bản tiếng Anh không có tiêu đề riêng thì thẻ <title> chỉ còn tên
 * site — nhận về là ghi "Khoa Vật lý - Vật lý kỹ thuật" làm tiêu đề tiếng Anh
 * cho 15 trang, sai hẳn. Chặn đúng các chuỗi đó.
 */
const SITE_TITLES = [
  'khoa vật lý - vật lý kỹ thuật',
  'faculty of physics and engineering physics',
];

/** Tiêu đề tiếng Anh nằm ở thẻ <title>, có hậu tố tên Khoa phía sau dấu |. */
function extractTitle(html: string): string {
  const m = /<title>([\s\S]*?)<\/title>/.exec(html);
  const raw = (m?.[1] ?? '').split('|')[0].replace(/\s+/g, ' ').trim();
  return SITE_TITLES.includes(raw.toLowerCase()) ? '' : raw;
}

function collectSlots(tree: unknown): Slot[] {
  const slots: Slot[] = [];
  const content = (tree as { content?: unknown[] })?.content;
  if (!Array.isArray(content)) return slots;
  for (const node of content) {
    const props = (node as { props?: Record<string, unknown> })?.props;
    if (!props) continue;
    const html = props.html as Localized;
    if (html && typeof html === 'object') {
      slots.push({ get: () => html, set: (en) => ((html as { en?: string }).en = en) });
    }
    const sections = props.sections;
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        const secHtml = (sec as { html?: Localized })?.html;
        if (secHtml && typeof secHtml === 'object') {
          slots.push({
            get: () => secHtml,
            set: (en) => ((secHtml as { en?: string }).en = en),
          });
        }
      }
    }
  }
  return slots;
}

/** Đường dẫn tiếng Anh khả dĩ trên site cũ, thử lần lượt. */
function candidatePaths(slug: string): string[] {
  const last = slug.split('/').pop() ?? slug;
  const out = [`en/${slug}.html`];
  if (last !== slug) out.push(`en/${last}.html`);
  return out;
}

async function main(): Promise<void> {
  const layouts = await prisma.pageLayout.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
  });

  let checked = 0;
  let fixedBody = 0;
  let fixedTitle = 0;
  let noEnglish = 0;
  let identical = 0;

  const needsEnglish = (s: Slot, min: number) => {
    const h = s.get();
    const vi = h?.vi ?? '';
    return vi.length >= min && (h?.en ?? '') === vi;
  };

  for (const layout of layouts) {
    const published = layout.publishedPuckData as unknown;
    const draft = layout.puckData as unknown;
    const needyBody = collectSlots(published).filter((s) => needsEnglish(s, 200));
    // Tiêu đề ngắn nên ngưỡng thấp; nhiều trang chỉ lệch mỗi tiêu đề.
    const needyTitle = collectTitleSlots(published).filter((s) =>
      needsEnglish(s, 1),
    );
    if (needyBody.length === 0 && needyTitle.length === 0) continue;
    checked += 1;

    let page: string | null = null;
    for (const path of candidatePaths(layout.slug)) {
      try {
        const html = await fetchLegacy(path);
        if (isSoft404(html)) continue;
        page = html;
        break;
      } catch {
        // thử đường dẫn kế tiếp
      }
    }

    if (!page) {
      noEnglish += 1;
      console.log(`  - ${layout.slug}: site cũ không có bản tiếng Anh`);
      continue;
    }

    // --- Tiêu đề -----------------------------------------------------------
    const titleEn = extractTitle(page);
    if (needyTitle.length > 0 && titleEn) {
      const titleVi = needyTitle[0]?.get()?.vi ?? '';
      if (titleEn !== titleVi) {
        console.log(`  T ${layout.slug}: tiêu đề → "${titleEn}"`);
        fixedTitle += 1;
        if (APPLY) {
          for (const slot of needyTitle) slot.set(titleEn);
          for (const slot of collectTitleSlots(draft)) {
            if (needsEnglish(slot, 1)) slot.set(titleEn);
          }
        }
      }
    }

    // --- Thân bài ----------------------------------------------------------
    let bodyChanged = false;
    if (needyBody.length > 0) {
      const main = extractMain(page);
      const englishBody = main ? transformLegacyHtml(main) : '';
      const viBody = needyBody[0]?.get()?.vi ?? '';
      if (englishBody.length <= 200 || englishBody === viBody) {
        identical += 1;
      } else if (needyBody.length > 1) {
        // Trang chia tab: bản /en/ là NGUYÊN trang, không tách theo từng tab được.
        console.log(
          `  ? ${layout.slug}: ${needyBody.length} khối cần vá nhưng bản /en/ chỉ là một trang — bỏ qua`,
        );
      } else {
        console.log(
          `  + ${layout.slug}: thân bài ${englishBody.length}b (vi ${viBody.length}b)`,
        );
        fixedBody += 1;
        bodyChanged = true;
        if (APPLY) {
          needyBody[0]?.set(englishBody);
          for (const slot of collectSlots(draft)) {
            const h = slot.get();
            if ((h?.vi ?? '') === viBody && (h?.en ?? '') === viBody) {
              slot.set(englishBody);
            }
          }
        }
      }
    }

    if (APPLY && (bodyChanged || fixedTitle > 0)) {
      await prisma.pageLayout.update({
        where: { id: layout.id },
        data: {
          publishedPuckData: published as Prisma.InputJsonValue,
          puckData: draft as Prisma.InputJsonValue,
        },
      });
    }
  }

  console.log(
    `\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. ` +
      `layout cần vá=${checked} thân bài=${fixedBody} tiêu đề=${fixedTitle} ` +
      `không có bản Anh=${noEnglish} bản Anh trùng bản Việt=${identical}`,
  );
  if (APPLY) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
