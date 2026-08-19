/**
 * fill-staff-editorial.ts — nhập liệu tự động cho StaffProfileEditorial: bóc các
 * mục "Các môn giảng dạy", "Các hướng nghiên cứu", "Danh sách xuất bản" ra thành
 * ô riêng, phần còn lại giữ nguyên trong khối "Thông tin chi tiết".
 *
 * VÌ SAO BÓC ĐƯỢC (mà email thì không): ở đây bóc theo TIÊU ĐỀ MỤC có sẵn trong
 * nội dung — thấy "Các hướng nghiên cứu" rồi lấy đúng các <li> ngay dưới nó. Chỉ
 * là di chuyển nội dung sang ô khác, không suy đoán danh tính như vụ mailto.
 *
 * CHỐNG NHẬN NHẦM: <strong> còn được dùng cho TÊN TÁC GIẢ trong danh sách bài báo
 * ("Nguyen, N.V.T."), nên chỉ nhận tiêu đề khớp DANH SÁCH TỪ KHOÁ dưới đây.
 *
 * KHÔNG mất dữ liệu: mục nào bóc ra thì gỡ khỏi HTML, phần chưa nhận dạng được
 * vẫn nằm nguyên trong ô nội dung. Trang không bóc được gì thì bỏ qua, không đụng.
 *
 * Chạy thử (không ghi gì, in ra bóc được gì):
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/fill-staff-editorial.ts --dry
 * Chạy thật:
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/fill-staff-editorial.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const DRY = process.argv.includes('--dry') || process.env.DRY_RUN === '1';
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = { root?: unknown; content?: PuckNode[] };
type Loc = { vi?: string; en?: string };
type Kind = 'teaching' | 'research' | 'publications';

/** Tiêu đề mục — khớp thì mới coi là mốc cắt. Kiểm theo thứ tự này. */
const HEADINGS: { kind: Kind; patterns: RegExp[] }[] = [
  {
    kind: 'publications',
    patterns: [
      /danh s[áa]ch xu[ấa]t b[ảa]n/i,
      /c[ôo]ng tr[ìi]nh/i,
      /b[àa]i b[áa]o/i,
      /publications?/i,
    ],
  },
  {
    kind: 'teaching',
    patterns: [
      /m[ôo]n gi[ảa]ng d[ạa]y/i,
      /h[ọo]c ph[ầa]n ph[ụu] tr[áa]ch/i,
      /gi[ảa]ng d[ạa]y/i,
      /^subjects?/i,
      /teaching|courses?/i,
    ],
  },
  {
    kind: 'research',
    patterns: [
      /h[ưu][ớo]ng nghi[êe]n c[ứu]u/i,
      /l[ĩi]nh v[ựu]c nghi[êe]n c[ứu]u/i,
      /research (fields?|interests?|areas?)/i,
      /^research$/i,
    ],
  },
];

const DEGREE_RE =
  /^(pgs\.?\s*ts|gs\.?\s*ts|ths?|th[ạa]c s[ĩi]|ti[ếe]n s[ĩi]|ts|c[ửu] nh[âa]n|cn|k[ỹy] s[ưu]|ks|ncs|nghi[êe]n c[ứu]u sinh|assoc|prof|dr|m\.?sc|ph\.?d)\b/i;

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—');
}

/** Chữ người đọc nhìn thấy, đã bỏ thẻ. */
function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(title: string): Kind | null {
  for (const h of HEADINGS)
    if (h.patterns.some((p) => p.test(title))) return h.kind;
  return null;
}

type ExtraItem = { section: string; title: string; desc: string };

type Parsed = {
  eyebrow: string;
  items: Record<Kind, string[]>;
  extras: ExtraItem[];
  rest: string;
};

/** Vị trí này có nằm trong một <li> không? Dùng để loại các <strong> là TÊN TÁC
 *  GIẢ nằm trong danh sách bài báo — chúng không phải tiêu đề mục. */
function insideLi(html: string, idx: number): boolean {
  const open = html.lastIndexOf('<li', idx);
  if (open === -1) return false;
  return html.lastIndexOf('</li>', idx) < open;
}

/** Dòng liên hệ — giữ lại trong nội dung chi tiết để không mất link mailto/ORCID. */
const CONTACT_RE = /^(tel|phone|email|e-mail|orcid|scholar|đt|điện thoại)\b/i;

/**
 * Bóc một chuỗi HTML: trả về các mục theo loại + phần HTML còn lại sau khi đã
 * gỡ những đoạn đã bóc.
 */
function parseHtml(html: string): Parsed {
  const items: Record<Kind, string[]> = {
    teaching: [],
    research: [],
    publications: [],
  };
  if (!html) return { eyebrow: '', items, extras: [], rest: html };

  // Mọi <strong> kèm vị trí.
  const strongs: { start: number; end: number; text: string }[] = [];
  const re = /<strong>\s*([\s\S]{2,120}?)\s*<\/strong>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    strongs.push({
      start: m.index,
      end: m.index + m[0].length,
      text: textOf(m[1]),
    });
  }

  // Học vị: <strong> ngắn đầu tiên trông giống học vị.
  const eyebrow =
    strongs.find((s) => s.text.length <= 30 && DEGREE_RE.test(s.text))?.text ??
    '';

  // Chỉ giữ những <strong> khớp từ khoá VÀ không nằm trong <li> — tên tác giả
  // trong danh sách bài báo bị loại.
  const heads = strongs
    .filter((s) => !insideLi(html, s.start))
    .map((s) => ({ ...s, kind: classify(s.text) }))
    .filter((s): s is typeof s & { kind: Kind } => s.kind !== null);

  const cuts: { from: number; to: number }[] = [];
  const extras: ExtraItem[] = [];

  heads.forEach((h, idx) => {
    const nextHead = heads[idx + 1]?.start ?? html.length;
    const zone = html.slice(h.end, nextHead);

    // Quét MỌI danh sách từ đây tới tiêu đề kế tiếp, không chỉ cái đầu: nội dung
    // cũ hay có một danh sách RỖNG chèn ngay dưới tiêu đề
    // (`<ol><li><p></p></li></ol>`) rồi mới tới danh sách thật.
    const lis: string[] = [];
    let lastEnd = -1;
    for (const m of zone.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const got = [...m[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((li) => textOf(li[1]))
        .filter((s) => s.length > 1);
      lis.push(...got);
      lastEnd = h.end + (m.index ?? 0) + m[0].length;
    }
    if (!lis.length || lastEnd < 0) return;

    items[h.kind].push(...lis);

    // Gỡ cả tiêu đề (tính từ đầu thẻ <p> bọc nó) lẫn các danh sách đã lấy.
    const pStart = html.lastIndexOf('<p', h.start);
    cuts.push({
      from: pStart >= 0 && h.start - pStart < 400 ? pStart : h.start,
      to: lastEnd,
    });
  });

  // ── Khối học vị đầu trang → mục "Học vấn" ──
  // Dạng: <p><strong>Thạc sĩ</strong></p><p>Khoa Máy tính,</p><p>Texas Tech…</p>
  // rồi tới <p>Tel:…</p><p>Email:…</p>. Chỉ lấy phần ĐƠN VỊ (dừng trước dòng liên
  // hệ) để các link mailto/ORCID vẫn nằm nguyên trong nội dung chi tiết.
  const inCut = (i: number) => cuts.some((c) => i >= c.from && i < c.to);
  for (const s of strongs) {
    if (insideLi(html, s.start) || inCut(s.start)) continue;
    if (s.text.length > 30 || !DEGREE_RE.test(s.text)) continue;

    const nextStrong = strongs.find((x) => x.start > s.end)?.start ?? html.length;
    const zone = html.slice(s.end, nextStrong);
    const paras = [...zone.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => ({ text: textOf(m[1]), end: s.end + (m.index ?? 0) + m[0].length }))
      .filter((p) => p.text.length > 1);

    const kept: string[] = [];
    let stop = -1;
    for (const p of paras) {
      if (CONTACT_RE.test(p.text)) break;
      kept.push(p.text);
      stop = p.end;
    }
    if (!kept.length) continue;

    extras.push({
      section: 'Học vấn',
      title: s.text,
      desc: kept.join(' ').replace(/\s*,\s*$/, ''),
    });
    const pStart = html.lastIndexOf('<p', s.start);
    cuts.push({
      from: pStart >= 0 && s.start - pStart < 200 ? pStart : s.start,
      to: stop,
    });
  }

  // Cắt từ cuối lên để chỉ số không lệch.
  let rest = html;
  for (const c of [...cuts].sort((a, b) => b.from - a.from)) {
    rest = rest.slice(0, c.from) + rest.slice(c.to);
  }

  return { eyebrow, items, extras, rest };
}

/** Năm xuất bản: lấy số năm CUỐI trong câu (thường nằm cuối trích dẫn). */
function yearOf(s: string): string {
  const all = [...s.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => m[0]);
  return all.length ? all[all.length - 1] : '';
}

const pair = (vi: string, en: string): Loc => ({ vi, en: en || vi });

/** Ghép danh sách vi/en theo chỉ số thành mảng localized. */
function zip(vi: string[], en: string[]): Loc[] {
  const n = Math.max(vi.length, en.length);
  return Array.from({ length: n }, (_, i) => pair(vi[i] ?? '', en[i] ?? ''));
}

async function main(): Promise<void> {
  const pages = await prisma.pageLayout.findMany({
    where: ONLY
      ? { slug: { contains: ONLY } }
      : { slug: { contains: '/nhan-su/' } },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
    orderBy: { slug: 'asc' },
  });
  console.log(`Tìm thấy ${pages.length} trang.`);

  let filled = 0;
  let nothing = 0;
  let failed = 0;

  for (const page of pages) {
    const build = (tree: unknown): PuckTree | null => {
      const content = (tree as PuckTree | null)?.content;
      if (!Array.isArray(content)) return null;
      const idx = content.findIndex(
        (c) => c?.type === 'StaffProfile' || c?.type === 'StaffProfileEditorial',
      );
      if (idx === -1) return null;

      const node = content[idx];
      const p = node.props ?? {};
      const html = (p.html ?? {}) as Loc;
      const vi = parseHtml(html.vi ?? '');
      const en = parseHtml(html.en ?? '');

      // Mục tự đặt tên: ghép theo chỉ số giữa vi/en.
      const nExtra = Math.max(vi.extras.length, en.extras.length);
      const extras = Array.from({ length: nExtra }, (_, i) => {
        const a = vi.extras[i];
        const b = en.extras[i];
        return {
          section: pair(a?.section ?? '', b?.section ?? ''),
          title: pair(a?.title ?? '', b?.title ?? ''),
          desc: pair(a?.desc ?? '', b?.desc ?? ''),
        };
      }).filter((e) => (e.title.vi || e.title.en));

      const research = zip(vi.items.research, en.items.research);
      const teaching = zip(vi.items.teaching, en.items.teaching);
      const pubsVi = vi.items.publications;
      const pubsEn = en.items.publications;
      const publications = zip(pubsVi, pubsEn).map((titleLoc, i) => ({
        year: yearOf(pubsVi[i] ?? pubsEn[i] ?? ''),
        title: titleLoc,
        meta: { vi: '', en: '' },
        url: '',
      }));

      // Không bóc được gì → không đụng vào trang.
      if (
        !research.length &&
        !teaching.length &&
        !publications.length &&
        !extras.length
      )
        return null;

      const next: PuckNode = {
        type: 'StaffProfileEditorial',
        props: {
          ...p,
          photoFilter: p.photoFilter ?? true,
          eyebrow:
            p.eyebrow ??
            (vi.eyebrow || en.eyebrow
              ? pair(vi.eyebrow, en.eyebrow)
              : { vi: '', en: '' }),
          nameLines: p.nameLines ?? [],
          intro: p.intro ?? { vi: '', en: '' },
          researchTitle: p.researchTitle ?? { vi: 'Nghiên cứu', en: 'Research' },
          research: research.map((title) => ({
            title,
            desc: { vi: '', en: '' },
          })),
          teachingTitle: p.teachingTitle ?? {
            vi: 'Giảng dạy',
            en: 'Teaching',
          },
          teaching: teaching.map((title) => ({
            title,
            desc: { vi: '', en: '' },
          })),
          extras,
          projectsTitle: p.projectsTitle ?? {
            vi: 'Dự án ứng dụng',
            en: 'Projects',
          },
          projects: p.projects ?? [],
          pubsTitle: p.pubsTitle ?? {
            vi: 'Xuất bản khoa học',
            en: 'Publications',
          },
          publications,
          pubsMoreUrl: p.pubsMoreUrl ?? '',
          pubsMoreLabel: p.pubsMoreLabel ?? {
            vi: 'Xem toàn bộ danh sách bài báo →',
            en: 'See all publications →',
          },
          contentTitle: p.contentTitle ?? { vi: '', en: '' },
          html: { vi: vi.rest, en: en.rest },
        },
      };

      return {
        ...(tree as PuckTree),
        content: content.map((c, i) => (i === idx ? next : c)),
      };
    };

    const draft = build(page.puckData);
    const published = build(page.publishedPuckData);

    if (!draft && !published) {
      nothing += 1;
      continue;
    }

    if (DRY) {
      const pr = (draft ?? published)!.content!.find(
        (c) => c.type === 'StaffProfileEditorial',
      )!.props as Record<string, unknown>;
      const n = (k: string) => (pr[k] as unknown[] | undefined)?.length ?? 0;
      console.log(
        `  [dry] ${page.slug}\n` +
          `        học vị=${JSON.stringify((pr.eyebrow as Loc)?.vi ?? '')}` +
          ` | nghiên cứu=${n('research')} | giảng dạy=${n('teaching')}` +
          ` | bài báo=${n('publications')} | mục khác=${n('extras')}`,
      );
      filled += 1;
      continue;
    }

    try {
      await prisma.pageLayout.update({
        where: { id: page.id },
        data: {
          ...(draft
            ? { puckData: draft as unknown as Prisma.InputJsonValue }
            : {}),
          ...(published
            ? {
                publishedPuckData:
                  published as unknown as Prisma.InputJsonValue,
              }
            : {}),
        },
      });
      filled += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ! lỗi ${page.slug}:`, (err as Error).message);
    }
  }

  console.log(
    `\nXong${DRY ? ' (CHẠY THỬ — chưa ghi gì)' : ''}. ` +
      `da_nhap_lieu=${filled} khong_boc_duoc=${nothing} loi=${failed}`,
  );
  if (!DRY && filled > 0) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
