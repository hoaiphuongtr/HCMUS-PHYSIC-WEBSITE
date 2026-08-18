/**
 * build-class-staff-pages.ts — migrate the last two legacy content families the
 * first pass missed: "lớp học" (`classes`) and the leftover "nhân sự" (`staffs`).
 *
 * Found by deploy/audit-dead-links.sh, not by hand: after migrating majors and
 * subjects, 103 internal links were still dead, and 35 of them matched
 * `legacy.classes` slugs exactly while 9 matched `legacy.staffs`.
 *
 * Both live under a DEPARTMENT prefix, taken from `legacy.depts` so a staff page
 * lands under the right bộ môn:
 *   classes → <dept-slug>/lop-hoc/<slug>
 *   staffs  → <dept-slug>/nhan-su/<slug>
 *
 * Same frame as the other migrated pages: SiteHeader → PageHero → LegacyPageBody
 * → SiteFooter. Idempotent: re-running refreshes content in place.
 *
 * Requires the legacy MariaDB (docs/legacy-migration-plan.md Option B):
 *   docker start legacy-mariadb
 *
 * Run (DATABASE_URL can point at the sandbox via deploy/tunnel-sandbox-db.py):
 *   pnpm --filter backend exec tsx initialScript/migrate-legacy/build-class-staff-pages.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  decodeEntities,
  rewriteImagePath,
  transformLegacyHtml,
} from './legacy-html';
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

const TEMPLATE_ID = 'cmozy2nkm000088uhrhxj2x1e'; // post-template-default (for createdBy)

/** Hai họ nội dung, mỗi họ một bảng + một bảng lang + một tiền tố đường dẫn. */
const FAMILIES = [
  {
    table: 'classes',
    langTable: 'classeslang',
    fk: 'classid',
    segment: 'lop-hoc',
    // classes có bgimage + excerpt; staffs KHÔNG có cả hai (chỉ image + content),
    // bù lại staffs có `email` để điền vào danh thiếp StaffProfile.
    cols: 'id, slug, deptid, image, bgimage, NULL AS email',
    langCols: 'langid, title, content, excerpt',
  },
  {
    table: 'staffs',
    langTable: 'staffslang',
    fk: 'staffid',
    segment: 'nhan-su',
    cols: 'id, slug, deptid, image, NULL AS bgimage, email',
    langCols: 'langid, title, content, NULL AS excerpt',
  },
] as const;

type Row = {
  id: number;
  slug: string;
  deptid: number | null;
  image: string | null;
  bgimage: string | null;
  email: string | null;
};

type LangRow = {
  fk: number;
  langid: number;
  title: string | null;
  content: string | null;
  excerpt: string | null;
};

/** Chạy thử: in ra sẽ làm gì mà KHÔNG ghi vào DB. `--dry` hoặc DRY_RUN=1. */
const DRY = process.argv.includes('--dry') || process.env.DRY_RUN === '1';

type PuckNode = { type?: string; props?: Record<string, unknown> };

/**
 * Đọc khung trang đã có trong DB. Trang do script này sinh ra luôn đúng 4 khối
 * Header → PageHero → (LegacyPageBody|StaffProfile) → Footer. Trả về khối thân
 * nếu khung còn nguyên; `custom` = true nếu người ta đã thêm/bớt component (đã
 * biên tập tay) → không đụng vào nữa.
 */
function readExistingFrame(puckData: unknown): {
  body: PuckNode | null;
  custom: boolean;
} {
  const content = (puckData as { content?: PuckNode[] } | null)?.content;
  if (!Array.isArray(content)) return { body: null, custom: true };
  const types = content.map((c) => c?.type);
  const shaped =
    content.length === 4 &&
    types[0] === 'Header' &&
    types[1] === 'PageHero' &&
    types[3] === 'Footer' &&
    (types[2] === 'LegacyPageBody' || types[2] === 'StaffProfile');
  return shaped ? { body: content[2], custom: false } : { body: null, custom: true };
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

  const legacy = await mysql.createConnection(LEGACY);

  // deptid → slug bộ môn, để trang nằm đúng dưới bộ môn của nó.
  const [deptRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, slug FROM depts WHERE deleted = 0',
  );
  const deptSlug = new Map<number, string>(
    (deptRows as unknown as { id: number; slug: string }[]).map((d) => [
      d.id,
      d.slug,
    ]),
  );

  const existingBySlug = new Map<
    string,
    { id: string; puckData: unknown }
  >(
    (
      await prisma.pageLayout.findMany({
        select: { id: true, slug: true, puckData: true },
      })
    ).map((l) => [l.slug, { id: l.id, puckData: l.puckData }]),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;
  let skippedNoDept = 0;
  let skippedConverted = 0;
  let skippedCustom = 0;

  for (const fam of FAMILIES) {
    const [rows] = await legacy.query<mysql.RowDataPacket[]>(
      `SELECT ${fam.cols} FROM ${fam.table} WHERE deleted = 0 AND status = 1 ORDER BY id`,
    );
    const [langs] = await legacy.query<mysql.RowDataPacket[]>(
      `SELECT ${fam.fk} AS fk, ${fam.langCols} FROM ${fam.langTable}`,
    );
    const byId = new Map<number, LangRow[]>();
    for (const r of langs as unknown as LangRow[]) {
      const arr = byId.get(r.fk) ?? [];
      arr.push(r);
      byId.set(r.fk, arr);
    }

    for (const row of rows as unknown as Row[]) {
      const dept = row.deptid ? deptSlug.get(row.deptid) : undefined;
      if (!dept) {
        // Không biết thuộc bộ môn nào thì không đoán đường dẫn — bỏ qua, để link
        // chết còn dễ phát hiện hơn là tạo trang ở chỗ sai.
        skippedNoDept += 1;
        continue;
      }
      const slug = `${dept}/${fam.segment}/${row.slug}`;
      const langsOf = byId.get(row.id) ?? [];
      const vi = langsOf.find((l) => l.langid === 1);
      const en = langsOf.find((l) => l.langid === 2);
      const titleVi = decodeEntities((vi?.title ?? en?.title ?? row.slug).trim());
      const titleEn = decodeEntities((en?.title ?? vi?.title ?? row.slug).trim());
      const bodyVi = transformLegacyHtml(vi?.content ?? en?.content);
      const bodyEn = transformLegacyHtml(en?.content) || bodyVi;
      const excerptVi = vi?.excerpt ? decodeEntities(vi.excerpt) : '';
      const excerptEn = en?.excerpt ? decodeEntities(en.excerpt) : excerptVi;
      const isStaff = fam.table === 'staffs';
      const portrait = rewriteImagePath(row.image) ?? '';
      // Nhân sự: ẢNH CHÂN DUNG KHÔNG dùng làm nền banner nữa (trước đây bị phủ tối
      // 85% thành nền mờ sau tên) — để trống cho banner navy sạch; ảnh đưa vào card
      // StaffProfile. Lớp học vẫn dùng bgimage như cũ.
      const heroBg = isStaff ? '' : (rewriteImagePath(row.bgimage) ?? portrait);

      const existing = existingBySlug.get(slug);

      // Trang nhân sự ĐÃ CÓ trong DB: chuyển khung LegacyPageBody → StaffProfile
      // mà KHÔNG ghi đè nội dung. Ghi đè bằng HTML dựng lại từ dump sẽ xoá mọi
      // chỉnh sửa biên tập viên đã làm trong Puck kể từ lần migrate trước.
      let keptHtml: unknown = null;
      if (isStaff && existing) {
        const frame = readExistingFrame(existing.puckData);
        if (frame.custom) {
          // Khung đã bị sửa (thêm/bớt component) → người ta dựng lại trang bằng
          // tay, đụng vào là hỏng. Bỏ qua, báo để người xem lại.
          console.log(`  ~ bỏ qua (đã dựng tay): ${slug}`);
          skippedCustom += 1;
          continue;
        }
        if (frame.body?.type === 'StaffProfile') {
          // Đã chuyển rồi ở lần chạy trước → không đụng, giữ nguyên chỉnh sửa.
          skippedConverted += 1;
          continue;
        }
        keptHtml = frame.body?.props?.html ?? null;
      }

      // Nhân sự → StaffProfile (ảnh trái, nội dung phải). name + email điền sẵn từ
      // dữ liệu cũ; role/phone để trống, biên tập viên bổ sung trong Puck.
      // Lớp học → giữ LegacyPageBody.
      const bodyComponent = isStaff
        ? {
            type: 'StaffProfile',
            props: {
              id: `body-${row.slug}`,
              photo: portrait,
              name: { vi: titleVi, en: titleEn },
              role: { vi: '', en: '' },
              email: (row.email ?? '').trim(),
              phone: '',
              html: keptHtml ?? { vi: bodyVi, en: bodyEn },
            },
          }
        : {
            type: 'LegacyPageBody',
            props: {
              id: `body-${row.slug}`,
              html: { vi: bodyVi, en: bodyEn },
            },
          };

      const tree = {
        root: {},
        content: [
          { type: 'Header', props: { id: `hdr-${row.slug}` } },
          {
            type: 'PageHero',
            props: {
              id: `hero-${row.slug}`,
              title: { vi: titleVi, en: titleEn },
              subtitle: { vi: excerptVi, en: excerptEn },
              bgImage: heroBg,
            },
          },
          bodyComponent,
          { type: 'Footer', props: { id: `ftr-${row.slug}` } },
        ],
      };

      try {
        const now = new Date();
        if (DRY) {
          console.log(`  [dry] ${existing ? 'cập nhật' : 'tạo mới'} ${slug}`);
          if (existing) updated += 1;
          else created += 1;
          continue;
        }
        if (existing) {
          await prisma.pageLayout.update({
            where: { id: existing.id },
            data: {
              name: titleVi || row.slug,
              description: excerptVi || null,
              puckData: tree as unknown as Prisma.InputJsonValue,
              publishedPuckData: tree as unknown as Prisma.InputJsonValue,
              isPublished: true,
              publishedAt: now,
            },
          });
          updated += 1;
        } else {
          const made = await prisma.pageLayout.create({
            data: {
              name: titleVi || row.slug,
              slug,
              description: excerptVi || null,
              puckData: tree as unknown as Prisma.InputJsonValue,
              publishedPuckData: tree as unknown as Prisma.InputJsonValue,
              isPublished: true,
              publishedAt: now,
              createdBy: owner,
            },
          });
          existingBySlug.set(slug, { id: made.id, puckData: tree });
          created += 1;
        }
      } catch (err) {
        failed += 1;
        console.error(`  ! fail ${slug}:`, (err as Error).message);
      }
    }
    console.log(`${fam.table}: xong`);
  }

  await legacy.end();
  console.log(
    `Done${DRY ? ' (CHẠY THỬ — chưa ghi gì)' : ''}. created=${created} updated=${updated} ` +
      `failed=${failed} bo_qua_khong_ro_bo_mon=${skippedNoDept} ` +
      `bo_qua_da_chuyen=${skippedConverted} bo_qua_dung_tay=${skippedCustom}`,
  );
  if (DRY) {
    await prisma.$disconnect();
    return;
  }
  await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
