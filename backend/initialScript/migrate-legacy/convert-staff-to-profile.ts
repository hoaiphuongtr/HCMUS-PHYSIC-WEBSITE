/**
 * convert-staff-to-profile.ts — đổi khung trang nhân sự từ LegacyPageBody sang
 * StaffProfile (ảnh chân dung thành card bên trái thay vì bị chôn làm nền banner).
 *
 * KHÔNG cần MariaDB legacy: mọi dữ liệu cần thiết đã nằm trong Postgres từ lần
 * migrate trước —
 *   ảnh chân dung ← PageHero.bgImage   (build-class-staff-pages.ts đã nhét vào đây)
 *   nội dung      ← LegacyPageBody.html (giữ NGUYÊN, không dựng lại từ dump nên
 *                                        chỉnh sửa của biên tập viên không mất)
 *   họ tên        ← PageHero.title
 *   email         ← mailto: trong chính nội dung
 *
 * An toàn khi chạy lại: trang đã chuyển rồi thì bỏ qua; trang đã dựng tay (khung
 * khác 4 khối chuẩn) cũng bỏ qua và in tên ra để người xem lại.
 *
 * Chạy thử (không ghi gì):
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/convert-staff-to-profile.ts --dry
 * Chạy thật:
 *   corepack pnpm --filter backend exec tsx initialScript/migrate-legacy/convert-staff-to-profile.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { flushCache } from './flush-cache';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const DRY = process.argv.includes('--dry') || process.env.DRY_RUN === '1';

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = { root?: unknown; content?: PuckNode[] };

// KHÔNG tự đoán email từ nội dung. Bản chạy thử cho thấy nhiều trang nhắc email
// của NGƯỜI KHÁC (người hướng dẫn, đầu mối liên hệ) nên "lấy mailto: đầu tiên"
// gán nhầm hàng loạt: Lê Đức Anh ra email của Nguyễn Mạnh Bảo, một loạt trang ra
// email của Trần Quang Trung. Email sai trên hồ sơ công khai tệ hơn là để trống —
// dù sao nội dung trang vẫn hiện email đúng của họ. Biên tập viên điền vào ô
// Email trong Puck nếu muốn hiện trên danh thiếp.

/**
 * Đổi một cây Puck sang khung StaffProfile.
 * Trả về null nếu không đụng được: khung đã bị sửa tay, hoặc đã chuyển rồi.
 */
function convertTree(
  tree: unknown,
): { next: PuckTree; reason?: never } | { next: null; reason: string } {
  const content = (tree as PuckTree | null)?.content;
  if (!Array.isArray(content) || content.length !== 4)
    return { next: null, reason: 'custom' };
  const [header, hero, body, footer] = content;
  if (
    header?.type !== 'Header' ||
    hero?.type !== 'PageHero' ||
    footer?.type !== 'Footer'
  )
    return { next: null, reason: 'custom' };
  if (body?.type === 'StaffProfile') return { next: null, reason: 'done' };
  if (body?.type !== 'LegacyPageBody') return { next: null, reason: 'custom' };

  const heroProps = hero.props ?? {};
  const portrait = typeof heroProps.bgImage === 'string' ? heroProps.bgImage : '';
  const html = body.props?.html ?? { vi: '', en: '' };

  return {
    next: {
      ...(tree as PuckTree),
      content: [
        header,
        // Ảnh chân dung rời khỏi nền banner → banner về nền navy sạch.
        { ...hero, props: { ...heroProps, bgImage: '' } },
        {
          type: 'StaffProfile',
          props: {
            id: body.props?.id ?? `body-${Date.now()}`,
            photo: portrait,
            name: heroProps.title ?? { vi: '', en: '' },
            role: { vi: '', en: '' },
            email: '',
            phone: '',
            html,
          },
        },
        footer,
      ],
    },
  };
}

async function main(): Promise<void> {
  const pages = await prisma.pageLayout.findMany({
    where: { slug: { contains: '/nhan-su/' } },
    select: { id: true, slug: true, puckData: true, publishedPuckData: true },
    orderBy: { slug: 'asc' },
  });
  console.log(`Tìm thấy ${pages.length} trang nhân sự.`);

  let converted = 0;
  let alreadyDone = 0;
  let custom = 0;
  let failed = 0;

  for (const page of pages) {
    const draft = convertTree(page.puckData);
    if (!draft.next) {
      if (draft.reason === 'done') alreadyDone += 1;
      else {
        custom += 1;
        console.log(`  ~ bỏ qua (khung đã dựng tay): ${page.slug}`);
      }
      continue;
    }
    // Bản đã xuất bản có thể khác bản nháp — đổi riêng, chỉ khi nó cũng đúng khung.
    const published = convertTree(page.publishedPuckData);

    if (DRY) {
      const photo = draft.next.content?.[2]?.props?.photo;
      console.log(`  [dry] ${page.slug} | ảnh=${photo ? 'có' : 'KHÔNG'}`);
      converted += 1;
      continue;
    }

    try {
      await prisma.pageLayout.update({
        where: { id: page.id },
        data: {
          puckData: draft.next as unknown as Prisma.InputJsonValue,
          ...(published.next
            ? {
                publishedPuckData:
                  published.next as unknown as Prisma.InputJsonValue,
              }
            : {}),
        },
      });
      converted += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ! lỗi ${page.slug}:`, (err as Error).message);
    }
  }

  console.log(
    `Xong${DRY ? ' (CHẠY THỬ — chưa ghi gì)' : ''}. ` +
      `da_chuyen=${converted} da_chuyen_tu_truoc=${alreadyDone} ` +
      `bo_qua_dung_tay=${custom} loi=${failed}`,
  );
  if (!DRY && converted > 0) await flushCache();
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
