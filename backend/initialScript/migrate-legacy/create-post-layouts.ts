/**
 * create-post-layouts.ts — tạo các LAYOUT MẪU đúng nghĩa: khác nhau ở BỐ CỤC,
 * không phải khác nhau ở danh mục.
 *
 * BỐI CẢNH: 7 "layout mẫu" cũ có cấu trúc GIỐNG HỆT nhau
 *   Header → Container[PostReaderTools, PostHeader, PostTagList,
 *            PostCoverImage, PostBody, PostEventInfo, Spacer] → Footer
 * và chỉ khác tên + danh mục. Tức là nhãn danh mục đội lốt layout, nên chọn
 * "layout mẫu" chưa bao giờ đổi được cách trình bày.
 *
 * Script này nhân bản bố cục gốc rồi BIẾN ĐỔI phần ruột bài viết, nên mẫu mới
 * chắc chắn hợp lệ với trình dựng trang (không dựng cây Puck bằng tay).
 *
 * Chạy thử (không ghi gì):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/create-post-layouts.ts
 * Tạo thật:
 *   ... create-post-layouts.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const APPLY = process.argv.includes('--apply');

/** Mẫu lấy làm gốc để nhân bản — bố cục bài chuẩn đang chạy. */
const BASE_TEMPLATE_ID = 'cat_tmpl_scientific-information';
/** Khối Container chứa phần thân bài; các khối con nằm trong props.content. */
const ARTICLE_ID = 'post-tpl-article';

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = { root?: unknown; content?: PuckNode[] };

/** Biến đổi danh sách khối trong thân bài. */
type Recipe = {
  slug: string;
  name: string;
  description: string;
  /** Mẫu dành cho bài sự kiện (gắn danh mục "event" để lọc đúng nhóm). */
  forEvent?: boolean;
  transform: (blocks: PuckNode[]) => PuckNode[];
};

const drop = (blocks: PuckNode[], type: string) =>
  blocks.filter((b) => b.type !== type);

const insertAfter = (blocks: PuckNode[], type: string, node: PuckNode) => {
  const i = blocks.findIndex((b) => b.type === type);
  if (i === -1) return [...blocks, node];
  return [...blocks.slice(0, i + 1), node, ...blocks.slice(i + 1)];
};

const moveBefore = (blocks: PuckNode[], move: string, before: string) => {
  const node = blocks.find((b) => b.type === move);
  if (!node) return blocks;
  const rest = blocks.filter((b) => b.type !== move);
  const i = rest.findIndex((b) => b.type === before);
  if (i === -1) return [node, ...rest];
  return [...rest.slice(0, i), node, ...rest.slice(i)];
};

const RECIPES: Recipe[] = [
  {
    slug: 'layout-bai-chuan',
    name: 'Bài chuẩn',
    description:
      'Bố cục mặc định: tiêu đề, ảnh bìa, nội dung, thẻ. Dùng cho hầu hết bài viết.',
    transform: (b) => b,
  },
  {
    slug: 'layout-bai-chi-van-ban',
    name: 'Bài chỉ văn bản',
    description:
      'Bỏ ảnh bìa — hợp với thông báo, lịch học, danh sách: nội dung lên ngay đầu trang.',
    transform: (b) => drop(b, 'PostCoverImage'),
  },
  {
    slug: 'layout-bai-nhieu-anh',
    name: 'Bài nhiều ảnh',
    description:
      'Thêm băng ảnh (carousel) cuối bài — hợp với tổng kết sự kiện, phóng sự ảnh. Ảnh nhập ngay trong trình soạn bài.',
    transform: (b) =>
      insertAfter(b, 'PostBody', {
        // HOLDER, không phải ImageGallery thường: ảnh do trình soạn bài bơm vào,
        // và khối tự ẩn khi bài không có ảnh (ImageGallery để lại ô xám trống).
        type: 'PostGallery',
        props: {
          id: 'post-tpl-gallery',
          images: [],
          caption: { vi: '', en: '' },
        },
      }),
  },
  {
    slug: 'layout-bai-co-video',
    name: 'Bài có video',
    description:
      'Video đặt ngay dưới tiêu đề — hợp với bản tin có clip, ghi hình hội thảo. Dán link YouTube/Drive/OneDrive khi soạn bài.',
    transform: (b) =>
      insertAfter(b, 'PostHeader', {
        type: 'PostVideo',
        props: {
          id: 'post-tpl-video',
          url: '',
          caption: { vi: '', en: '' },
        },
      }),
  },
  {
    slug: 'layout-bai-day-du',
    name: 'Bài đầy đủ (video + ảnh)',
    description:
      'Có cả video dưới tiêu đề lẫn băng ảnh cuối bài. Dùng cho bài tổng kết lớn; ô nào bỏ trống thì khối đó tự ẩn.',
    transform: (b) =>
      insertAfter(
        insertAfter(b, 'PostHeader', {
          type: 'PostVideo',
          props: { id: 'post-tpl-video', url: '', caption: { vi: '', en: '' } },
        }),
        'PostBody',
        {
          type: 'PostGallery',
          props: {
            id: 'post-tpl-gallery',
            images: [],
            caption: { vi: '', en: '' },
          },
        },
      ),
  },
  {
    slug: 'layout-bai-su-kien',
    name: 'Bài sự kiện',
    description:
      'Đưa khối thời gian – địa điểm lên TRƯỚC nội dung để người đọc thấy ngay.',
    forEvent: true,
    transform: (b) => moveBefore(b, 'PostEventInfo', 'PostBody'),
  },
];

async function main(): Promise<void> {
  const base = await prisma.pageLayout.findUnique({
    where: { id: BASE_TEMPLATE_ID },
    select: {
      puckData: true,
      createdBy: true,
      departmentId: true,
      categoryId: true,
    },
  });
  if (!base?.puckData) {
    console.error(`Không đọc được mẫu gốc ${BASE_TEMPLATE_ID}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const eventCategory = await prisma.category.findFirst({
    where: { slug: 'event' },
    select: { id: true },
  });

  const tree = base.puckData as PuckTree;
  const article = (tree.content ?? []).find(
    (n) => (n.props as { id?: string } | undefined)?.id === ARTICLE_ID,
  );
  const baseBlocks = (article?.props?.content ?? []) as PuckNode[];
  if (!baseBlocks.length) {
    console.error('Mẫu gốc không có khối nào trong thân bài — dừng cho an toàn.');
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }
  console.log(
    `Thân bài gốc: ${baseBlocks.map((b) => b.type).join(' → ')}\n`,
  );

  let created = 0;
  let skipped = 0;

  for (const r of RECIPES) {
    const exists = await prisma.pageLayout.findFirst({
      where: { slug: r.slug, deletedAt: null },
      select: { id: true },
    });
    const blocks = r.transform(baseBlocks);

    console.log('='.repeat(64));
    console.log(`${r.name}  [${r.slug}]${exists ? '  — ĐÃ CÓ, bỏ qua' : ''}`);
    console.log(`  ${r.description}`);
    console.log(`  thân bài: ${blocks.map((b) => b.type).join(' → ')}`);

    if (exists) {
      skipped += 1;
      continue;
    }
    if (!APPLY) {
      created += 1;
      continue;
    }

    // Nhân bản cây gốc rồi thay ruột Container — giữ nguyên Header/Footer và
    // mọi thuộc tính khác của bố cục.
    const next: PuckTree = {
      ...tree,
      content: (tree.content ?? []).map((n) =>
        (n.props as { id?: string } | undefined)?.id === ARTICLE_ID
          ? { ...n, props: { ...(n.props ?? {}), content: blocks } }
          : n,
      ),
    };

    await prisma.pageLayout.create({
      data: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        puckData: next as unknown as Prisma.InputJsonValue,
        isPostTemplate: true,
        // Mẫu sự kiện gắn danh mục "event" để lọt đúng nhóm Sự kiện; mẫu tin
        // tức để trống danh mục — bố cục không nên gắn với một mục cụ thể nào.
        categoryId: r.forEvent ? (eventCategory?.id ?? null) : null,
        departmentId: base.departmentId,
        createdBy: base.createdBy,
        isPublished: false,
      },
    });
    created += 1;
  }

  console.log(
    `\n${APPLY ? 'Đã tạo' : '[chạy thử] sẽ tạo'} ${created} mẫu, bỏ qua ${skipped} mẫu đã có.` +
      (APPLY ? '' : '\n(chưa ghi gì — thêm --apply để tạo thật)'),
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
