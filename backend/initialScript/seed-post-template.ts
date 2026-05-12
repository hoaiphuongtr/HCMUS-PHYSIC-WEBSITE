import envConfig from 'src/shared/config/config';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import KeyvRedis from '@keyv/redis';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const flushRedisCache = async () => {
  if (!envConfig.REDIS_URL) return;
  const store = new KeyvRedis(envConfig.REDIS_URL);
  try {
    await store.clear();
    console.log('Redis cache flushed');
  } catch (err) {
    console.warn('Failed to flush Redis cache:', (err as Error).message);
  } finally {
    try {
      await store.disconnect();
    } catch {
      // ignore
    }
  }
};

const PHYS_LOGO =
  'https://phys.hcmus.edu.vn/uploads/khoa-vat-ly/TUI_LA_NGU/1.LOGO_m%E1%BB%9Bi/Logo_Phys-blue.png';

const POST_TEMPLATE_PUCK = {
  root: {},
  content: [
    {
      type: 'Navbar',
      props: {
        id: 'post-tpl-navbar',
        logoSrc: PHYS_LOGO,
        logoAlt: 'Khoa Vật lý - Vật lý Kỹ thuật',
        menuItems: [
          { label: 'Trang chủ', url: '/', children: '' },
          { label: 'Tin tức', url: '/tin-tuc', children: '' },
          { label: 'Tuyển sinh', url: '/tuyen-sinh', children: '' },
          { label: 'Đào tạo', url: '/dao-tao', children: '' },
          { label: 'Nghiên cứu', url: '/nghien-cuu', children: '' },
          { label: 'Liên hệ', url: '/lien-he', children: '' },
        ],
        bgColor: '#ffffff',
        textColor: '#1e293b',
      },
    },

    {
      type: 'Container',
      props: {
        id: 'post-tpl-article',
        maxWidth: 'lg',
        padding: 'md',
        bgColor: '',
        centered: true,
        content: [
          {
            type: 'PostReaderTools',
            props: {
              id: 'post-tpl-reader-tools',
              enabled: true,
              gap: 'md',
              stickyTop: 'md',
            },
          },
          {
            type: 'PostHeader',
            props: {
              id: 'post-tpl-header',
              text: '',
              defaultText: { vi: 'Tiêu đề bài đăng', en: 'Post title' },
              categoryLabel: '',
              defaultCategoryLabel: { vi: 'Chuyên mục', en: 'Category' },
              publishedAt: '',
            },
          },
          {
            type: 'PostCoverImage',
            props: {
              id: 'post-tpl-cover',
              src: '',
              alt: '',
              defaultSrc: '',
              defaultAlt: { vi: 'Ảnh bìa bài đăng', en: 'Post cover image' },
              aspectRatio: '16/9',
            },
          },
          {
            type: 'PostBody',
            props: {
              id: 'post-tpl-body',
              markdown: '',
              defaultMarkdown: {
                vi: '## Nội dung bài đăng\n\nNội dung sẽ được điền tự động khi áp dụng vào một bài viết.',
                en: '## Post content\n\nContent will be filled automatically when a post is applied.',
              },
            },
          },
          {
            type: 'PostEventInfo',
            props: {
              id: 'post-tpl-event',
              startAt: '',
              endAt: '',
              location: '',
              defaultStart: '',
              defaultEnd: '',
              defaultLocation: { vi: '', en: '' },
            },
          },
          {
            type: 'Spacer',
            props: { id: 'post-tpl-spacer-tags', height: 'sm' },
          },
          {
            type: 'PostTagList',
            props: {
              id: 'post-tpl-tags',
              tags: [],
              defaultTags: [],
            },
          },
        ],
      },
    },

    {
      type: 'FooterBlock',
      props: {
        id: 'post-tpl-footer',
        bgColor: '#0c2340',
        textColor: '#94a3b8',
        content: [
          {
            type: 'TextBlock',
            props: {
              id: 'post-tpl-footer-text',
              content:
                'Khoa Vật Lý - Vật Lý Kỹ Thuật · 227 Nguyễn Văn Cừ, Q.5, TP.HCM · phys@hcmus.edu.vn',
              fontSize: 'sm',
              alignment: 'center',
              color: '#94a3b8',
            },
          },
          {
            type: 'TextBlock',
            props: {
              id: 'post-tpl-copyright',
              content: 'Bản quyền © 2026 Khoa Vật Lý - Vật Lý Kỹ Thuật.',
              fontSize: 'xs',
              alignment: 'center',
              color: '#64748b',
            },
          },
        ],
      },
    },
  ],
};

const TEMPLATE_SLUG = '__post-template-default';
const TEMPLATE_NAME = 'Bài đăng — Mẫu chuẩn (Tuổi Trẻ)';
const TEMPLATE_DESCRIPTION =
  'Layout chuẩn cho mọi bài đăng. Bao gồm Navbar, sidebar đọc (font +/-, copy link, share Facebook), header với chuyên mục + ngày đăng + tiêu đề, ảnh bìa, nội dung, sự kiện, tag, footer.';

const main = async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  if (!admin) {
    console.log('No SuperAdmin user found, skipping post template seed');
    return;
  }

  const existing = await prisma.pageLayout.findFirst({
    where: { slug: TEMPLATE_SLUG },
  });
  if (existing) {
    await prisma.pageLayout.update({
      where: { id: existing.id },
      data: {
        name: TEMPLATE_NAME,
        description: TEMPLATE_DESCRIPTION,
        puckData: POST_TEMPLATE_PUCK as any,
      },
    });
    console.log(`Post template layout "${TEMPLATE_SLUG}" updated`);
  } else {
    await prisma.pageLayout.create({
      data: {
        name: TEMPLATE_NAME,
        slug: TEMPLATE_SLUG,
        description: TEMPLATE_DESCRIPTION,
        puckData: POST_TEMPLATE_PUCK as any,
        isPublished: false,
        createdBy: admin.id,
      },
    });
    console.log(`Post template layout "${TEMPLATE_SLUG}" created`);
  }
};

main()
  .then(() => flushRedisCache())
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
