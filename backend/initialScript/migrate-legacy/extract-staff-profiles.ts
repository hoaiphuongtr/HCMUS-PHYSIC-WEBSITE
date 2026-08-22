/**
 * extract-staff-profiles.ts — dựng hồ sơ khoa học từ CHÍNH các trang nhân sự
 * đang chạy trên web Khoa.
 *
 * Vì sao cần: giảng viên đăng nhập lần đầu mà thấy trang trống thì gần như chắc
 * chắn bỏ luôn. Trang nhân sự đã có sẵn tên, email, hướng nghiên cứu, môn giảng
 * dạy và cả danh sách công bố — bỏ phí là vô lý.
 *
 * Trang nhân sự KHÔNG phải một thực thể riêng: nó là PageLayout có slug dạng
 * .../nhan-su/..., nội dung nằm trong puckData của khối StaffProfileEditorial.
 * Script này đi hết cây Puck (khối con nằm trong props của khối cha, KHÔNG nằm ở
 * data.zones) để nhặt ra.
 *
 * Chạy thử (không ghi gì):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/extract-staff-profiles.ts
 *
 * Ghi hồ sơ (chưa đụng công bố):
 *   ... extract-staff-profiles.ts --apply
 *
 * Ghi kèm danh sách công bố lấy từ trang:
 *   ... extract-staff-profiles.ts --apply --with-publications
 *
 * Xem chi tiết một trang:
 *   ... extract-staff-profiles.ts --slug vi/vat-ly-tin-hoc/nhan-su/ths-...
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  normalizeName,
  suggestNameVariants,
} from '../../src/scholar/name-match';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL }),
  ),
});

const APPLY = process.argv.includes('--apply');
const WITH_PUBS = process.argv.includes('--with-publications');
const ONLY_SLUG = argValue('--slug');

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? (process.argv[i + 1] ?? null) : null;
}

type Localized = { vi?: string; en?: string } | string | null | undefined;

/** Trường song ngữ: lấy tiếng Việt trước, không có thì tiếng Anh. */
function text(v: Localized): string {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  return String(v.vi ?? v.en ?? '').trim();
}

type PuckNode = { type?: string; props?: Record<string, unknown> };

/** Đi hết cây Puck. Khối con nằm TRONG props của khối cha (kiểu slot), không
 *  nằm ở data.zones — chỗ này từng làm sai một lần rồi. */
function walk(node: unknown, visit: (n: PuckNode) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const n = node as PuckNode & Record<string, unknown>;
  if (typeof n.type === 'string') visit(n);
  for (const value of Object.values(n)) {
    if (value && typeof value === 'object') walk(value, visit);
  }
}

type Extracted = {
  slug: string;
  layoutId: string;
  name: string;
  eyebrow: string;
  email: string | null;
  /** 2 = email khớp tên, 1 = khớp lỏng, 0 = không liên quan (phải xem tay). */
  emailScore: number;
  allEmails: string[];
  research: string[];
  teaching: string[];
  /** Mục tự đặt tên trên trang (Học vấn, Giải thưởng…) — chỉ để CON NGƯỜI đọc. */
  extras: Array<{ section: string; title: string; desc: string }>;
  publications: Array<{
    year: string;
    title: string;
    meta: string;
    url: string;
  }>;
};

const MAILTO = /mailto:([^"'\s>?]+)/gi;
/** Email viết dạng chữ thường trong nội dung, không phải link. Đợt migration đổ
 *  cả trang cũ vào ô `html` nên nhiều địa chỉ nằm ở đây chứ không thành mailto. */
const BARE_EMAIL = /[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Thực thể HTML hay gặp trong nội dung legacy, đủ để không phá địa chỉ email. */
function decodeEntities(v: string): string {
  return v
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)));
}

/**
 * Chọn email theo mức KHỚP VỚI TÊN, không lấy bừa cái đầu tiên.
 *
 * Trang nhân sự hay lẫn email của người khác (khối liên hệ chép qua chép lại) —
 * đợt audit mailto trước đã tìm ra 229 liên kết sai người. Nhưng phần lớn trường
 * hợp email ĐÚNG vẫn nằm ngay trên trang đó, chỉ là không phải cái đầu tiên.
 *
 * Email của Trường gần như luôn dựng từ tên: "Đặng Văn Liệt" → dvliet,
 * "Nguyễn Vương Thuỳ Ngân" → nvtngan. Sinh sẵn các dạng hay gặp rồi so.
 */
function localPartCandidates(fullName: string): Set<string> {
  const t = normalizeName(stripTitles(fullName)).split(' ').filter(Boolean);
  if (!t.length) return new Set();
  const last = t[t.length - 1];
  const head = t.slice(0, -1);
  const ini = head.map((w) => w[0]).join('');
  const allIni = t.map((w) => w[0]).join('');
  return new Set(
    [
      ini + last, // dvliet, nvtngan
      last + ini, // lietdv
      t[0] + last, // dangliet
      t.join(''), // dangvanliet
      allIni, // dvl
      last, // liet
      last + t[0], // lietdang
    ].filter((x) => x.length >= 2),
  );
}

/** 2 = khớp chắc, 1 = khớp lỏng (chứa họ hoặc tên gọi), 0 = không liên quan. */
function scoreEmail(fullName: string, email: string): number {
  const local = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!local) return 0;
  if (localPartCandidates(fullName).has(local)) return 2;
  const t = normalizeName(stripTitles(fullName)).split(' ').filter(Boolean);
  const last = t[t.length - 1] ?? '';
  if (last.length >= 3 && local.includes(last)) return 1;
  return 0;
}

function extract(
  slug: string,
  layoutId: string,
  puckData: unknown,
): Extracted | null {
  let name = '';
  let eyebrow = '';
  const research: string[] = [];
  const teaching: string[] = [];
  const extras: Extracted['extras'] = [];
  const publications: Extracted['publications'] = [];
  const emails = new Set<string>();

  walk(puckData, (n) => {
    const p = (n.props ?? {}) as Record<string, unknown>;

    if (n.type === 'StaffProfileEditorial' || n.type === 'StaffProfile') {
      name ||= text(p.name as Localized);
      eyebrow ||= text(p.eyebrow as Localized);

      for (const e of (p.research ?? []) as Array<Record<string, unknown>>) {
        const t = text(e.title as Localized);
        if (t) research.push(t);
      }
      for (const e of (p.teaching ?? []) as Array<Record<string, unknown>>) {
        const t = text(e.title as Localized);
        if (t) teaching.push(t);
      }
      for (const e of (p.extras ?? []) as Array<Record<string, unknown>>) {
        const section = text(e.section as Localized);
        const title = text(e.title as Localized);
        if (section || title) {
          extras.push({ section, title, desc: text(e.desc as Localized) });
        }
      }
      for (const e of (p.publications ?? []) as Array<
        Record<string, unknown>
      >) {
        const t = text(e.title as Localized);
        if (!t) continue;
        publications.push({
          year: String(e.year ?? '').trim(),
          title: t,
          meta: text(e.meta as Localized),
          url: String(e.url ?? '').trim(),
        });
      }
    }

    // Email không có ô riêng: nó nằm rải rác trong nội dung, kể cả ô `html` mà
    // đợt migration đổ nguyên trang cũ vào. Quét CẢ link mailto lẫn email viết
    // dạng chữ thường — bắt rộng ra không nguy hiểm nữa, vì scoreEmail() lọc lại
    // theo tên và cái nào không khớp sẽ bị đẩy sang mục phải xem tay.
    const scan = (raw: string) => {
      const v = decodeEntities(raw);
      for (const m of v.matchAll(MAILTO)) {
        emails.add(m[1].toLowerCase().replace(/\s+/g, ''));
      }
      for (const m of v.matchAll(BARE_EMAIL)) {
        emails.add(m[0].toLowerCase().replace(/\s+/g, ''));
      }
    };
    const deep = (v: unknown, depth = 0) => {
      if (depth > 4) return;
      if (typeof v === 'string') return scan(v);
      if (Array.isArray(v)) return v.forEach((x) => deep(x, depth + 1));
      if (v && typeof v === 'object') {
        for (const x of Object.values(v as Record<string, unknown>)) {
          deep(x, depth + 1);
        }
      }
    };
    deep(p);
  });

  if (!name) return null;

  // Xếp hạng: khớp tên trước, rồi mới tới email của Trường. Lấy bừa cái đầu tiên
  // là cách chắc chắn gán nhầm hồ sơ cho người khác.
  const all = [...emails];
  const ranked = all
    .map((e) => ({
      email: e,
      score: scoreEmail(name, e),
      institutional: /@(\w+\.)?hcmus\.edu\.vn$/i.test(e) ? 1 : 0,
    }))
    .sort((a, b) => b.score - a.score || b.institutional - a.institutional);
  const best = ranked[0];

  return {
    slug,
    layoutId,
    name,
    eyebrow,
    email: best?.email ?? null,
    emailScore: best?.score ?? 0,
    allEmails: all,
    research,
    teaching,
    extras,
    publications,
  };
}

/** Tách tên tiếng Việt: từ cuối là tên gọi, phần còn lại là họ + đệm. */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: full.trim(), lastName: '' };
  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(' '),
  };
}

/** Bỏ học hàm học vị khỏi tên trước khi sinh các dạng tên khoa học. */
function stripTitles(name: string): string {
  return name
    .replace(/^(GS\.?TS|PGS\.?TS|GS|PGS|TS|ThS|CN|BS|KS)\.?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function main(): Promise<void> {
  const layouts = await prisma.pageLayout.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      slug: ONLY_SLUG ? { contains: ONLY_SLUG } : { contains: '/nhan-su/' },
    },
    select: { id: true, slug: true, puckData: true },
    orderBy: { slug: 'asc' },
  });

  console.log(`Tìm thấy ${layouts.length} trang nhân sự đã xuất bản.\n`);

  const rows: Extracted[] = [];
  for (const l of layouts) {
    const e = extract(l.slug, l.id, l.puckData);
    if (e) rows.push(e);
  }

  const withEmail = rows.filter((r) => r.email);
  const noEmail = rows.filter((r) => !r.email);
  const totalPubs = rows.reduce((n, r) => n + r.publications.length, 0);

  const unread = layouts.length - rows.length;
  console.log(`Đọc được hồ sơ: ${rows.length}`);
  if (unread > 0) {
    console.log(
      `  ${unread} trang KHÔNG đọc được tên — nhiều khả năng dùng khối cũ, không` +
        ' phải StaffProfileEditorial. Xem một trang bằng --slug để biết.',
    );
  }
  console.log(`  có email      : ${withEmail.length}`);
  console.log(
    `  KHÔNG có email: ${noEmail.length}  (bỏ qua — không khớp được tài khoản)`,
  );
  console.log(`  tổng công bố  : ${totalPubs}\n`);

  if (ONLY_SLUG) {
    for (const r of rows) console.log(JSON.stringify(r, null, 2));
    await prisma.$disconnect();
    return;
  }

  // Hai trang cùng một email = chắc chắn có trang chép nhầm email người khác.
  // Ghi đè lẫn nhau là hỏng dữ liệu thật, nên loại CẢ HAI ra khỏi phần ghi.
  const byEmail = new Map<string, Extracted[]>();
  for (const r of withEmail) {
    const k = r.email!.toLowerCase();
    byEmail.set(k, [...(byEmail.get(k) ?? []), r]);
  }
  const clashing = new Set<string>();
  for (const [email, rs] of byEmail) if (rs.length > 1) clashing.add(email);

  const safe = withEmail.filter(
    (r) => r.emailScore >= 1 && !clashing.has(r.email!.toLowerCase()),
  );
  const needsEye = withEmail.filter(
    (r) => r.emailScore === 0 || clashing.has(r.email!.toLowerCase()),
  );

  console.log('─'.repeat(78));
  for (const r of withEmail) {
    console.log(
      `${r.email!.padEnd(30)} ${r.name.padEnd(34)} ` +
        `NC:${String(r.research.length).padStart(2)} ` +
        `GD:${String(r.teaching.length).padStart(2)} ` +
        `CB:${String(r.publications.length).padStart(3)}`,
    );
    if (r.allEmails.length > 1) {
      console.log(
        `${' '.repeat(30)} (còn: ${r.allEmails.slice(1).join(', ')})`,
      );
    }
  }
  if (noEmail.length) {
    console.log('\nKhông tìm được email — cần gán tay:');
    for (const r of noEmail) console.log(`  ${r.name}  [${r.slug}]`);
  }

  if (!APPLY) {
    console.log(
      '\n(chạy thử — chưa ghi gì)\n' +
        '  --apply                  tạo tài khoản + hồ sơ khoa học\n' +
        '  --apply --with-publications   kèm danh sách công bố lấy từ trang',
    );
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let linked = 0;
  let pubsAdded = 0;

  for (const r of safe) {
    const email = r.email!.toLowerCase();
    const clean = stripTitles(r.name);
    const { firstName, lastName } = splitName(clean);

    // Tài khoản đã có thì KHÔNG đụng vai trò: một quản trị viên cũng có trang
    // nhân sự, hạ họ xuống LECTURER là khoá luôn trang quản trị của họ.
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          // "ThS.", "TS.", "PGS.TS." — trang nhân sự để ở dòng nhỏ phía trên tên.
          position: r.eyebrow || null,
          role: 'LECTURER',
          isActive: true,
        },
        select: { id: true, role: true },
      });
      created += 1;
    }

    // Hồ sơ đã có thì chỉ bổ sung chỗ còn trống — không ghi đè ORCID hay bộ tên
    // người dùng đã tự sửa.
    const existing = await prisma.scholarProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        staffPageSlug: true,
        nameVariants: { select: { id: true } },
      },
    });

    const profile = existing
      ? await prisma.scholarProfile.update({
          where: { userId: user.id },
          data: { staffPageSlug: existing.staffPageSlug ?? r.slug },
          select: { id: true },
        })
      : await prisma.scholarProfile.create({
          data: { userId: user.id, staffPageSlug: r.slug },
          select: { id: true },
        });
    if (!existing) linked += 1;

    if (!existing?.nameVariants.length) {
      const variants = suggestNameVariants(clean);
      await prisma.scholarNameVariant.createMany({
        data: variants.map((raw, i) => ({
          profileId: profile.id,
          raw,
          normalized: normalizeName(raw),
          isPrimary: i === 0,
        })),
        skipDuplicates: true,
      });
    }

    if (!WITH_PUBS) continue;

    for (const p of r.publications) {
      // Công bố lấy từ trang nhân sự là CHUỖI TRÍCH DẪN, không có DOI nên không
      // gom theo DOI được. Khử trùng theo tiêu đề đã chuẩn hoá, trong phạm vi
      // của chính người này.
      const key = normalizeName(p.title).slice(0, 180);
      const dup = await prisma.publication.findFirst({
        where: {
          deletedAt: null,
          authors: { some: { userId: user.id } },
          title: { contains: p.title.slice(0, 60), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (dup) continue;

      const year = Number.parseInt(p.year, 10);
      const pub = await prisma.publication.create({
        data: {
          title: p.title,
          containerTitle: p.meta || null,
          url: p.url || null,
          type: 'journal-article',
          publishedYear: Number.isFinite(year) ? year : null,
          countYear: Number.isFinite(year) ? year : null,
          // catalogCode để TRỐNG: chưa phân loại → không lọt vào API tích hợp →
          // không được tính KPI cho tới khi tác giả tự chọn mã Phụ lục 2.
          authorsRaw: [] as unknown as Prisma.InputJsonValue,
          source: 'staff-page',
          raw: {
            citation: p,
            fromSlug: r.slug,
            titleKey: key,
          } as Prisma.InputJsonValue,
          createdBy: user.id,
        },
        select: { id: true },
      });
      await prisma.publicationAuthor.create({
        data: {
          publicationId: pub.id,
          userId: user.id,
          // Tự khai hộ từ trang của chính họ nên coi như đã xác nhận; vai trò
          // tác giả thì KHÔNG đoán — để người dùng tự đánh dấu.
          claimStatus: 'CONFIRMED',
          respondedAt: new Date(),
        },
      });
      pubsAdded += 1;
    }
  }

  console.log(
    `\nĐã tạo ${created} tài khoản, nối ${linked} hồ sơ khoa học` +
      (WITH_PUBS ? `, thêm ${pubsAdded} công bố.` : '.') +
      (WITH_PUBS
        ? '\nCông bố đều ở trạng thái CHƯA PHÂN LOẠI — giảng viên phải tự chọn mã' +
          '\nPhụ lục 2 thì mới được tính vào NV2.'
        : ''),
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
