/**
 * apply-en-phrasemap.ts — dựng bản tiếng Anh bằng bảng dịch THEO CỤM.
 *
 * Vì sao không dịch cả khối: nội dung legacy là HTML thật (bảng, ảnh, liên kết,
 * thuộc tính bố cục). Sinh lại cả khối là chắc chắn hỏng cấu trúc — hôm 16/08 chỉ
 * cần đi qua trình soạn thảo một lần là bảng đã vỡ. Ở đây chỉ thay các NÚT VĂN
 * BẢN khớp đúng một khoá trong translations-vi-en.json; mọi thẻ giữ nguyên từng
 * ký tự.
 *
 * Không khớp thì GIỮ NGUYÊN tiếng Việt. Nghĩa là sai sót tệ nhất cũng chỉ là
 * chưa dịch chứ không bao giờ là dịch bừa — họ tên người, tên thương hiệu cố ý
 * không có trong bảng nên luôn được giữ.
 *
 * Chỉ ghi vào ô `en`, tuyệt đối không đụng `vi`. Chạy lại được nhiều lần.
 *
 * Chạy (mặc định chỉ đếm; thêm --apply để ghi):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/apply-en-phrasemap.ts
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/apply-en-phrasemap.ts --apply
 *   ... --only mon-hoc/      (chỉ chạy cho slug bắt đầu bằng chuỗi này)
 *   ... --polish          (dịch tiếp trên ô tiếng Anh đã có, xem chú thích dưới)
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
      keepAlive: true,
      idleTimeoutMillis: 0,
    }),
  ),
});

const APPLY = process.argv.includes('--apply');
/**
 * --polish: dịch tiếp NGAY TRÊN ô tiếng Anh hiện có, thay vì dựng lại từ tiếng
 * Việt.
 *
 * Cần khi mở rộng bảng từ vựng: sau lần chạy đầu, ô `en` đã khác `vi` nên chốt
 * chặn mặc định bỏ qua và từ mới không bao giờ được áp.
 *
 * An toàn theo cấu tạo: chuỗi đã là tiếng Anh thì không khớp khoá tiếng Việt
 * nào, nên không bị đụng tới. Chỉ những nút còn nguyên tiếng Việt mới được thay.
 * Nhờ vậy không cần đoán xem trang nào "dịch dở" — chạy trên toàn bộ vẫn không
 * làm hỏng bản dịch thật.
 */
const POLISH = process.argv.includes('--polish');

const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const raw = JSON.parse(
  readFileSync(join(__dirname, 'translations-vi-en.json'), 'utf8'),
) as Record<string, unknown>;
const MAP = new Map<string, string>();
for (const [k, v] of Object.entries(raw)) {
  if (k.startsWith('_') || typeof v !== 'string') continue;
  MAP.set(k, v);
}

/**
 * Luật "Nhãn: giá trị" — trang môn học đầy những dòng như "Số tiết lý thuyết: 45".
 * Liệt kê từng con số vào bảng thì vừa dài vừa sót; ở đây chỉ cần dịch phần NHÃN
 * rồi giữ nguyên giá trị (hoặc dịch tiếp nếu giá trị cũng có trong bảng).
 */
const LABELS = new Map<string, string>(
  Object.entries((raw._labels ?? {}) as Record<string, string>),
);

/** Giải mã thực thể HTML để so khớp — nội dung legacy đầy &aacute;, &#7885;. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  // Dấu câu kiểu Word: thiếu mấy cái này thì chuỗi có ngoặc kép cong
  // (&ldquo;Quản lý nhiệt&rdquo;) không bao giờ khớp khoá trong bảng, và bản
  // dịch lặng lẽ không được áp — đúng chỗ đã vấp.
  ldquo: '\u201C',
  rdquo: '\u201D',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  laquo: '\u00AB',
  raquo: '\u00BB',
  middot: '\u00B7',
  times: '\u00D7',
  deg: '\u00B0',
};
function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_m, d: string) =>
      String.fromCodePoint(Number.parseInt(d, 10)),
    )
    .replace(/&([a-z]+);/gi, (m, name: string) => {
      const key = name.toLowerCase();
      if (ENTITIES[key]) return ENTITIES[key];
      // Thực thể có dấu kiểu &aacute; / &Ecirc; — dựng lại bằng bảng chuẩn.
      const named = NAMED_ACCENTS[name];
      return named ?? m;
    });
}

/** Bảng thực thể có dấu mà nội dung Joomla cũ hay dùng. */
const NAMED_ACCENTS: Record<string, string> = Object.fromEntries(
  (
    'Aacute:Á,aacute:á,Agrave:À,agrave:à,Acirc:Â,acirc:â,Atilde:Ã,atilde:ã,' +
    'Eacute:É,eacute:é,Egrave:È,egrave:è,Ecirc:Ê,ecirc:ê,' +
    'Iacute:Í,iacute:í,Igrave:Ì,igrave:ì,Itilde:Ĩ,itilde:ĩ,' +
    'Oacute:Ó,oacute:ó,Ograve:Ò,ograve:ò,Ocirc:Ô,ocirc:ô,Otilde:Õ,otilde:õ,' +
    'Uacute:Ú,uacute:ú,Ugrave:Ù,ugrave:ù,Utilde:Ũ,utilde:ũ,' +
    'Yacute:Ý,yacute:ý,Ntilde:Ñ,ntilde:ñ,Ccedil:Ç,ccedil:ç,Dstrok:Đ,dstrok:đ'
  )
    .split(',')
    .map((p) => p.split(':') as [string, string]),
);

/**
 * Chuẩn hoá để so khớp: bỏ thực thể, gộp khoảng trắng, và đưa Unicode về dạng
 * DỰNG SẴN (NFC). Nội dung legacy trộn cả hai dạng — "ổ" có chỗ là một ký tự,
 * có chỗ là "ô" cộng dấu hỏi rời. Không chuẩn hoá thì hai chuỗi nhìn y hệt nhau
 * trên màn hình vẫn không khớp, và bản dịch lặng lẽ không được áp.
 */
const norm = (s: string) =>
  decode(s).normalize('NFC').replace(/\s+/g, ' ').trim();

type Stat = { matched: number; missed: Map<string, number> };

/**
 * Thay từng nút văn bản. Tách chuỗi theo thẻ, giữ nguyên phần thẻ, chỉ đụng phần
 * giữa hai thẻ — và chỉ khi nó khớp nguyên vẹn một khoá trong bảng.
 */
function translateHtml(html: string, stat: Stat): string {
  return html.replace(/(>|^)([^<]+)(?=<|$)/g, (whole, lead: string, text: string) => {
    const key = norm(text);
    if (!key) return whole;
    let hit = MAP.get(key);
    if (hit === undefined) {
      // Thử luật "Nhãn: giá trị".
      const m = /^([^:]{2,60}):\s*(.*)$/.exec(key);
      const lab = m ? LABELS.get(m[1].trim()) : undefined;
      if (m && lab !== undefined) {
        const val = m[2].trim();
        const valEn = val ? (MAP.get(val) ?? val) : '';
        hit = valEn ? `${lab}: ${valEn}` : `${lab}:`;
      }
    }
    if (hit === undefined) {
      // Bỏ qua chuỗi thuần số/ký hiệu khi thống kê để danh sách còn thiếu dễ đọc.
      if (!/^[\d\s.,;:/%()+-]*$/.test(key)) {
        stat.missed.set(key, (stat.missed.get(key) ?? 0) + 1);
      }
      return whole;
    }
    stat.matched += 1;
    // Giữ nguyên khoảng trắng đầu/cuối để bố cục không xê dịch.
    const pre = text.match(/^\s*/)?.[0] ?? '';
    const post = text.match(/\s*$/)?.[0] ?? '';
    return `${lead}${pre}${hit}${post}`;
  });
}

/** Duyệt cây Puck, dịch mọi ô html/sections/title sang ô `en`. */
function translateTree(tree: unknown, stat: Stat): number {
  let changed = 0;
  const doLocalized = (node: Record<string, unknown> | undefined) => {
    if (!node) return;
    const vi = typeof node.vi === 'string' ? node.vi : '';
    if (!vi) return;
    const cur = typeof node.en === 'string' ? node.en : '';
    // CHỐT CHẶN: chỉ đụng vào ô tiếng Anh còn TRỐNG hoặc đang là bản sao y hệt
    // tiếng Việt. Ô đã có bản dịch thật thì tuyệt đối không ghi đè — nếu không,
    // chạy script này là xoá sạch công dịch trước đó.
    const untouched = cur === '' || cur === vi;
    // Ô chưa dịch → dựng từ tiếng Việt. Ô đã dịch dở → chỉ dịch tiếp trên chính
    // nó (giữ nguyên phần đã là tiếng Anh).
    const en = untouched
      ? translateHtml(vi, stat)
      : POLISH
        ? translateHtml(cur, stat)
        : null;
    if (en === null) return;
    if (en !== cur) {
      node.en = en;
      changed += 1;
    }
  };
  const content = (tree as { content?: unknown[] })?.content;
  if (!Array.isArray(content)) return 0;
  for (const item of content) {
    const props = (item as { props?: Record<string, unknown> })?.props;
    if (!props) continue;
    doLocalized(props.html as Record<string, unknown> | undefined);
    doLocalized(props.title as Record<string, unknown> | undefined);
    const sections = props.sections;
    if (Array.isArray(sections)) {
      for (const sec of sections) {
        const s = sec as { html?: Record<string, unknown>; title?: Record<string, unknown> };
        doLocalized(s?.html);
        doLocalized(s?.title);
      }
    }
  }
  return changed;
}

async function main(): Promise<void> {
  const layouts = await prisma.pageLayout.findMany({
    where: {
      deletedAt: null,
      ...(ONLY ? { slug: { startsWith: ONLY } } : {}),
    },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
  });

  const stat: Stat = { matched: 0, missed: new Map() };
  let touched = 0;

  for (const layout of layouts) {
    const draft = layout.puckData as unknown;
    const published = layout.publishedPuckData as unknown;
    const n = translateTree(draft, stat) + translateTree(published, stat);
    if (n === 0) continue;
    touched += 1;
    console.log(`  + ${layout.slug}`);
    if (!APPLY) continue;
    await prisma.pageLayout.update({
      where: { id: layout.id },
      data: {
        puckData: draft as Prisma.InputJsonValue,
        ...(published
          ? { publishedPuckData: published as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  const missed = [...stat.missed.entries()].sort((a, b) => b[1] - a[1]);
  console.log(
    `\nDone${APPLY ? '' : ' (CHƯA GHI — thêm --apply để ghi thật)'}. ` +
      `layout=${touched} cụm dịch được=${stat.matched} cụm chưa có trong bảng=${missed.length}`,
  );
  console.log('\n20 cụm chưa dịch gặp nhiều nhất (thêm vào bảng nếu cần):');
  for (const [t, n] of missed.slice(0, 20)) {
    console.log(`  ×${n}  ${t.slice(0, 90)}`);
  }
  if (APPLY) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
