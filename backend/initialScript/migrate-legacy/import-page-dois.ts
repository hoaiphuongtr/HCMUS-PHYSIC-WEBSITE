/**
 * import-page-dois.ts — nhập công bố từ các DOI đang nằm trong trang nhân sự.
 *
 * Đợt migration đổ nguyên trang cũ vào ô `html` của StaffProfileEditorial. Trong
 * đó có 66 DOI của 21 người — tất cả đều tra được qua Crossref, tức là mỗi DOI
 * đổi được thành một bản ghi đầy đủ: tên bài, tạp chí, năm, danh sách tác giả.
 * Bỏ phí thì giảng viên phải tự gõ lại từng bài.
 *
 * Nối người bằng `ScholarProfile.staffPageSlug` — thứ mà sync-physoom-members.ts
 * vừa điền. Chạy script này SAU khi đã đồng bộ PHYsoom.
 *
 * Bài nhập vào luôn ở trạng thái CHƯA PHÂN LOẠI: hệ thống không đoán Q1–Q4, và
 * bài chưa có mã Phụ lục 2 thì không lọt vào API tích hợp nên không tính KPI.
 *
 * Chạy thử (không ghi gì, có tra Crossref để xem ra bài gì):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/import-page-dois.ts
 * Ghi:
 *   ... import-page-dois.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL }),
  ),
});

const APPLY = process.argv.includes('--apply');
const MAILTO = process.env.CROSSREF_MAILTO || '';

/** Ký tự kết thúc DOI. KHÔNG được để lọt xuống dòng — một DOI sẽ nuốt cả dòng sau. */
const DOI_RE = /10\.[0-9]{4,9}\/[^\s,;)"'<>\]]+/g;

/**
 * Dọn rác dính vào DOI khi nó được lấy ra từ HTML.
 *
 * Ba kiểu đã gặp thật trên trang nhân sự:
 *   …05994-5#auth-hoang_luong-cuong-aff2   neo tới tác giả trên trang nhà xuất bản
 *                                          (11 dòng cùng trỏ về MỘT bài)
 *   …3225452&amp                           thực thể HTML lọt vào
 *   …44630-                                bị cắt giữa chừng ở đầu dòng
 *
 * DOI về mặt đặc tả CÓ THỂ chứa # và &, nhưng thực tế cực hiếm; còn ở đây thì
 * 12/14 trường hợp hỏng là do hai ký tự đó. Cắt là đúng hơn giữ.
 */
function cleanDoi(raw: string): string {
  return raw
    .split('#')[0]
    .split('&')[0]
    .replace(/[.,;:)\]}-]+$/, '')
    .toLowerCase();
}

type PuckNode = { type?: string; props?: Record<string, unknown> };

function walk(node: unknown, visit: (n: PuckNode) => void): void {
  if (Array.isArray(node)) return node.forEach((c) => walk(c, visit));
  if (!node || typeof node !== 'object') return;
  const n = node as PuckNode;
  if (typeof n.type === 'string') visit(n);
  for (const v of Object.values(n)) {
    if (v && typeof v === 'object') walk(v, visit);
  }
}

/** Gom mọi chuỗi trong khối — DOI nằm rải trong ô `html`, không có ô riêng. */
function collectText(puckData: unknown): string {
  const out: string[] = [];
  walk(puckData, (n) => {
    const deep = (v: unknown, d = 0) => {
      if (d > 4) return;
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach((x) => deep(x, d + 1));
      else if (v && typeof v === 'object') {
        Object.values(v as Record<string, unknown>).forEach((x) =>
          deep(x, d + 1),
        );
      }
    };
    deep(n.props ?? {});
  });
  return out.join('\n');
}

type Work = {
  doi: string;
  title: string;
  venue: string | null;
  year: number | null;
  month: number | null;
  authors: Array<{
    family: string | null;
    given: string | null;
    orcid: string | null;
    sequence: string;
  }>;
  type: string;
  issn: string | null;
  url: string;
};

async function crossref(doi: string): Promise<Work | null> {
  const qs = MAILTO ? `?mailto=${encodeURIComponent(MAILTO)}` : '';
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}${qs}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) return null;
    const m = (await res.json())?.message;
    const title = Array.isArray(m?.title) ? m.title[0] : m?.title;
    if (!title) return null;
    const issued = m.issued?.['date-parts']?.[0] ?? [];
    const online = m['published-online']?.['date-parts']?.[0] ?? [];
    return {
      doi,
      title: String(title).replace(/\s+/g, ' ').trim(),
      venue: Array.isArray(m['container-title'])
        ? (m['container-title'][0] ?? null)
        : (m['container-title'] ?? null),
      year: Number(online[0] ?? issued[0]) || null,
      month: Number(online[1] ?? issued[1]) || null,
      authors: (m.author ?? []).map(
        (a: Record<string, unknown>, i: number) => ({
          family: (a.family as string) ?? null,
          given: (a.given as string) ?? null,
          orcid: (a.ORCID as string) ?? null,
          sequence: i === 0 ? 'first' : 'additional',
        }),
      ),
      type: String(m.type ?? 'journal-article'),
      issn: m.ISSN?.[0] ?? null,
      url: m.URL ?? `https://doi.org/${doi}`,
    };
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  // Chỉ lấy người ĐÃ nối trang nhân sự — nối được thì mới biết DOI đó của ai.
  const profiles = await prisma.scholarProfile.findMany({
    where: { staffPageSlug: { not: null } },
    select: {
      userId: true,
      staffPageSlug: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  const byslug = new Map(profiles.map((p) => [p.staffPageSlug as string, p]));
  console.log(`${profiles.length} hồ sơ có nối trang nhân sự.\n`);

  const layouts = await prisma.pageLayout.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      slug: { contains: '/nhan-su/' },
    },
    select: { slug: true, puckData: true },
  });

  // slug → DOI. Cùng một người có thể có nhiều trang; gom lại theo người.
  const perUser = new Map<
    string,
    { name: string; email: string; dois: Set<string> }
  >();
  for (const l of layouts) {
    const owner = byslug.get(l.slug);
    if (!owner) continue;
    const dois = [
      ...new Set(
        (collectText(l.puckData).match(DOI_RE) ?? [])
          .map(cleanDoi)
          // Cắt cụt thì phần đuôi còn lại quá ngắn để là DOI thật.
          .filter((d) => /^10\.[0-9]{4,9}\/.{3,}$/.test(d)),
      ),
    ];
    if (!dois.length) continue;
    const name = [owner.user.lastName, owner.user.firstName]
      .filter(Boolean)
      .join(' ');
    const cur = perUser.get(owner.userId) ?? {
      name,
      email: owner.user.email,
      dois: new Set<string>(),
    };
    dois.forEach((d) => cur.dois.add(d));
    perUser.set(owner.userId, cur);
  }

  const totalDois = [...perUser.values()].reduce((n, u) => n + u.dois.size, 0);
  console.log(`Tìm được ${totalDois} DOI của ${perUser.size} người.\n`);
  if (!perUser.size) {
    console.log('Không có gì để nhập. Đã chạy sync-physoom-members.ts chưa?');
    await prisma.$disconnect();
    return;
  }

  let resolved = 0;
  let failed = 0;
  let existed = 0;
  let created = 0;
  let attached = 0;

  for (const [userId, u] of perUser) {
    console.log(`── ${u.name} (${u.email}) — ${u.dois.size} DOI`);
    for (const doi of u.dois) {
      const already = await prisma.publication.findFirst({
        where: { doi, deletedAt: null },
        select: { id: true },
      });

      if (already) {
        existed += 1;
        if (APPLY) {
          // Bài đã có (đồng nghiệp khai trước) → chỉ gắn thêm người này vào.
          const r = await prisma.publicationAuthor.createMany({
            data: [
              {
                publicationId: already.id,
                userId,
                claimStatus: 'CONFIRMED',
                respondedAt: new Date(),
              },
            ],
            skipDuplicates: true,
          });
          if (r.count) attached += 1;
        }
        console.log(`   đã có: ${doi}`);
        continue;
      }

      const w = await crossref(doi);
      await sleep(250); // lịch sự với Crossref
      if (!w) {
        failed += 1;
        console.log(`   TRA KHÔNG RA: ${doi}`);
        continue;
      }
      resolved += 1;
      console.log(`   ${w.year ?? '????'}  ${w.title.slice(0, 66)}`);

      if (!APPLY) continue;

      const pub = await prisma.publication.create({
        data: {
          doi: w.doi,
          title: w.title,
          containerTitle: w.venue,
          issn: w.issn,
          type: w.type,
          url: w.url,
          publishedYear: w.year,
          publishedMonth: w.month,
          countYear: w.year,
          authorsRaw: w.authors as unknown as Prisma.InputJsonValue,
          source: 'crossref',
          totalAuthors: Math.max(1, w.authors.length),
          // catalogCode để TRỐNG — tác giả tự chọn mã Phụ lục 2, hệ thống không đoán.
          createdBy: userId,
        },
        select: { id: true },
      });
      await prisma.publicationAuthor.create({
        data: {
          publicationId: pub.id,
          userId,
          // Bài lấy từ trang của chính họ nên coi như đã xác nhận; VAI TRÒ tác giả
          // thì không đoán — để họ tự đánh dấu First/Corresponding/Last.
          claimStatus: 'CONFIRMED',
          respondedAt: new Date(),
        },
      });
      created += 1;
    }
  }

  console.log(
    `\nTra được ${resolved} · tra không ra ${failed} · đã có sẵn ${existed}`,
  );
  console.log(
    APPLY
      ? `Đã tạo ${created} công bố, gắn thêm ${attached} người vào bài có sẵn.\n` +
          'Tất cả đều CHƯA PHÂN LOẠI — giảng viên phải tự chọn mã Phụ lục 2 thì\n' +
          'mới được tính vào NV2.'
      : '\n(chạy thử — chưa ghi gì; thêm --apply để nhập thật)',
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
