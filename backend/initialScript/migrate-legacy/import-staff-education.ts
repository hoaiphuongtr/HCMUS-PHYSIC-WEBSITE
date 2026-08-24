/**
 * import-staff-education.ts — đổ QUÁ TRÌNH ĐÀO TẠO từ trang nhân sự cũ vào hồ sơ
 * khoa học, để giảng viên có sẵn cái mà sửa thay vì gõ lại từ đầu.
 *
 * Nội dung cũ nằm trong ô `html` của khối StaffProfile — chữ tự do, mỗi trang
 * một kiểu. Script này CỐ Ý ĐỌC ÍT: chỉ nhận những dòng có dạng rõ ràng
 *
 *     PhD.: Grenoble Alpes University, France, 2014
 *     M.S.: VNUHCM - University of Science, Vietnam, 2008
 *
 * và bỏ qua phần còn lại. Đoán thêm thì được nhiều dòng hơn nhưng sai rải rác,
 * mà sai trong lý lịch khoa học là thứ người ta không soi lại — nó chỉ lộ ra lúc
 * đã nộp đi đâu đó. Phần máy không đọc được vẫn nằm nguyên trên trang nhân sự,
 * và màn hình hồ sơ hiện nó ngay cạnh biểu mẫu để chép tay.
 *
 * KHÔNG đè lên người đã có dữ liệu: hồ sơ nào đã có dòng học vấn nào thì bỏ qua
 * cả hồ sơ. Chạy lại nhiều lần cho cùng kết quả.
 *
 * Chạy thử (không ghi gì):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/import-staff-education.ts
 * Ghi:
 *   ... import-staff-education.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  type EducationLevel,
  PrismaClient,
} from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL }),
  ),
});

const APPLY = process.argv.includes('--apply');

const STAFF_TYPES = ['StaffProfileEditorial', 'StaffProfile'];

type PuckNode = { type?: string; props?: Record<string, unknown> };

/** Ô song ngữ `{vi, en}` hoặc chuỗi trần. */
const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  const l = v as { vi?: string; en?: string } | null | undefined;
  return String(l?.vi ?? l?.en ?? '');
};

function staffNodes(root: unknown): PuckNode[] {
  const out: PuckNode[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const node = n as PuckNode;
    if (node.type && STAFF_TYPES.includes(node.type)) {
      out.push(node);
      return;
    }
    for (const v of Object.values(n)) if (v && typeof v === 'object') walk(v);
  };
  walk(root);
  return out;
}

/**
 * Thực thể HTML → ký tự.
 *
 * Bản đầu chỉ biết `&nbsp; &amp; &lt; &gt; &quot;` nên "Ph&aacute;p" ở lại
 * nguyên xi: chữ hỏng đã đành, mà "Pháp" còn không khớp danh sách quốc gia nên
 * bị nhét luôn vào tên trường. Trang nhân sự cũ mã hoá NGUYÊN dải Latin-1 kiểu
 * này (á â ê ô ó…), chỉ chừa các chữ riêng của tiếng Việt (ư ơ ạ) ở dạng thật.
 *
 * Không liệt kê tay sáu chục tên: dải Latin-1 có quy luật <chữ cái><tên dấu>,
 * nên ghép chữ với dấu tổ hợp rồi chuẩn hoá NFC là ra. Tên lạ thì GIỮ NGUYÊN,
 * vì nuốt mất một cụm còn khó lần ra hơn là để nó lộ ra trên màn hình.
 */
const DAU: Record<string, string> = {
  grave: '\u0300',
  acute: '\u0301',
  circ: '\u0302',
  tilde: '\u0303',
  uml: '\u0308',
  ring: '\u030a',
  cedil: '\u0327',
};

const TEN: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  deg: '°',
  middot: '·',
  szlig: 'ß',
  aelig: 'æ',
  oslash: 'ø',
  AElig: 'Æ',
  Oslash: 'Ø',
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([A-Za-z]+);/g, (all: string, ten: string) => {
      if (TEN[ten]) return TEN[ten];
      const low = TEN[ten.toLowerCase()];
      const m = /^([A-Za-z])(grave|acute|circ|tilde|uml|ring|cedil)$/.exec(ten);
      if (m) return (m[1] + DAU[m[2]]).normalize('NFC');
      return low ?? all;
    });
}

/** HTML → chữ, giữ ranh giới dòng vì mỗi bằng cấp là một dòng. */
function toText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, '\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/**
 * Bậc học. Mỗi mẫu ăn TRỌN cụm bậc VÀ dấu ngăn ngay sau nó, phần còn lại của
 * dòng là nơi đào tạo.
 *
 * Gộp dấu ngăn vào mẫu là có lý do. Cách hiển nhiên hơn — "cắt ở dấu chấm hoặc
 * hai chấm đầu tiên rồi tra cụm vừa cắt" — hỏng ngay ở `B.S.: VNU-HCM…`: dấu
 * chấm đầu tiên nằm GIỮA cụm bậc, cắt ra được chữ "B", không khớp bậc nào, và
 * cả dòng rơi mất. Ở đây mỗi bậc tự nhận phần của mình nên không có chỗ cắt sai.
 *
 * Thứ tự là thứ tự thử, đừng sắp lại theo bảng chữ cái: `post-doc` phải trước
 * `doctor`, nếu không "Postdoctoral" rơi vào PHD.
 *
 * CỐ Ý KHÔNG nhận chữ tắt tiếng Việt trần (TS, ThS, KS, CN). Trang nhân sự dùng
 * chúng để mở đầu TÊN NGƯỜI — "ThS. Cao Minh Khôi" — nên nhận chúng là biến tên
 * đồng nghiệp thành nơi đào tạo. Dạng đầy đủ ("Thạc sĩ") không có kiểu dùng đó.
 */
const LEVELS: Array<[RegExp, EducationLevel]> = [
  [/^post-?doc\w*\s*[.:]+\s*/i, 'POSTDOC'],
  [
    /^(?:ph\.?\s?d|dr\.?\s?rer\.?\s?nat|doctorate|doctoral|doctor|tiến sĩ)\s*[.:]+\s*/i,
    'PHD',
  ],
  [/^(?:m\.?\s?s\.?c?|m\.?\s?eng|master|thạc sĩ)\s*[.:]+\s*/i, 'MASTER'],
  [/^(?:engineer|kỹ sư)\s*[.:]+\s*/i, 'ENGINEER'],
  [/^(?:b\.?\s?s\.?c?|b\.?\s?eng|bachelor|cử nhân)\s*[.:]+\s*/i, 'BACHELOR'],
];

/**
 * Chỉ những nước thật sự gặp trong dữ liệu, thêm vài nước hay đi học.
 *
 * Cố ý KHÔNG đoán "đoạn cuối cùng là tên nước": trang ghi
 * "VNUHCM - University of Science, Faculty of Physics" thì đoán vậy là biến một
 * cái khoa thành một quốc gia.
 */
const COUNTRIES = [
  'Vietnam',
  'Viet Nam',
  'Việt Nam',
  'USA',
  'United States',
  'U.S.A',
  'UK',
  'United Kingdom',
  'England',
  'France',
  'Germany',
  'Japan',
  'Korea',
  'South Korea',
  'China',
  'Taiwan',
  'Canada',
  'Australia',
  'Russia',
  'Italy',
  'Spain',
  'Belgium',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Poland',
  'Czech Republic',
  'Hungary',
  'India',
  'Singapore',
  'Thailand',
  'Malaysia',
  'Austria',
  'Denmark',
  'Norway',
  'Finland',
  'Ireland',
  'Israel',
  'Ukraine',
  'Pháp',
  'Đức',
  'Nhật',
  'Nhật Bản',
  'Hàn Quốc',
  'Mỹ',
  'Anh',
  'Bỉ',
  'Nga',
];
const isCountry = (s: string) =>
  COUNTRIES.some((c) => c.toLowerCase() === s.trim().toLowerCase());

type Row = {
  level: EducationLevel;
  institution: string;
  country: string | null;
  year: number | null;
};

/** Một dòng "PhD.: Trường, Nước, Năm" → bản ghi. Không khớp thì null. */
export function parseLine(raw: string): Row | null {
  const line = raw.trim().replace(/[.;]+$/, '');
  const hit = LEVELS.find(([re]) => re.test(line));
  if (!hit) return null;
  const con = line.replace(hit[0], '').trim();
  if (!con) return null;

  const parts = con
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  let year: number | null = null;
  const ym = /^\(?((?:19|20)\d{2})\)?$/.exec(parts[parts.length - 1]);
  if (ym) {
    year = Number(ym[1]);
    parts.pop();
  }

  let country: string | null = null;
  if (parts.length > 1 && isCountry(parts[parts.length - 1])) {
    country = (parts.pop() ?? '').trim();
  }

  const institution = parts.join(', ').trim();
  // "PhD: 2014" — có bậc, có năm, không có nơi đào tạo. Một dòng học vấn không
  // nói học ở đâu thì không dùng được cho lý lịch, mà cũng không sửa được thành
  // đúng vì thông tin không tồn tại ở đâu cả. Bỏ.
  if (institution.length < 3) return null;
  return { level: hit[1], institution, country, year };
}

/**
 * Rút các dòng học vấn trong một trang.
 *
 * Ưu tiên khối nằm dưới tiêu đề "Education" / "Quá trình đào tạo" — ở đó dòng
 * không cần có năm vẫn chắc là học vấn. Không có tiêu đề thì mới quét cả trang,
 * và khi đó BẮT BUỘC có năm, để khỏi vơ nhầm một dòng trong danh mục công bố.
 */
export function extract(text: string): Row[] {
  const lines = text.split('\n').map((l) => l.trim());
  const head =
    /^(education|quá trình đào tạo|học vấn|đào tạo|trình độ)\s*[:.]?$/i;
  const stop =
    /^(phone|tel|email|position|academic|full ?name|faculty|research|hướng|các |chức|đơn vị|bộ môn|\d+\s*[.)])/i;

  const at = lines.findIndex((l) => head.test(l));
  const out: Row[] = [];
  if (at >= 0) {
    for (const l of lines.slice(at + 1, at + 10)) {
      if (!l) continue;
      if (stop.test(l)) break;
      const r = parseLine(l);
      if (r) out.push(r);
      else if (out.length) break;
    }
  }
  if (!out.length) {
    for (const l of lines) {
      if (!/\b(19|20)\d{2}\b/.test(l)) continue;
      const r = parseLine(l);
      if (r && r.year) out.push(r);
    }
  }
  // Cùng bậc + cùng trường xuất hiện hai lần (song ngữ trên cùng trang) là một.
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.level}|${r.institution.toLowerCase()}|${r.year ?? ''}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  const profiles = await prisma.scholarProfile.findMany({
    where: { staffPageSlug: { not: null } },
    select: {
      id: true,
      staffPageSlug: true,
      user: { select: { email: true, firstName: true, lastName: true } },
      _count: { select: { education: true } },
    },
  });

  let daCo = 0;
  let khongTrang = 0;
  let nhieuKhoi = 0;
  let khongDoc = 0;
  let ghi = 0;
  let dong = 0;

  for (const p of profiles) {
    const ten =
      [p.user.lastName, p.user.firstName].filter(Boolean).join(' ') ||
      p.user.email;

    if (p._count.education > 0) {
      daCo++;
      continue;
    }

    const layout = await prisma.pageLayout.findFirst({
      where: { slug: p.staffPageSlug ?? '', deletedAt: null },
      orderBy: [{ isPublished: 'desc' }, { updatedAt: 'desc' }],
      select: { publishedPuckData: true, puckData: true },
    });
    if (!layout) {
      khongTrang++;
      continue;
    }

    const nodes = staffNodes(layout.publishedPuckData ?? layout.puckData);
    // Trang danh sách cả bộ môn — đọc khối đầu tiên là gán học vấn của người
    // khác cho người này. Cùng lý do với chốt chặn trong staff-page.service.ts.
    if (nodes.length !== 1) {
      nhieuKhoi++;
      console.log(`  ! ${ten}: trang có ${nodes.length} khối hồ sơ — bỏ qua`);
      continue;
    }

    const rows = extract(toText(asText(nodes[0].props?.html)));
    if (!rows.length) {
      khongDoc++;
      continue;
    }

    ghi++;
    dong += rows.length;
    console.log(`  ${ten}`);
    for (const r of rows) {
      const noi = `${r.institution}${r.country ? `, ${r.country}` : ''}`;
      console.log(
        `      ${r.level.padEnd(8)} ${noi}${r.year ? `, ${r.year}` : ''}`,
      );
    }

    if (APPLY) {
      await prisma.scholarEducation.createMany({
        data: rows.map((r) => ({
          profileId: p.id,
          level: r.level,
          institution: r.institution,
          country: r.country,
          year: r.year,
          source: 'STAFF_PAGE' as const,
        })),
      });
    }
  }

  console.log('');
  console.log(`Hồ sơ có trang nhân sự      : ${profiles.length}`);
  console.log(`  đã có học vấn, bỏ qua     : ${daCo}`);
  console.log(`  không tìm thấy trang      : ${khongTrang}`);
  console.log(`  trang nhiều/không có khối : ${nhieuKhoi}`);
  console.log(`  trang không đọc được gì   : ${khongDoc}`);
  console.log(`  ĐỔ ĐƯỢC                   : ${ghi} người, ${dong} dòng`);
  console.log('');
  console.log(
    APPLY
      ? 'Đã ghi. Dòng đổ về mang nguồn STAFF_PAGE — màn hồ sơ nhắc chính chủ soát lại.'
      : 'Chưa ghi gì. Thêm --apply để ghi thật.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
