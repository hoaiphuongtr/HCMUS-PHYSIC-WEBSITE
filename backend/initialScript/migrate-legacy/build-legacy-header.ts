/**
 * build-legacy-header.ts — replace the homepage Navbar's menuItems with the
 * legacy site's real header dropdowns (deptid=1, locationid=1, status=1).
 *
 * The homepage (`trang-chu`) Navbar is the single source of truth: SiteHeader
 * syndicates it onto every other layout at runtime, so this one write updates
 * the whole public site.
 *
 * Idempotent — re-running just rewrites menuItems to the same value.
 *   pnpm --filter backend exec tsx --env-file=.env \
 *     initialScript/migrate-legacy/build-legacy-header.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { decodeEntities } from './legacy-html';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const HOME_SLUG = 'trang-chu';

type Localized = { vi: string; en: string };
type Child = { label: Localized; url: string; subChildren: never[] };
type Item = { label: Localized; url: string; children: Child[] };

const L = (vi: string, en: string): Localized => ({
  vi: decodeEntities(vi),
  en: decodeEntities(en),
});
const child = (vi: string, en: string, url: string): Child => ({
  label: L(vi, en),
  url,
  subChildren: [],
});

/**
 * Resolved legacy header tree. Links point to:
 *  - new section-page slugs (built by build-legacy-pages.ts, = legacy page slug)
 *  - already-existing slugs (viec-lam-nganh-vat-ly)
 *  - migrated posts (/tin-tuc/<slug>, resolved from Post.legacyId)
 *  - external / legacy URLs (kept verbatim)
 */
const POST_1389_URL = '/tin-tuc/hoi-nghi-cuu-sinh-vien-vat-ly-20241719822335';
const CAT_46_URL = 'https://phys.hcmus.edu.vn/cau-lac-bo'; // tag legacyId=46 merged away; legacy fallback

export const MENU_ITEMS: Item[] = [
  {
    label: L('Trang chủ', 'Home'),
    url: '/',
    children: [
      child('Giới thiệu Khoa', 'About Us', '/gioi-thieu'),
      child('Tầm nhìn - Sứ mạng', 'Vision and Mission', '/tam-nhin---su-mang'),
      child('Tổ chức - Nhân sự', 'Staffs', '/to-chuc-nhan-su'),
      child('Hội đồng Khoa', 'Faculty Council', '/hoi-dong-khoa'),
    ],
  },
  {
    label: L('Đội ngũ', 'People'),
    url: '/doi-ngu',
    children: [
      child('Giảng viên cơ hữu', 'Faculty members', '/giang-vien-co-huu1678184500'),
      child('Giảng viên thỉnh giảng', 'Visiting lecturers', '/giang-vien-thinh-giang'),
    ],
  },
  {
    label: L('Đào tạo', 'Academics'),
    url: '#',
    children: [
      child('Hồ sơ năng lực', 'The Competence Profile', '/nang-luc-dao-tao'),
      child('Quy chế học tập', 'Academic regulations', '/quy-che-hoc-tap'),
      child('Biểu mẫu sinh viên', 'Student forms', '/bieu-mau'),
      child('Đào tạo Sau đại học', 'Graduate Program', '/dao-tao-sau-dai-hoc'),
      child('Đào tạo Đại học', 'Undergraduate Program', '/dao-tao-dai-hoc'),
      child('Chuẩn đầu ra', 'Learning Outcome', '/chuan-dau-ra'),
      child('Mục tiêu đào tạo', 'Objectives', '/muc-tieu-dao-tao'),
    ],
  },
  {
    label: L('Hội nghị', 'Conference'),
    url: '#',
    children: [
      child('ICEBA2023', 'ICEBA2023', 'https://phys.hcmus.edu.vn/ICEBA2023'),
      child('ICEBA2024', 'ICEBA2024', 'https://phys.hcmus.edu.vn/ICEBA2024'),
      child('ICEBA2025', 'ICEBA2025', 'https://iceba.eiu.edu.vn/'),
      child(
        'Hội nghị sinh viên cử nhân tài năng Vật lý học',
        "Conference for Talented Bachelor's Students",
        '/hoi-nghi-khoa-hoc-sinh-vien-cu-nhan-tai-nang-nganh-vat-ly-hoc-2025',
      ),
      child('ICEBA2026', 'ICEBA2026', 'https://iceba2026.vercel.app/'),
    ],
  },
  {
    label: L('Nghiên cứu', 'Research'),
    url: '#',
    children: [
      child('Công bố Khoa học', 'Publications', '/cong-bo-khoa-hoc'),
      child('Đề tài nghiên cứu', 'Projects', '/de-tai-nghien-cuu'),
      child('Hướng nghiên cứu', 'Scientific Research', '/nghien-cuu-khoa-hoc'),
      child('Phòng thí nghiệm', 'Laboratory', '/phong-thi-nghiem'),
      child('Hợp tác nghiên cứu', 'Collaboration', '/hop-tac-dao-tao'),
      child('Sản phẩm nghiên cứu', 'Laboratory Products', '/san-pham-nghien-cuu'),
    ],
  },
  {
    label: L('Hoạt động', 'Activities'),
    url: '#',
    children: [
      child('Hoạt động Công đoàn Khoa', 'Faculty Union', '/hoat-dong-cong-doan-khoa'),
      child('Đoàn Thanh Niên', 'Youth Union', '/doan-thanh-nien'),
      child('Hội sinh viên', "Students' Association", '/hoi-sinh-vien'),
      child('Câu lạc bộ', 'Club', CAT_46_URL),
      child('Học bổng', 'Scholarship', '/hoc-bong1720684408'),
    ],
  },
  {
    label: L('Tuyển sinh', 'Admissions'),
    url: '#',
    children: [
      child('Đại học', 'Undergraduate', 'https://phys.hcmus.edu.vn/tuyen-sinh-dai-hoc.html'),
      child('Sau đại học', 'Graduate', '/dao-tao-sau-dai-hoc'),
      child('Việc làm ngành Vật lý', 'Career opportunities', '/viec-lam-nganh-vat-ly'),
    ],
  },
  {
    label: L('Cựu sinh viên', 'Alumni'),
    url: '#',
    children: [
      child(
        'Việc làm Cựu sinh viên',
        "Alumni's Job List",
        'https://phys.hcmus.edu.vn/thong-ke-viec-lam-cuu-sinh-vien.html',
      ),
      child('Hoạt động Cựu sinh viên', 'Alumni Activities', POST_1389_URL),
      child('Quỹ học bổng Cựu sinh viên', 'Alumni Scholarship Fund', '/quy-hoc-bong-cuu-sinh-vien'),
      child('Ban đại diện Cựu Sinh Viên', 'Alumni', '/ban-dai-dien-cuu-sinh-vien'),
    ],
  },
  {
    label: L('ASIIN 2024 - 2025', 'ASIIN 2024'),
    url: '/asiin-2024-2025',
    children: [],
  },
];

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = { root?: unknown; content?: PuckNode[]; zones?: Record<string, unknown> };

/** Mutate the first Navbar node found anywhere in the tree. Returns true if found. */
function setNavbarMenu(tree: PuckTree | null): boolean {
  if (!tree?.content) return false;
  let done = false;
  const walk = (nodes: unknown): void => {
    if (!Array.isArray(nodes) || done) return;
    for (const node of nodes) {
      if (done) return;
      if (node && typeof node === 'object') {
        const n = node as PuckNode;
        if (n.type === 'Navbar') {
          n.props = { ...(n.props ?? {}), menuItems: MENU_ITEMS };
          done = true;
          return;
        }
        for (const v of Object.values((n.props ?? {}) as Record<string, unknown>)) {
          walk(v);
        }
      }
    }
  };
  walk(tree.content);
  return done;
}

async function main(): Promise<void> {
  // slug is not unique — there can be both a published and a draft `trang-chu`.
  // The public site / SiteHeader serve the published one, so update them all.
  const homes = await prisma.pageLayout.findMany({
    where: { slug: HOME_SLUG },
    select: { id: true, isPublished: true, puckData: true, publishedPuckData: true },
  });
  if (homes.length === 0) throw new Error(`Homepage layout "${HOME_SLUG}" not found`);

  let touched = 0;
  for (const home of homes) {
    const puck = home.puckData as PuckTree | null;
    const published = home.publishedPuckData as PuckTree | null;
    const inDraft = setNavbarMenu(puck);
    const inPublished = setNavbarMenu(published);
    if (!inDraft && !inPublished) {
      console.warn(`  ! no Navbar node in layout ${home.id} — skipped`);
      continue;
    }
    await prisma.pageLayout.update({
      where: { id: home.id },
      data: {
        ...(inDraft ? { puckData: puck as unknown as Prisma.InputJsonValue } : {}),
        ...(inPublished
          ? { publishedPuckData: published as unknown as Prisma.InputJsonValue }
          : {}),
        publishedAt: new Date(),
      },
    });
    touched++;
    console.log(
      `  ~ updated ${home.id} (published=${home.isPublished}, draft=${inDraft}, publishedData=${inPublished})`,
    );
  }

  const total = MENU_ITEMS.length;
  const subs = MENU_ITEMS.reduce((s, i) => s + i.children.length, 0);
  console.log(
    `Navbar updated on ${touched}/${homes.length} "${HOME_SLUG}" layout(s): ${total} top items, ${subs} dropdown links.`,
  );
  console.log('SiteHeader syndication will propagate this to all layouts.');
  await flushCache();
  await prisma.$disconnect();
}

// Only run when invoked directly — importing MENU_ITEMS (e.g. from the seed)
// must not trigger a navbar write.
if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err);
    void prisma.$disconnect();
    process.exit(1);
  });
}
