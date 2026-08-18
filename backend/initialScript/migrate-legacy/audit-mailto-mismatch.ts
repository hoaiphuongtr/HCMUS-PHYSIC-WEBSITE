/**
 * audit-mailto-mismatch.ts — dò các link email SAI NGƯỜI.
 *
 * Site cũ có thói quen copy trang của người này để tạo trang người kia rồi chỉ
 * sửa CHỮ HIỂN THỊ mà quên sửa href. Kết quả:
 *
 *   Email: <a href="mailto:ntnquynh@hcmus.edu.vn">ntttrinh@hcmus.edu.vn</a>
 *                        ^^^ gửi nhầm người            ^^^ nhìn thì đúng
 *
 * Mắt thường không phát hiện được — phải bấm vào mới biết. Script so chữ hiển thị
 * với href; lệch nhau thì báo. CHỮ HIỂN THỊ được coi là đúng (đó là cái người
 * biên tập cố ý gõ), href là cái bị bỏ quên.
 *
 * Dò thôi (KHÔNG ghi gì):
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/audit-mailto-mismatch.ts
 * Sửa href cho khớp chữ hiển thị:
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/audit-mailto-mismatch.ts --fix
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const FIX = process.argv.includes('--fix');

const ANCHOR_RE =
  /<a\s[^>]*href=["']mailto:([^"'?]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
const EMAIL_RE = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

/** Bỏ thẻ + thực thể để lấy đúng chữ người dùng NHÌN THẤY trong link. */
function visibleText(inner: string): string {
  return inner
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

type Hit = { href: string; shown: string; auto: boolean; why: string };

const localOf = (e: string) => e.split('@')[0]?.toLowerCase() ?? '';
const domainOf = (e: string) => e.split('@')[1]?.toLowerCase() ?? '';
const isEduVn = (d: string) => d.endsWith('.edu.vn');

/** Khoảng cách sửa đổi — để nhận ra hai địa chỉ chỉ lệch nhau 1-2 ký tự (gõ nhầm). */
function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

/**
 * Quyết định có DÁM tự sửa hay không.
 *
 * Quy tắc chung "chữ hiển thị là đúng" chỉ đúng với lỗi copy-paste (chép trang
 * người này sang người kia, sửa chữ mà quên href). Có những ca ngược lại —
 * `dangvanliet@gamil.com` (gõ nhầm gmail) hiển thị, href `dvliet@hcmus.edu.vn`
 * mới là địa chỉ thật — sửa mù là biến link tốt thành link chết. Nên chỉ tự sửa
 * khi CHẮC, còn lại đẩy sang mục "cần xem tay".
 */
function classify(shown: string, href: string): { auto: boolean; why: string } {
  if (!EMAIL_RE.test(href))
    return { auto: true, why: 'href hỏng, không phải email' };
  if (localOf(shown) === localOf(href))
    return { auto: true, why: 'cùng người, href còn tên miền cũ' };
  if (!isEduVn(domainOf(shown)) && isEduVn(domainOf(href)))
    return {
      auto: false,
      why: 'chữ hiển thị là mail ngoài, href là mail cơ quan — href có thể mới đúng',
    };
  if (lev(localOf(shown), localOf(href)) <= 2)
    return { auto: false, why: 'chỉ lệch 1-2 ký tự — không rõ bên nào gõ nhầm' };
  return { auto: true, why: 'hai người khác hẳn nhau — lỗi copy-paste' };
}

/** Quét một chuỗi HTML, trả về các link lệch. */
function findMismatches(html: string): Hit[] {
  const hits: Hit[] = [];
  for (const m of html.matchAll(ANCHOR_RE)) {
    const href = m[1].trim();
    const shown = visibleText(m[2]);
    // Chỉ kết luận khi chữ hiển thị CHÍNH LÀ một email — nếu là "Liên hệ",
    // "Email" thì không có cơ sở nào để nói href sai.
    if (!EMAIL_RE.test(shown)) continue;
    if (shown.toLowerCase() === href.toLowerCase()) continue;
    hits.push({ href, shown, ...classify(shown, href) });
  }
  return hits;
}

/** Đi khắp cây JSON, áp `fn` lên mọi chuỗi (puckData chứa HTML ở nhiều chỗ). */
function mapStrings(node: unknown, fn: (s: string) => string): unknown {
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) return node.map((n) => mapStrings(n, fn));
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) out[k] = mapStrings(v, fn);
    return out;
  }
  return node;
}

/** Sửa href thành email đang hiển thị — CHỈ với nhóm đã phân loại là chắc chắn. */
function fixHtml(html: string): string {
  return html.replace(
    ANCHOR_RE,
    (whole: string, href: string, inner: string) => {
      const shown = visibleText(inner);
      if (!EMAIL_RE.test(shown)) return whole;
      const h = href.trim();
      if (shown.toLowerCase() === h.toLowerCase()) return whole;
      if (!classify(shown, h).auto) return whole; // để người xem tay
      return whole.replace(
        /href=["']mailto:[^"']*["']/i,
        `href="mailto:${shown}"`,
      );
    },
  );
}

async function main(): Promise<void> {
  const pages = await prisma.pageLayout.findMany({
    select: {
      id: true,
      slug: true,
      puckData: true,
      publishedPuckData: true,
    },
    orderBy: { slug: 'asc' },
  });

  let affected = 0;
  let autoLinks = 0;
  let reviewLinks = 0;
  let fixed = 0;
  const review: { slug: string; hit: Hit }[] = [];

  for (const page of pages) {
    const hits: Hit[] = [];
    mapStrings(page.puckData, (s) => {
      if (s.includes('mailto:')) hits.push(...findMismatches(s));
      return s;
    });
    if (hits.length === 0) continue;

    const autos = hits.filter((h) => h.auto);
    autoLinks += autos.length;
    for (const h of hits.filter((x) => !x.auto)) {
      reviewLinks += 1;
      review.push({ slug: page.slug, hit: h });
    }
    if (autos.length === 0) continue;

    affected += 1;
    console.log(`\n${page.slug}`);
    for (const h of autos) {
      console.log(`  ${h.shown}  <-  href sai: ${h.href}`);
    }

    if (!FIX) continue;
    try {
      await prisma.pageLayout.update({
        where: { id: page.id },
        data: {
          puckData: mapStrings(
            page.puckData,
            fixHtml,
          ) as unknown as Prisma.InputJsonValue,
          publishedPuckData: mapStrings(
            page.publishedPuckData,
            fixHtml,
          ) as unknown as Prisma.InputJsonValue,
        },
      });
      fixed += 1;
      console.log('  -> đã sửa');
    } catch (err) {
      console.error(`  ! lỗi:`, (err as Error).message);
    }
  }

  if (review.length) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('CẦN XEM TAY — script KHÔNG tự sửa những ca này:');
    for (const r of review) {
      console.log(`\n  ${r.slug}`);
      console.log(`    hiện ra : ${r.hit.shown}`);
      console.log(`    href    : ${r.hit.href}`);
      console.log(`    lý do   : ${r.hit.why}`);
    }
  }

  console.log(
    `\n${'='.repeat(60)}\n` +
      `Đã quét ${pages.length} trang.\n` +
      `  Sửa được chắc chắn : ${autoLinks} link / ${affected} trang` +
      (FIX ? ` -> ĐÃ SỬA ${fixed} trang` : ' (thêm --fix để sửa)') +
      `\n  Cần xem tay        : ${reviewLinks} link (script không đụng tới)`,
  );

  if (FIX && fixed > 0) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
