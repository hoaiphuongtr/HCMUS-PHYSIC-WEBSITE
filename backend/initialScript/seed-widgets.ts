import envConfig from 'src/shared/config/config';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const WIDGETS = [
  {
    type: 'TOP_NAV_BAR',
    name: 'Navigation Bar',
    description: 'Top navigation with logo, menu, search, and social links',
    category: 'NAVIGATION' as const,
    icon: 'menu',
    configSchema: {
      logoUrl: { type: 'string', label: 'Logo URL' },
      showSearch: { type: 'boolean', label: 'Show Search' },
      showLanguageSelector: { type: 'boolean', label: 'Show Language Selector' },
      menuItems: {
        type: 'array',
        label: 'Menu Items',
        itemSchema: { label: 'string', url: 'string' },
      },
      socialLinks: {
        type: 'array',
        label: 'Social Links',
        itemSchema: { icon: 'string', url: 'string' },
      },
    },
    defaultConfig: {
      logoUrl: '/Logo_Phys-blue.png',
      showSearch: true,
      showLanguageSelector: true,
      menuItems: [
        { label: 'Trang chủ', url: '/' },
        { label: 'Giới thiệu', url: '/about' },
        { label: 'Đào tạo', url: '/education' },
        { label: 'Nghiên cứu', url: '/research' },
        { label: 'Hoạt động', url: '/activities' },
        { label: 'Tuyển sinh', url: '/admissions' },
        { label: 'Cựu sinh viên', url: '/alumni' },
      ],
      socialLinks: [
        { icon: 'facebook', url: 'https://facebook.com/khoavatly.hcmus' },
        { icon: 'email', url: 'mailto:khoavatly@hcmus.edu.vn' },
      ],
    },
  },
  {
    type: 'SEARCH_BAR',
    name: 'Search Bar',
    description: 'Site-wide search input',
    category: 'NAVIGATION' as const,
    icon: 'search',
    configSchema: {
      placeholder: { type: 'string', label: 'Placeholder Text' },
      searchScope: {
        type: 'select',
        label: 'Search Scope',
        options: ['Tất cả', 'Tin tức', 'Sự kiện', 'Khoa - Bộ môn'],
      },
    },
    defaultConfig: { placeholder: 'Tìm kiếm...', searchScope: 'Tất cả' },
  },
  {
    type: 'HERO_CAROUSEL',
    name: 'Hero Carousel',
    description: 'Full-width promotional banner slider',
    category: 'FEED_COMPONENTS' as const,
    icon: 'view_carousel',
    configSchema: {
      sourceCategory: {
        type: 'select',
        label: 'Source Category',
        options: [
          'EDUCATIONAL_NEWS',
          'SCIENTIFIC_INFORMATION',
          'RECRUITMENT',
          'EVENT',
          'SCHOLARSHIP',
        ],
      },
      maxSlides: { type: 'number', label: 'Max Slides', min: 1, max: 10 },
      autoplay: { type: 'boolean', label: 'Autoplay' },
      intervalMs: { type: 'number', label: 'Interval (ms)', min: 1000, max: 15000 },
      showOverlayText: { type: 'boolean', label: 'Show Overlay Text' },
      height: {
        type: 'select',
        label: 'Height',
        options: ['sm', 'md', 'lg'],
      },
    },
    defaultConfig: {
      sourceCategory: 'EDUCATIONAL_NEWS',
      maxSlides: 5,
      autoplay: true,
      intervalMs: 5000,
      showOverlayText: true,
      height: 'lg',
    },
  },
  {
    type: 'THREE_COLUMN_NEWS',
    name: 'Three-Column News',
    description: 'Three-column news grid (Tin Giáo Vụ, TTKH, Tuyển Dụng)',
    category: 'FEED_COMPONENTS' as const,
    icon: 'view_column',
    configSchema: {
      columns: {
        type: 'array',
        label: 'Columns',
        itemSchema: { title: 'string', category: 'string', maxItems: 'number' },
      },
      showThumbnails: { type: 'boolean', label: 'Show Thumbnails' },
      showDates: { type: 'boolean', label: 'Show Dates' },
    },
    defaultConfig: {
      columns: [
        { title: 'Tin Giáo Vụ', category: 'EDUCATIONAL_NEWS', maxItems: 6 },
        { title: 'Thông Tin Khoa Học', category: 'SCIENTIFIC_INFORMATION', maxItems: 6 },
        { title: 'Tuyển Dụng - Việc Làm', category: 'RECRUITMENT', maxItems: 5 },
      ],
      showThumbnails: true,
      showDates: true,
    },
  },
  {
    type: 'LATEST_NEWS_LIST',
    name: 'Latest News List',
    description: 'Vertical news list with thumbnails',
    category: 'FEED_COMPONENTS' as const,
    icon: 'view_list',
    configSchema: {
      category: {
        type: 'select',
        label: 'Category',
        options: [
          'ALL',
          'EDUCATIONAL_NEWS',
          'SCIENTIFIC_INFORMATION',
          'RECRUITMENT',
          'EVENT',
          'SCHOLARSHIP',
        ],
      },
      maxItems: { type: 'number', label: 'Max Items', min: 1, max: 50 },
      showExcerpt: { type: 'boolean', label: 'Show Excerpt' },
      showDate: { type: 'boolean', label: 'Show Date' },
      showThumbnail: { type: 'boolean', label: 'Show Thumbnail' },
    },
    defaultConfig: {
      category: 'ALL',
      maxItems: 10,
      showExcerpt: true,
      showDate: true,
      showThumbnail: true,
    },
  },
  {
    type: 'ANNOUNCEMENTS_TICKER',
    name: 'Announcements Ticker',
    description: 'Urgent scrolling announcements bar',
    category: 'UTILITY_INFO' as const,
    icon: 'campaign',
    configSchema: {
      displayMode: {
        type: 'select',
        label: 'Display Mode',
        options: ['Ticker', 'Banner', 'Static'],
      },
      maxItems: { type: 'number', label: 'Max Items', min: 1, max: 10 },
      bgColor: {
        type: 'select',
        label: 'Background Color',
        options: ['red', 'blue', 'yellow', 'green'],
      },
      speed: {
        type: 'select',
        label: 'Scroll Speed',
        options: ['slow', 'normal', 'fast'],
      },
    },
    defaultConfig: { displayMode: 'Ticker', maxItems: 5, bgColor: 'red', speed: 'normal' },
  },
  {
    type: 'VIDEO_EMBED',
    name: 'Video Embed',
    description: 'Embedded video section with title',
    category: 'CONTENT' as const,
    icon: 'play_circle',
    configSchema: {
      videoUrl: { type: 'string', label: 'Video URL' },
      title: { type: 'string', label: 'Section Title' },
      autoplay: { type: 'boolean', label: 'Autoplay' },
      aspectRatio: {
        type: 'select',
        label: 'Aspect Ratio',
        options: ['16:9', '4:3'],
      },
    },
    defaultConfig: {
      videoUrl: '',
      title: 'Video giới thiệu',
      autoplay: false,
      aspectRatio: '16:9',
    },
  },
  {
    type: 'DEPARTMENTS_GRID',
    name: 'Departments Grid',
    description: 'Department cards in a grid layout',
    category: 'CONTENT' as const,
    icon: 'apartment',
    configSchema: {
      maxDepartments: { type: 'number', label: 'Max Departments', min: 1, max: 20 },
      showAvatar: { type: 'boolean', label: 'Show Avatar' },
      showDescription: { type: 'boolean', label: 'Show Description' },
      columns: {
        type: 'select',
        label: 'Columns',
        options: ['3', '4'],
      },
    },
    defaultConfig: { maxDepartments: 8, showAvatar: true, showDescription: false, columns: '4' },
  },
  {
    type: 'LEADERSHIP_SECTION',
    name: 'Leadership Section',
    description: 'Staff profile cards for faculty leaders',
    category: 'CONTENT' as const,
    icon: 'groups',
    configSchema: {
      title: { type: 'string', label: 'Section Title' },
      showBio: { type: 'boolean', label: 'Show Bio' },
      layout: {
        type: 'select',
        label: 'Layout',
        options: ['horizontal', 'vertical'],
      },
      staffIds: {
        type: 'array',
        label: 'Staff IDs',
        itemSchema: { id: 'string' },
      },
    },
    defaultConfig: {
      title: 'Ban Chủ Nhiệm Khoa',
      showBio: true,
      layout: 'horizontal',
      staffIds: [],
    },
  },
  {
    type: 'PARTNERS_GRID',
    name: 'Partners & Affiliates',
    description: 'Partner university logo grid',
    category: 'CONTENT' as const,
    icon: 'handshake',
    configSchema: {
      title: { type: 'string', label: 'Section Title' },
      columns: {
        type: 'select',
        label: 'Columns',
        options: ['4', '6', '8'],
      },
      autoScroll: { type: 'boolean', label: 'Auto Scroll' },
      partners: {
        type: 'array',
        label: 'Partners',
        itemSchema: { name: 'string', logoUrl: 'string', url: 'string' },
      },
    },
    defaultConfig: {
      title: 'Đối tác liên kết',
      columns: '6',
      autoScroll: false,
      partners: [
        { name: 'ĐHQG-HCM', logoUrl: '', url: 'https://vnuhcm.edu.vn' },
        { name: 'ĐH Sài Gòn', logoUrl: '', url: 'https://sgu.edu.vn' },
        { name: 'ĐH Cần Thơ', logoUrl: '', url: 'https://ctu.edu.vn' },
        { name: 'ĐH Đà Lạt', logoUrl: '', url: 'https://dlu.edu.vn' },
        { name: 'ĐH Bách Khoa', logoUrl: '', url: 'https://hcmut.edu.vn' },
        { name: 'ĐH Kinh tế - Luật', logoUrl: '', url: 'https://uel.edu.vn' },
      ],
    },
  },
  {
    type: 'EVENTS_CALENDAR',
    name: 'Events Calendar',
    description: 'Mini calendar with upcoming events',
    category: 'UTILITY_INFO' as const,
    icon: 'calendar_month',
    configSchema: {
      maxEvents: { type: 'number', label: 'Max Events', min: 1, max: 20 },
      showPastEvents: { type: 'boolean', label: 'Show Past Events' },
      layout: {
        type: 'select',
        label: 'Layout',
        options: ['calendar', 'list'],
      },
    },
    defaultConfig: { maxEvents: 5, showPastEvents: false, layout: 'list' },
  },
  {
    type: 'QUICK_LINKS',
    name: 'Quick Links',
    description: 'Icon grid for frequently used tools',
    category: 'UTILITY_INFO' as const,
    icon: 'link',
    configSchema: {
      layout: {
        type: 'select',
        label: 'Layout',
        options: ['grid', 'row'],
      },
      links: {
        type: 'array',
        label: 'Links',
        itemSchema: { label: 'string', url: 'string', icon: 'string' },
      },
    },
    defaultConfig: {
      layout: 'grid',
      links: [
        { label: 'Cổng thông tin', icon: 'language', url: 'https://portal.hcmus.edu.vn' },
        { label: 'Thư viện', icon: 'local_library', url: 'https://lib.hcmus.edu.vn' },
        { label: 'Email', icon: 'email', url: 'https://mail.hcmus.edu.vn' },
        { label: 'E-Learning', icon: 'school', url: 'https://courses.hcmus.edu.vn' },
        { label: 'Lịch học', icon: 'event', url: 'https://portal.hcmus.edu.vn' },
        { label: 'Hỗ trợ', icon: 'support_agent', url: '/support' },
      ],
    },
  },
  {
    type: 'FOOTER',
    name: 'Footer',
    description: 'Multi-column footer with contact info and links',
    category: 'NAVIGATION' as const,
    icon: 'bottom_navigation',
    configSchema: {
      contactAddress: { type: 'string', label: 'Address' },
      contactPhone: { type: 'string', label: 'Phone' },
      contactEmail: { type: 'string', label: 'Email' },
      copyrightText: { type: 'string', label: 'Copyright Text' },
      footerLinks: {
        type: 'array',
        label: 'Footer Links',
        itemSchema: { label: 'string', url: 'string' },
      },
    },
    defaultConfig: {
      contactAddress:
        '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
      contactPhone: '028 38355272',
      contactEmail: 'khoavatly@hcmus.edu.vn',
      copyrightText: '© 2026 Khoa Vật lý - Vật lý Kỹ thuật, ĐHKHTN - ĐHQG-HCM',
      footerLinks: [
        { label: 'Fanpage', url: 'https://facebook.com/khoavatly.hcmus' },
        { label: 'ĐHKHTN', url: 'https://hcmus.edu.vn' },
        { label: 'ĐHQG-HCM', url: 'https://vnuhcm.edu.vn' },
      ],
    },
  },
  {
    type: 'HEADING',
    name: 'Heading',
    description: 'Text heading (h1-h6) with alignment and color',
    category: 'CONTENT' as const,
    icon: 'title',
    configSchema: {
      text: { type: 'string', label: 'Text' },
      level: { type: 'select', label: 'Level', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
      alignment: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      color: { type: 'string', label: 'Color' },
    },
    defaultConfig: { text: 'Heading', level: 'h2', alignment: 'left', color: '#1e293b' },
  },
  {
    type: 'TEXT_BLOCK',
    name: 'Text Block',
    description: 'Paragraph text with font size, alignment and color',
    category: 'CONTENT' as const,
    icon: 'article',
    configSchema: {
      content: { type: 'string', label: 'Content' },
      fontSize: { type: 'select', label: 'Font Size', options: ['sm', 'base', 'lg', 'xl'] },
      alignment: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right', 'justify'] },
      color: { type: 'string', label: 'Color' },
    },
    defaultConfig: { content: 'Enter your text here...', fontSize: 'base', alignment: 'left', color: '#475569' },
  },
  {
    type: 'IMAGE',
    name: 'Image',
    description: 'Single image with optional caption',
    category: 'CONTENT' as const,
    icon: 'image',
    configSchema: {
      src: { type: 'string', label: 'Image URL' },
      alt: { type: 'string', label: 'Alt Text' },
      caption: { type: 'string', label: 'Caption' },
      fit: { type: 'select', label: 'Fit', options: ['cover', 'contain', 'fill'] },
      borderRadius: { type: 'select', label: 'Border Radius', options: ['none', 'sm', 'md', 'lg', 'full'] },
    },
    defaultConfig: { src: '', alt: '', caption: '', fit: 'cover', borderRadius: 'md' },
  },
  {
    type: 'BUTTON',
    name: 'Button',
    description: 'Call-to-action button with variants',
    category: 'CONTENT' as const,
    icon: 'smart_button',
    configSchema: {
      label: { type: 'string', label: 'Label' },
      url: { type: 'string', label: 'URL' },
      variant: { type: 'select', label: 'Variant', options: ['primary', 'secondary', 'outline', 'ghost'] },
      size: { type: 'select', label: 'Size', options: ['sm', 'md', 'lg'] },
      alignment: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      fullWidth: { type: 'boolean', label: 'Full Width' },
    },
    defaultConfig: { label: 'Click me', url: '#', variant: 'primary', size: 'md', alignment: 'left', fullWidth: false },
  },
  {
    type: 'SPACER',
    name: 'Spacer',
    description: 'Empty vertical space',
    category: 'UTILITY_INFO' as const,
    icon: 'height',
    configSchema: {
      height: { type: 'select', label: 'Height', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    },
    defaultConfig: { height: 'md' },
  },
  {
    type: 'DIVIDER',
    name: 'Divider',
    description: 'Horizontal line separator',
    category: 'UTILITY_INFO' as const,
    icon: 'horizontal_rule',
    configSchema: {
      style: { type: 'select', label: 'Style', options: ['solid', 'dashed', 'dotted'] },
      color: { type: 'string', label: 'Color' },
      thickness: { type: 'select', label: 'Thickness', options: ['thin', 'normal', 'thick'] },
    },
    defaultConfig: { style: 'solid', color: '#e2e8f0', thickness: 'normal' },
  },
  {
    type: 'CARD',
    name: 'Card',
    description: 'Bordered card with title, description, and image',
    category: 'CONTENT' as const,
    icon: 'dashboard',
    configSchema: {
      title: { type: 'string', label: 'Title' },
      description: { type: 'string', label: 'Description' },
      imageUrl: { type: 'string', label: 'Image URL' },
      showBorder: { type: 'boolean', label: 'Show Border' },
      showShadow: { type: 'boolean', label: 'Show Shadow' },
      linkUrl: { type: 'string', label: 'Link URL' },
    },
    defaultConfig: { title: 'Card Title', description: 'Card description goes here', imageUrl: '', showBorder: true, showShadow: true, linkUrl: '' },
  },
  {
    type: 'ICON_TEXT',
    name: 'Icon + Text',
    description: 'Icon with title and description',
    category: 'CONTENT' as const,
    icon: 'featured_play_list',
    configSchema: {
      icon: { type: 'string', label: 'Icon (Material Symbol)' },
      title: { type: 'string', label: 'Title' },
      description: { type: 'string', label: 'Description' },
      iconColor: { type: 'string', label: 'Icon Color' },
      layout: { type: 'select', label: 'Layout', options: ['horizontal', 'vertical'] },
    },
    defaultConfig: { icon: 'info', title: 'Feature', description: 'Feature description', iconColor: '#3b82f6', layout: 'horizontal' },
  },
  {
    type: 'IMAGE_GALLERY',
    name: 'Image Gallery',
    description: 'Grid of images',
    category: 'CONTENT' as const,
    icon: 'photo_library',
    configSchema: {
      columns: { type: 'select', label: 'Columns', options: ['2', '3', '4'] },
      gap: { type: 'select', label: 'Gap', options: ['sm', 'md', 'lg'] },
      images: { type: 'array', label: 'Images', itemSchema: { src: 'string', alt: 'string' } },
    },
    defaultConfig: { columns: '3', gap: 'md', images: [] },
  },
  {
    type: 'BANNER',
    name: 'Banner',
    description: 'Full-width colored banner with text and optional button',
    category: 'CONTENT' as const,
    icon: 'web_stories',
    configSchema: {
      text: { type: 'string', label: 'Text' },
      subtext: { type: 'string', label: 'Subtext' },
      bgColor: { type: 'string', label: 'Background Color' },
      textColor: { type: 'string', label: 'Text Color' },
      alignment: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      buttonLabel: { type: 'string', label: 'Button Label' },
      buttonUrl: { type: 'string', label: 'Button URL' },
    },
    defaultConfig: { text: 'Welcome', subtext: '', bgColor: '#1e40af', textColor: '#ffffff', alignment: 'center', buttonLabel: '', buttonUrl: '' },
  },
  {
    type: 'NAV_LINKS',
    name: 'Navigation Links',
    description: 'Simple navigation link list with arrow indicators',
    category: 'NAVIGATION' as const,
    icon: 'arrow_forward',
    configSchema: {
      links: {
        type: 'array',
        label: 'Links',
        itemSchema: { label: 'string', url: 'string' },
      },
      direction: { type: 'select', label: 'Direction', options: ['vertical', 'horizontal'] },
      showArrow: { type: 'boolean', label: 'Show Arrow' },
      fontSize: { type: 'select', label: 'Font Size', options: ['sm', 'base', 'lg'] },
      fontWeight: { type: 'select', label: 'Font Weight', options: ['normal', 'medium', 'semibold', 'bold'] },
      color: { type: 'string', label: 'Text Color' },
    },
    defaultConfig: {
      links: [
        { label: 'TIN GIÁO VỤ', url: '/tin-giao-vu' },
        { label: 'THÔNG TIN KHOA HỌC', url: '/thong-tin-khoa-hoc' },
        { label: 'TUYỂN DỤNG - VIỆC LÀM', url: '/tuyen-dung-viec-lam' },
        { label: 'CÂU LẠC BỘ', url: '/cau-lac-bo' },
        { label: 'HOẠT ĐỘNG CÔNG ĐOÀN KHOA', url: '/hoat-dong-cong-doan' },
      ],
      direction: 'vertical',
      showArrow: true,
      fontSize: 'sm',
      fontWeight: 'medium',
      color: '#374151',
    },
  },
];

const main = async () => {
  let created = 0;
  let skipped = 0;

  for (const widget of WIDGETS) {
    const existing = await prisma.widget.findUnique({ where: { type: widget.type } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.widget.create({ data: widget });
    created++;
  }

  return { created, skipped };
};

main()
  .then(({ created, skipped }) => {
    console.log(`Widgets seeded: ${created} created, ${skipped} skipped (already exist)`);
  })
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
