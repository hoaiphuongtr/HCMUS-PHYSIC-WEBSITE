/**
 * diag-post-visibility.ts — CHỈ ĐỌC. Vì sao một bài viết không hiện ngoài site?
 *
 * Bài chỉ hiện công khai khi qua ĐỦ các cửa sau (xem PUBLICLY_VISIBLE trong
 * post.service.ts):
 *   1. publishedAt != null          — đã từng xuất bản
 *   2. có ÍT NHẤT 1 layout đã xuất bản (isPublished, chưa xoá)  ← hay quên nhất
 *   3. có nội dung công khai
 *   4. lọt bộ lọc bộ môn của feed đang xem
 *
 * Riêng cửa 4: trang chủ + trang tin CHỈ lấy bài của Khoa (departmentId =
 * FACULTY_DEPT_ID hoặc null). Bài của một đơn vị (Đoàn–Hội, CLB) mang
 * departmentId riêng nên bị loại — kể cả khi lọc theo đúng danh mục của nó.
 *
 * Dùng (chạy trong container backend, khỏi cần tunnel):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/diag-post-visibility.ts "một phần tiêu đề"
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const FACULTY_DEPT_ID = 'dept_legacy_1';
const needle = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';

const ok = (b: boolean) => (b ? 'ĐẠT ' : 'HỎNG');

async function main(): Promise<void> {
  const posts = await prisma.post.findMany({
    where: needle
      ? {
          OR: [
            { slug: { contains: needle, mode: 'insensitive' } },
            { title: { path: ['vi'], string_contains: needle } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: needle ? 20 : 10,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      deletedAt: true,
      body: true,
      departmentId: true,
      department: { select: { name: true, slug: true, kind: true } },
      layouts: {
        select: {
          slug: true,
          isPublished: true,
          deletedAt: true,
          categoryLinks: { select: { category: { select: { slug: true } } } },
        },
      },
    },
  });

  if (!posts.length) {
    console.log('Không tìm thấy bài nào khớp.');
    await prisma.$disconnect();
    return;
  }

  for (const p of posts) {
    const title = (p.title as { vi?: string })?.vi ?? p.slug;
    const livedLayout = p.layouts.filter((l) => l.isPublished && !l.deletedAt);
    const isFacultyFeed =
      p.departmentId === FACULTY_DEPT_ID || p.departmentId === null;
    // Danh mục gắn ở LAYOUT (categoryLinks), không gắn ở bài viết.
    const cats = [
      ...new Set(
        p.layouts.flatMap((l) => l.categoryLinks.map((c) => c.category.slug)),
      ),
    ];
    const catsLive = [
      ...new Set(
        livedLayout.flatMap((l) => l.categoryLinks.map((c) => c.category.slug)),
      ),
    ];

    console.log(`\n${'='.repeat(64)}`);
    console.log(`${title}`);
    console.log(`  slug        : ${p.slug}`);
    console.log(`  trạng thái  : ${p.status}`);
    console.log(
      `  bộ môn      : ${p.department?.name ?? '(không có — coi là của Khoa)'}` +
        (p.department ? ` [${p.department.slug}, kind=${p.department.kind}]` : ''),
    );
    console.log(`  danh mục    : ${cats.length ? cats.join(', ') : '(CHƯA CHỌN)'}`);
    console.log(
      `  layout      : ${p.layouts.length ? p.layouts.map((l) => `${l.slug}${l.isPublished ? ' (đã xuất bản)' : ' (CHƯA xuất bản)'}${l.deletedAt ? ' [đã xoá]' : ''}`).join(', ') : '(KHÔNG có layout nào)'}`,
    );
    console.log('  --- các cửa phải qua ---');
    console.log(`  ${ok(!p.deletedAt)} chưa bị xoá`);
    console.log(`  ${ok(!!p.publishedAt)} publishedAt != null (${p.publishedAt?.toISOString().slice(0, 16) ?? 'null'})`);
    console.log(`  ${ok(livedLayout.length > 0)} có layout ĐÃ XUẤT BẢN`);
    console.log(
      `  ${ok(catsLive.length > 0)} danh mục nằm trên layout ĐÃ xuất bản` +
        (cats.length && !catsLive.length
          ? ` (có gán ${cats.join(', ')} nhưng layout chưa xuất bản)`
          : ''),
    );
    console.log(
      `  ${ok(isFacultyFeed)} lọt feed của Khoa (trang chủ + /tin-tuc)` +
        (isFacultyFeed ? '' : ' <- bài của ĐƠN VỊ nên bị loại khỏi feed Khoa'),
    );

    const blockers: string[] = [];
    if (p.deletedAt) blockers.push('bài đã bị xoá');
    if (!p.publishedAt) blockers.push('chưa xuất bản (publishedAt null)');
    if (!livedLayout.length) blockers.push('CHƯA XUẤT BẢN LAYOUT của bài');
    if (!catsLive.length)
      blockers.push(
        cats.length
          ? 'danh mục nằm trên layout CHƯA xuất bản'
          : 'chưa gán danh mục nào',
      );
    if (!isFacultyFeed)
      blockers.push('bài thuộc đơn vị riêng nên không vào feed Khoa');
    console.log(
      blockers.length
        ? `  => KHÔNG HIỆN vì: ${blockers.join(' | ')}`
        : '  => Đủ điều kiện hiện (nếu vẫn không thấy thì là CACHE — revalidate tag sitemap)',
    );
  }

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
