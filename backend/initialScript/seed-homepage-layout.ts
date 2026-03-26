import envConfig from 'src/shared/config/config';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const HOMEPAGE_PUCK_DATA = {
  root: {},
  content: [
    {
      type: 'Navbar',
      props: {
        id: 'main-navbar',
        logoSrc: '/Logo_Phys-blue.png',
        logoAlt: 'Khoa Vật lý - Vật lý Kỹ thuật',
        menuItems: [
          { label: 'Trang chủ', url: '/', children: '' },
          {
            label: 'Giới thiệu',
            url: '/gioi-thieu',
            children: 'Lịch sử,Sứ mệnh,Tầm nhìn,Cơ cấu tổ chức',
          },
          {
            label: 'Đội ngũ',
            url: '/doi-ngu',
            children:
              'Ban chủ nhiệm Khoa,Giảng viên,Nghiên cứu sinh,Trợ giảng',
          },
          {
            label: 'Đào tạo',
            url: '/dao-tao',
            children:
              'Đại học,Sau đại học,Chương trình đào tạo,Quy chế,Biểu mẫu',
          },
          {
            label: 'Nghiên cứu',
            url: '/nghien-cuu',
            children:
              'Nhóm nghiên cứu,Phòng thí nghiệm,Dự án,Công bố khoa học',
          },
          {
            label: 'Hội nghị',
            url: '/hoi-nghi',
            children: 'Sắp diễn ra,Đã diễn ra',
          },
          {
            label: 'Hoạt động',
            url: '/hoat-dong',
            children: 'Tin tức,Sự kiện,Đoàn - Hội',
          },
          { label: 'Tuyển sinh', url: '/tuyen-sinh', children: '' },
          { label: 'Cựu sinh viên', url: '/cuu-sinh-vien', children: '' },
        ],
        bgColor: '#ffffff',
        textColor: '#1e293b',
      },
    },

    {
      type: 'ImageSlider',
      props: {
        id: 'hero-slider',
        slides: [
          {
            src: '',
            alt: 'Khoa Vật lý - Vật lý Kỹ thuật',
            caption: 'Chào mừng đến với Khoa Vật lý - Vật lý Kỹ thuật',
            linkUrl: '/gioi-thieu',
          },
          {
            src: '',
            alt: 'Tuyển sinh 2026',
            caption: 'Tuyển sinh Đại học năm 2026',
            linkUrl: '/tuyen-sinh',
          },
          {
            src: '',
            alt: 'Nghiên cứu khoa học',
            caption: 'Nghiên cứu khoa học đỉnh cao',
            linkUrl: '/nghien-cuu',
          },
          {
            src: '',
            alt: 'Kiểm định ASIIN',
            caption: 'Chương trình đạt kiểm định ASIIN',
            linkUrl: '/dao-tao',
          },
        ],
        autoplay: true,
        intervalMs: 5000,
        height: 'xl',
        showDots: true,
        showArrows: true,
        borderRadius: 'none',
      },
    },

    {
      type: 'Container',
      props: {
        id: 'news-section-wrapper',
        maxWidth: 'xl',
        padding: 'md',
        bgColor: '',
        centered: true,
        content: [
          {
            type: 'Columns',
            props: {
              id: 'news-4-cols',
              columns: '4',
              gap: 'md',
              verticalAlign: 'top',
              col0: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'tgv-header',
                    title: 'TIN GIÁO VỤ',
                    linkText: '',
                    linkUrl: '',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'tgv-1',
                    imageUrl: '',
                    title:
                      'Thông báo về việc đăng ký học phần và thời khoá biểu...',
                    date: '04/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'tgv-2',
                    imageUrl: '',
                    title:
                      'Thông báo kết quả xét duyệt học bổng trao tại Lễ Tốt...',
                    date: '18/12/2025',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'tgv-3',
                    imageUrl: '',
                    title:
                      'Thông báo tổ chức Lễ tốt nghiệp đợt Khoa năm 2025',
                    date: '19/11/2025',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'tgv-4',
                    imageUrl: '',
                    title:
                      '[HTTT] Hành trình trải tôi sáng - xét danh hiệu "Sinh viên 5...',
                    date: '01/11/2025',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'tgv-5',
                    imageUrl: '',
                    title:
                      'THÔNG BÁO VỀ VIỆC CẤP HỌC BỔNG TRONG LỄ TỐT...',
                    date: '06/11/2025',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'Spacer',
                  props: { id: 'tgv-spacer', height: 'sm' },
                },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'tgv-more',
                    label: 'Xem thêm',
                    url: '/tin-giao-vu',
                    variant: 'outline',
                    size: 'sm',
                    fullWidth: false,
                    alignment: 'center',
                  },
                },
              ],
              col1: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'ttkh-header',
                    title: 'THÔNG TIN KHOA HỌC',
                    linkText: '',
                    linkUrl: '',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'ttkh-1',
                    imageUrl: '',
                    title:
                      'Hội thảo quốc tế và các tiến bộ giàn dây trong khoa học vô...',
                    date: '24/03/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'ttkh-2',
                    imageUrl: '',
                    title:
                      'TƯỞNG NIỆM PGS.TS. NHÀ GIÁO NHÂN DÂN NGUYỄN...',
                    date: '22/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'ttkh-3',
                    imageUrl: '',
                    title:
                      'Tuyển sinh đi học tại Liên bang Nga năm 2026 theo Đề...',
                    date: '17/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'ttkh-4',
                    imageUrl: '',
                    title:
                      'Thông báo tuyển sinh học bổng tại Ban-ga-ri năm 2026',
                    date: '16/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'ttkh-5',
                    imageUrl: '',
                    title:
                      'Chương trình trao đổi học kỳ mùa thu 2026 tại Đại học...',
                    date: '10/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'Spacer',
                  props: { id: 'ttkh-spacer', height: 'sm' },
                },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'ttkh-more',
                    label: 'Xem thêm',
                    url: '/thong-tin-khoa-hoc',
                    variant: 'outline',
                    size: 'sm',
                    fullWidth: false,
                    alignment: 'center',
                  },
                },
              ],
              col2: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'td-header',
                    title: 'TUYỂN DỤNG - VIỆC LÀM',
                    linkText: '',
                    linkUrl: '',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'td-1',
                    imageUrl: '',
                    title: 'Discover Synopsys program',
                    date: '25/03/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'td-2',
                    imageUrl: '',
                    title: 'Thông báo tuyển dụng từ công ty ESTEC',
                    date: '13/08/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'td-3',
                    imageUrl: '',
                    title:
                      '[EAB] Thực tập sinh kỹ sư Mô hình Mô phỏng (Simulink)...',
                    date: '05/02/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'td-4',
                    imageUrl: '',
                    title:
                      'Chương trình tuyển thực tập Mùa hè Sinh viên 51 tại TMA...',
                    date: '20/01/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'td-5',
                    imageUrl: '',
                    title:
                      'Chương trình Đại sứ Sinh viên Renesas (Pilot)',
                    date: '24/10/2025',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'Spacer',
                  props: { id: 'td-spacer', height: 'sm' },
                },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'td-more',
                    label: 'Xem thêm',
                    url: '/tuyen-dung',
                    variant: 'outline',
                    size: 'sm',
                    fullWidth: false,
                    alignment: 'center',
                  },
                },
              ],
              col3: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'video-header',
                    title: 'VIDEO',
                    linkText: '',
                    linkUrl: '',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'VideoEmbed',
                  props: {
                    id: 'video-1',
                    videoUrl:
                      'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    title:
                      'Giới thiệu ngành CÔNG NGHỆ Khoa Vật lý - Vật lý KỸ THUẬT',
                    aspectRatio: '16:9',
                  },
                },
                {
                  type: 'Spacer',
                  props: { id: 'video-spacer-1', height: 'sm' },
                },
                {
                  type: 'VideoEmbed',
                  props: {
                    id: 'video-2',
                    videoUrl:
                      'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    title: 'Giới thiệu ngành VẬT LÝ',
                    aspectRatio: '16:9',
                  },
                },
              ],
            },
          },
        ],
      },
    },

    { type: 'Spacer', props: { id: 'spacer-after-news', height: 'lg' } },

    {
      type: 'Heading',
      props: {
        id: 'dept-heading',
        text: 'Các Bộ môn',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    { type: 'Spacer', props: { id: 'spacer-before-dept', height: 'sm' } },
    {
      type: 'Grid',
      props: {
        id: 'dept-grid',
        columns: '4',
        rows: '2',
        gap: 'md',
        cell0: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vlth',
              imageUrl: '',
              title: 'Vật lý Tin học',
              linkUrl: '/bo-mon/vat-ly-tin-hoc',
            },
          },
        ],
        cell1: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vllt',
              imageUrl: '',
              title: 'Vật lý Lý thuyết',
              linkUrl: '/bo-mon/vat-ly-ly-thuyet',
            },
          },
        ],
        cell2: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vlhn',
              imageUrl: '',
              title: 'Vật lý Hạt nhân - KTHN - VLY/Y',
              linkUrl: '/bo-mon/vat-ly-hat-nhan',
            },
          },
        ],
        cell3: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vlcr',
              imageUrl: '',
              title: 'Vật lý Chất Rắn',
              linkUrl: '/bo-mon/vat-ly-chat-ran',
            },
          },
        ],
        cell4: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vlud',
              imageUrl: '',
              title: 'Vật lý Ứng Dụng',
              linkUrl: '/bo-mon/vat-ly-ung-dung',
            },
          },
        ],
        cell5: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-vldt',
              imageUrl: '',
              title: 'Vật lý Điện Tử',
              linkUrl: '/bo-mon/vat-ly-dien-tu',
            },
          },
        ],
        cell6: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-dvl',
              imageUrl: '',
              title: 'Địa Vật lý',
              linkUrl: '/bo-mon/dia-vat-ly',
            },
          },
        ],
        cell7: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-hdktv',
              imageUrl: '',
              title: 'Hải dương - Khí tượng - Thủy văn',
              linkUrl: '/bo-mon/hai-duong-khi-tuong-thuy-van',
            },
          },
        ],
      },
    },

    { type: 'Spacer', props: { id: 'spacer-after-dept', height: 'lg' } },

    {
      type: 'Heading',
      props: {
        id: 'leadership-heading',
        text: 'Lãnh đạo',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'leadership-desc',
        content:
          'Đội ngũ nhiệt huyết, có nhiều kinh nghiệm giảng dạy. Phương châm giúp sinh viên nắm chắc kiến thức và ứng dụng kiến thức vào thực tiễn công việc.',
        fontSize: 'base',
        alignment: 'center',
        color: '#64748b',
      },
    },
    { type: 'Spacer', props: { id: 'spacer-before-leaders', height: 'sm' } },
    {
      type: 'Container',
      props: {
        id: 'leaders-wrapper',
        maxWidth: 'lg',
        padding: 'none',
        bgColor: '',
        centered: true,
        content: [
          {
            type: 'Grid',
            props: {
              id: 'leaders-grid',
              columns: '3',
              rows: '1',
              gap: 'lg',
              cell0: [
                {
                  type: 'ProfileCard',
                  props: {
                    id: 'leader-1',
                    imageUrl: '',
                    name: 'PGS. TS. HUỲNH VĂN TUẤN',
                    role: 'Trưởng Khoa',
                    description: '',
                    linkUrl: '#',
                  },
                },
              ],
              cell1: [
                {
                  type: 'ProfileCard',
                  props: {
                    id: 'leader-2',
                    imageUrl: '',
                    name: 'PGS.TS. TRẦN THIỆN THANH',
                    role: 'Phó Trưởng Khoa',
                    description: '',
                    linkUrl: '#',
                  },
                },
              ],
              cell2: [
                {
                  type: 'ProfileCard',
                  props: {
                    id: 'leader-3',
                    imageUrl: '',
                    name: 'TS. ĐẶNG HOÀI TRUNG',
                    role: 'Phó Trưởng Khoa',
                    description: '',
                    linkUrl: '#',
                  },
                },
              ],
            },
          },
          { type: 'Spacer', props: { id: 'spacer-leaders-btn', height: 'sm' } },
          {
            type: 'ButtonBlock',
            props: {
              id: 'leaders-more',
              label: 'Xem thêm →',
              url: '/doi-ngu',
              variant: 'outline',
              size: 'md',
              fullWidth: false,
              alignment: 'center',
            },
          },
        ],
      },
    },

    { type: 'Spacer', props: { id: 'spacer-after-leaders', height: 'lg' } },

    {
      type: 'LogoSlider',
      props: {
        id: 'partner-slider',
        logos: [
          {
            src: '',
            alt: 'Đại học Quốc Gia',
            linkUrl: 'https://vnuhcm.edu.vn',
          },
          {
            src: '',
            alt: 'Đại học Sài Gòn',
            linkUrl: 'https://sgu.edu.vn',
          },
          {
            src: '',
            alt: 'Đại học Cần Thơ',
            linkUrl: 'https://ctu.edu.vn',
          },
          {
            src: '',
            alt: 'Đại học Kinh Tế - Luật',
            linkUrl: 'https://uel.edu.vn',
          },
          {
            src: '',
            alt: 'Đại học Bách Khoa',
            linkUrl: 'https://hcmut.edu.vn',
          },
        ],
        bgImageUrl: '',
        title: 'Liên kết',
        description:
          'Giảng viên Khoa Vật lý - Vật lý Kỹ thuật tham gia hoạt động giảng dạy và nghiên cứu cùng nhiều trường Đại học uy tín và Viện, Trung tâm nghiên cứu trong và ngoài nước.',
        logoSize: '80',
      },
    },

    { type: 'Spacer', props: { id: 'spacer-after-partners', height: 'lg' } },

    {
      type: 'Heading',
      props: {
        id: 'contact-heading',
        text: 'Liên hệ',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    { type: 'Spacer', props: { id: 'spacer-before-contact', height: 'sm' } },
    {
      type: 'ContactInfo',
      props: {
        id: 'main-contact',
        address: '227 Nguyễn Văn Cừ, phường Chợ Quán, TP.HCM',
        phone: '+84 28 38355272',
        email: 'phys@hcmus.edu.vn',
        showIcons: true,
        color: '#475569',
        layout: 'inline',
        alignment: 'center',
      },
    },
    { type: 'Spacer', props: { id: 'spacer-contact-social', height: 'sm' } },
    {
      type: 'SocialIcons',
      props: {
        id: 'contact-social',
        icons: [
          {
            icon: 'facebook',
            url: 'https://facebook.com/khoavatly.hcmus',
            color: '#1877f2',
          },
        ],
        size: 'sm',
        gap: 'sm',
        alignment: 'center',
      },
    },

    { type: 'Spacer', props: { id: 'spacer-before-footer', height: 'md' } },

    {
      type: 'FooterBlock',
      props: {
        id: 'main-footer',
        bgColor: '#0c2340',
        textColor: '#94a3b8',
        content: [
          {
            type: 'Columns',
            props: {
              id: 'footer-cols',
              columns: '4',
              gap: 'lg',
              verticalAlign: 'top',
              col0: [
                {
                  type: 'ImageBlock',
                  props: {
                    id: 'footer-logo',
                    src: '/Logo_Phys-blue.png',
                    alt: 'Physics HCMUS',
                    caption: '',
                    fit: 'contain',
                    borderRadius: 'none',
                  },
                },
              ],
              col1: [
                {
                  type: 'Heading',
                  props: {
                    id: 'footer-h-dept',
                    text: 'Bộ Môn',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-dept-links',
                    links: [
                      { label: 'VẬT LÝ TIN HỌC', url: '#' },
                      { label: 'VẬT LÝ LÝ THUYẾT', url: '#' },
                      { label: 'VẬT LÝ HẠT NHÂN - KTHN - VLY/Y', url: '#' },
                      { label: 'VẬT LÝ CHẤT RẮN', url: '#' },
                      { label: 'VẬT LÝ ỨNG DỤNG', url: '#' },
                      { label: 'VẬT LÝ ĐIỆN TỬ', url: '#' },
                      { label: 'ĐỊA VẬT LÝ', url: '#' },
                      {
                        label: 'HẢI DƯƠNG - KHÍ TƯỢNG - THỦY VĂN',
                        url: '#',
                      },
                    ],
                    direction: 'vertical',
                    showArrow: false,
                    fontSize: 'sm',
                    color: '#94a3b8',
                  },
                },
              ],
              col2: [
                {
                  type: 'Heading',
                  props: {
                    id: 'footer-h-info',
                    text: 'Thông Tin',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-info-links',
                    links: [
                      { label: 'EMAIL', url: 'mailto:phys@hcmus.edu.vn' },
                      {
                        label: 'FANPAGE',
                        url: 'https://facebook.com/khoavatly.hcmus',
                      },
                      { label: 'LIÊN HỆ', url: '/lien-he' },
                      { label: 'LOGO', url: '/tai-logo' },
                    ],
                    direction: 'vertical',
                    showArrow: false,
                    fontSize: 'sm',
                    color: '#94a3b8',
                  },
                },
              ],
              col3: [
                {
                  type: 'Heading',
                  props: {
                    id: 'footer-h-dir',
                    text: 'Danh Mục',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-dir-links',
                    links: [
                      {
                        label: 'TRƯỜNG ĐH KHOA HỌC TỰ NHIÊN',
                        url: 'https://hcmus.edu.vn',
                      },
                      {
                        label: 'VNU HCMUS PORTAL',
                        url: 'https://portal.hcmus.edu.vn',
                      },
                      { label: 'BIỂU MẪU', url: '/bieu-mau' },
                    ],
                    direction: 'vertical',
                    showArrow: false,
                    fontSize: 'sm',
                    color: '#94a3b8',
                  },
                },
              ],
            },
          },
          {
            type: 'Divider',
            props: {
              id: 'footer-divider',
              style: 'solid',
              color: '#1e3a5f',
              thickness: 'thin',
            },
          },
          {
            type: 'TextBlock',
            props: {
              id: 'copyright',
              content:
                'Bản quyền © 2026 Khoa Vật Lý - Vật Lý Kỹ Thuật.',
              fontSize: 'sm',
              alignment: 'center',
              color: '#64748b',
            },
          },
        ],
      },
    },
  ],
};

const main = async () => {
  const existing = await prisma.pageLayout.findUnique({
    where: { slug: 'trang-chu' },
  });

  if (existing) {
    await prisma.pageLayout.update({
      where: { slug: 'trang-chu' },
      data: { puckData: HOMEPAGE_PUCK_DATA as any },
    });
    console.log('Homepage layout updated with Puck data');
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  if (!admin) {
    console.log('No SuperAdmin user found, skipping homepage seed');
    return;
  }

  await prisma.pageLayout.create({
    data: {
      name: 'Trang chủ',
      slug: 'trang-chu',
      description: 'Trang chủ Khoa Vật lý - Vật lý Kỹ thuật',
      puckData: HOMEPAGE_PUCK_DATA as any,
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
  });

  console.log('Homepage layout created with Puck data');
};

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
