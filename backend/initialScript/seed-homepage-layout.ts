import envConfig from 'src/shared/config/config';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const PHYS_BASE = 'https://phys.hcmus.edu.vn/uploads';
const PHYS_IMAGES = {
  logo: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/1.LOGO_m%E1%BB%9Bi/Logo_Phys-blue.png`,
  hero: {
    asiin: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/HUY116.jpg`,
    admissions2026: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/Banner_1_web.png`,
    top550: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/Banner_2.png`,
    asiinBanner: `${PHYS_BASE}/khoa-vat-ly/Tran_Thi_Bao_Ngoc/Banner_web_khoa/Banner_tuyen_sinh_2025_(1).png`,
  },
  edu: {
    courseRegistration: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_GI%C3%81O_V%E1%BB%A4/TH%C3%94NG_B%C3%81O_tkb.png`,
    graduationScholarship: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_GI%C3%81O_V%E1%BB%A4/HB_LTN.png`,
    graduationCeremony: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/TB_LE_TOT_NGHIEP_CAP_KHOA_25.png`,
    top5Students: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/3DAYS_LEFT_%282%29.png`,
    scholarship: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/h%E1%BB%8Dc_b%E1%BB%95ng.jpg`,
  },
  sci: {
    mamm2026: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/MAMM26.jpg`,
    vff20: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/VFF2.0.jpg`,
    ndtSeminar: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/Seminar_NDT_t%E1%BA%A1i_TTA.png`,
    polandProgram: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/Ba_Lan.jpg`,
    quantumWorkshop: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/IMG_3030.JPG`,
  },
  jobs: {
    synopsys: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_TUY%E1%BB%82N_D%E1%BB%A4NG/Synopsys_dcp.jpg`,
    estec: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_TUY%E1%BB%82N_D%E1%BB%A4NG/Etec_logo.jpeg`,
    bosh: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_TUY%E1%BB%82N_D%E1%BB%A4NG/bosh.jpg`,
    tmaK51: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_TUY%E1%BB%82N_D%E1%BB%A4NG/TMA_K51.jpg`,
    renesas: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/TIN_TUY%E1%BB%82N_D%E1%BB%A4NG/Renesas_campus_ambassador.png`,
  },
  dept: {
    computerPhysics: `${PHYS_BASE}/vat-ly-tin-hoc/ava_tinhoc.png`,
    theoretical: `${PHYS_BASE}/vat-ly-ly-thuyet/ava_lithuyet.png`,
    nuclear: `${PHYS_BASE}/vat-ly-hat-nhan/bmvlhn.jpg`,
    solidState: `${PHYS_BASE}/vat-ly-chat-ran/ava_chatran.png`,
    applied: `${PHYS_BASE}/vat-ly-ung-dung/ava_ungdung.png`,
    electronics: `${PHYS_BASE}/vat-ly-dien-tu/ava_dientu.png`,
    geophysics: `${PHYS_BASE}/vat-ly-dia-cau/Hinh%20anh/1_teBtR_0pirBnX4nURoMvLA.jpeg`,
    oceanography: `${PHYS_BASE}/vat-ly-hai-duong/ava_haiduong.png`,
  },
  leaders: {
    hvTuan: `${PHYS_BASE}/khoa-vat-ly/Nh%C3%A2n%20s%E1%BB%B1/CB%20quan%20ly/HVTuan1.jpg`,
    ttThanh: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/Tran_Thien_Thanh.jpg`,
    dhTrung: `${PHYS_BASE}/khoa-vat-ly/TUI_LA_NGU/DHTrung.png`,
  },
  partners: {
    vnuHcm: `${PHYS_BASE}/khoa-vat-ly/Logo_DHQG.png`,
    saigon: `${PHYS_BASE}/khoa-vat-ly/Logo%20Li%C3%AAn%20k%E1%BA%BFt/logo_SaiGon_danen.png`,
    canTho: `${PHYS_BASE}/khoa-vat-ly/logo_DHCT.png`,
    economicsLaw: `${PHYS_BASE}/khoa-vat-ly/Logo_%C4%90%E1%BA%A1i_h%E1%BB%8Dc_Kinh_T%E1%BA%BF_-_Lu%E1%BA%ADt.png`,
    polytechnic: `${PHYS_BASE}/khoa-vat-ly/logo_DHBK.png`,
    dalat: `${PHYS_BASE}/khoa-vat-ly/logo_DHDL.png`,
  },
};

const HOMEPAGE_PUCK_DATA = {
  root: {},
  content: [
    {
      type: 'Navbar',
      props: {
        id: 'main-navbar',
        logoSrc: PHYS_IMAGES.logo,
        logoAlt: 'Khoa Vật lý - Vật lý Kỹ thuật',
        menuItems: [
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
            src: PHYS_IMAGES.hero.asiin,
            alt: 'Khoa Vật lý - Vật lý Kỹ thuật',
            caption: 'Chào mừng đến với Khoa Vật lý - Vật lý Kỹ thuật',
            linkUrl: '/gioi-thieu',
          },
          {
            src: PHYS_IMAGES.hero.admissions2026,
            alt: 'Tuyển sinh 2026',
            caption: 'Tuyển sinh Đại học năm 2026',
            linkUrl: '/tuyen-sinh',
          },
          {
            src: PHYS_IMAGES.hero.top550,
            alt: 'Nghiên cứu khoa học',
            caption: 'Nghiên cứu khoa học đỉnh cao',
            linkUrl: '/nghien-cuu',
          },
          {
            src: PHYS_IMAGES.hero.asiinBanner,
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
                    imageUrl: PHYS_IMAGES.edu.courseRegistration,
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
                    imageUrl: PHYS_IMAGES.edu.graduationScholarship,
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
                    imageUrl: PHYS_IMAGES.edu.graduationCeremony,
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
                    imageUrl: PHYS_IMAGES.edu.top5Students,
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
                    imageUrl: PHYS_IMAGES.edu.scholarship,
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
                    imageUrl: PHYS_IMAGES.sci.mamm2026,
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
                    imageUrl: PHYS_IMAGES.sci.vff20,
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
                    imageUrl: PHYS_IMAGES.sci.ndtSeminar,
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
                    imageUrl: PHYS_IMAGES.sci.polandProgram,
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
                    imageUrl: PHYS_IMAGES.sci.quantumWorkshop,
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
                    imageUrl: PHYS_IMAGES.jobs.synopsys,
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
                    imageUrl: PHYS_IMAGES.jobs.estec,
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
                    imageUrl: PHYS_IMAGES.jobs.bosh,
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
                    imageUrl: PHYS_IMAGES.jobs.tmaK51,
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
                    imageUrl: PHYS_IMAGES.jobs.renesas,
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
              imageUrl: PHYS_IMAGES.dept.computerPhysics,
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
              imageUrl: PHYS_IMAGES.dept.theoretical,
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
              imageUrl: PHYS_IMAGES.dept.nuclear,
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
              imageUrl: PHYS_IMAGES.dept.solidState,
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
              imageUrl: PHYS_IMAGES.dept.applied,
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
              imageUrl: PHYS_IMAGES.dept.electronics,
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
              imageUrl: PHYS_IMAGES.dept.geophysics,
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
              imageUrl: PHYS_IMAGES.dept.oceanography,
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
                    imageUrl: PHYS_IMAGES.leaders.hvTuan,
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
                    imageUrl: PHYS_IMAGES.leaders.ttThanh,
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
                    imageUrl: PHYS_IMAGES.leaders.dhTrung,
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
            src: PHYS_IMAGES.partners.vnuHcm,
            alt: 'Đại học Quốc Gia',
            linkUrl: 'https://vnuhcm.edu.vn',
          },
          {
            src: PHYS_IMAGES.partners.saigon,
            alt: 'Đại học Sài Gòn',
            linkUrl: 'https://sgu.edu.vn',
          },
          {
            src: PHYS_IMAGES.partners.canTho,
            alt: 'Đại học Cần Thơ',
            linkUrl: 'https://ctu.edu.vn',
          },
          {
            src: PHYS_IMAGES.partners.economicsLaw,
            alt: 'Đại học Kinh Tế - Luật',
            linkUrl: 'https://uel.edu.vn',
          },
          {
            src: PHYS_IMAGES.partners.polytechnic,
            alt: 'Đại học Bách Khoa',
            linkUrl: 'https://hcmut.edu.vn',
          },
        ],
        bgImageUrl: PHYS_IMAGES.hero.asiin,
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
                    src: PHYS_IMAGES.logo,
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

const NEW_HOMEPAGE_PUCK_DATA = {
  root: {},
  content: [
    {
      type: 'Navbar',
      props: {
        id: 'new-navbar',
        logoSrc: PHYS_IMAGES.logo,
        logoAlt: 'Khoa Vật lý - Vật lý Kỹ thuật',
        menuItems: [
          { label: 'Giới thiệu', url: '#gioi-thieu', children: '' },
          { label: 'Đội ngũ', url: '#doi-ngu', children: '' },
          { label: 'Đào tạo', url: '#dao-tao', children: '' },
          { label: 'Nghiên cứu', url: '#nghien-cuu', children: '' },
          { label: 'Hoạt động', url: '#hoat-dong', children: '' },
          { label: 'Liên hệ', url: '#lien-he', children: '' },
        ],
        bgColor: '#ffffff',
        textColor: '#1e293b',
        showSearch: true,
        searchPlaceholder: 'Nhập từ khóa...',
        searchSuggestions: [
          { label: 'Tuyển sinh 2026', url: '/tuyen-sinh' },
          { label: 'Chương trình đào tạo', url: '/dao-tao' },
          { label: 'Học bổng', url: '/hoc-bong' },
          { label: 'Nghiên cứu khoa học', url: '/nghien-cuu' },
          { label: 'Lịch học', url: '/lich-hoc' },
          { label: 'Liên hệ', url: '/lien-he' },
        ],
      },
    },

    {
      type: 'HeroFullScreen',
      props: {
        id: 'new-hero',
        slides: [
          {
            src: PHYS_IMAGES.hero.admissions2026,
            alt: 'Tuyển sinh Khoa Vật lý',
            headline: '',
            subtitle: '',
            ctaLabel: '',
            ctaUrl: '',
          },
          {
            src: PHYS_IMAGES.hero.asiin,
            alt: 'Đội ngũ Khoa Vật lý',
            headline: 'Khoa Vật lý - Vật lý Kỹ thuật',
            subtitle: 'Đại học Khoa học Tự nhiên - ĐHQG TP.HCM',
            ctaLabel: 'Tìm hiểu thêm',
            ctaUrl: '/gioi-thieu',
          },
          {
            src: PHYS_IMAGES.hero.asiinBanner,
            alt: 'Kiểm định ASIIN',
            headline: '',
            subtitle: '',
            ctaLabel: '',
            ctaUrl: '',
          },
          {
            src: PHYS_IMAGES.edu.scholarship,
            alt: 'Sinh viên Khoa Vật lý',
            headline: 'Đời sống Sinh viên',
            subtitle: 'Trải nghiệm tuổi trẻ đầy ý nghĩa cùng Khoa Vật lý',
            ctaLabel: 'Khám phá',
            ctaUrl: '/sinh-vien',
          },
          {
            src: PHYS_IMAGES.hero.top550,
            alt: 'Xếp hạng và Kiểm định',
            headline: '',
            subtitle: '',
            ctaLabel: '',
            ctaUrl: '',
          },
          {
            src: PHYS_IMAGES.sci.quantumWorkshop,
            alt: 'Cộng đồng Khoa Vật lý',
            headline: 'Cộng đồng Gắn kết',
            subtitle: 'Nơi hội tụ đam mê khoa học và tinh thần đoàn kết',
            ctaLabel: 'Tham gia',
            ctaUrl: '/cong-dong',
          },
        ],
        tagline: 'KHÁM PHÁ • SÁNG TẠO • CỐNG HIẾN',
        taglineColor: '#ffffff',
        overlayOpacity: 'medium',
        height: 'full',
        showScrollIndicator: true,
      },
    },

    {
      type: 'PersonaSelector',
      props: {
        id: 'new-persona',
        personas: [
          { label: 'Sinh viên', icon: 'school', description: 'Thông tin học vụ, lịch thi, biểu mẫu', linkUrl: '/sinh-vien' },
          { label: 'Giảng viên', icon: 'person', description: 'Nghiên cứu, giảng dạy, quản lý', linkUrl: '/giang-vien' },
          { label: 'Tuyển sinh', icon: 'campaign', description: 'Chương trình, xét tuyển, học bổng', linkUrl: '/tuyen-sinh' },
          { label: 'Nghiên cứu sinh', icon: 'science', description: 'Đề tài, hướng dẫn, hội thảo', linkUrl: '/nghien-cuu-sinh' },
          { label: 'Phụ huynh', icon: 'family_restroom', description: 'Chương trình đào tạo, cơ sở vật chất', linkUrl: '/phu-huynh' },
          { label: 'Cựu sinh viên', icon: 'groups', description: 'Kết nối, sự kiện, đóng góp', linkUrl: '/cuu-sinh-vien' },
          { label: 'Đối tác', icon: 'handshake', description: 'Hợp tác, tài trợ, dự án', linkUrl: '/doi-tac' },
          { label: 'Nhà tuyển dụng', icon: 'work', description: 'Tuyển dụng, thực tập, liên hệ', linkUrl: '/nha-tuyen-dung' },
        ],
        bgColor: '#ffffff',
      },
    },

    {
      type: 'StatsCounter',
      props: {
        id: 'new-stats',
        stats: [
          { value: 50, suffix: '+', label: 'Năm thành lập' },
          { value: 120, suffix: '+', label: 'Giảng viên & NCS' },
          { value: 3000, suffix: '+', label: 'Sinh viên' },
          { value: 500, suffix: '+', label: 'Công bố quốc tế' },
        ],
        bgColor: '#f8fafc',
      },
    },

    {
      type: 'Container',
      props: {
        id: 'news-section',
        maxWidth: 'xl',
        padding: 'lg',
        bgColor: '',
        centered: true,
        content: [
          {
            type: 'Heading',
            props: {
              id: 'news-title',
              anchorId: 'gioi-thieu',
              text: 'Tin tức & Sự kiện',
              level: 'h2',
              alignment: 'left',
              color: '#1e293b',
            },
          },
          { type: 'Spacer', props: { id: 'news-spacer-1', height: 'sm' } },
          {
            type: 'Grid',
            props: {
              id: 'news-grid',
              columns: '3',
              rows: '1',
              gap: 'md',
              cell0: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-1',
                    imageUrl: PHYS_IMAGES.sci.mamm2026,
                    title: 'Hội thảo quốc tế về Vật lý Chất rắn và Khoa học Vật liệu 2026',
                    excerpt: 'Khoa Vật lý phối hợp tổ chức hội thảo quốc tế thu hút hơn 200 nhà khoa học từ 15 quốc gia.',
                    date: '24/03/2026',
                    linkUrl: '#',
                    size: 'lg',
                  },
                },
              ],
              cell1: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-2',
                    imageUrl: PHYS_IMAGES.sci.quantumWorkshop,
                    title: 'Sinh viên Khoa Vật lý đạt giải nhất Olympic Vật lý toàn quốc',
                    excerpt: 'Đội tuyển Olympic Vật lý HCMUS giành 3 huy chương vàng.',
                    date: '18/03/2026',
                    linkUrl: '#',
                    size: 'lg',
                  },
                },
              ],
              cell2: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-3',
                    imageUrl: PHYS_IMAGES.sci.polandProgram,
                    title: 'Chương trình trao đổi sinh viên với ĐH Tokyo 2026',
                    excerpt: 'Cơ hội học tập và nghiên cứu tại Nhật Bản trong 1 học kỳ.',
                    date: '10/03/2026',
                    linkUrl: '#',
                    size: 'lg',
                  },
                },
              ],
            },
          },
          { type: 'Spacer', props: { id: 'news-spacer-2', height: 'sm' } },
          {
            type: 'Grid',
            props: {
              id: 'news-grid-2',
              columns: '4',
              rows: '1',
              gap: 'md',
              cell0: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-4',
                    imageUrl: PHYS_IMAGES.edu.courseRegistration,
                    title: 'Thông báo đăng ký học phần HK2 năm 2025-2026',
                    date: '04/02/2026',
                    linkUrl: '#',
                    excerpt: '',
                    size: 'md',
                  },
                },
              ],
              cell1: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-5',
                    imageUrl: PHYS_IMAGES.sci.ndtSeminar,
                    title: 'Tuyển sinh đi học tại Liên bang Nga năm 2026',
                    date: '17/02/2026',
                    linkUrl: '#',
                    excerpt: '',
                    size: 'md',
                  },
                },
              ],
              cell2: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-6',
                    imageUrl: PHYS_IMAGES.jobs.synopsys,
                    title: 'Discover Synopsys - Chương trình thực tập quốc tế',
                    date: '25/03/2026',
                    linkUrl: '#',
                    excerpt: '',
                    size: 'md',
                  },
                },
              ],
              cell3: [
                {
                  type: 'NewsOverlayCard',
                  props: {
                    id: 'news-7',
                    imageUrl: PHYS_IMAGES.edu.graduationScholarship,
                    title: 'Kết quả xét duyệt học bổng tốt nghiệp 2025',
                    date: '18/12/2025',
                    linkUrl: '#',
                    excerpt: '',
                    size: 'md',
                  },
                },
              ],
            },
          },
          { type: 'Spacer', props: { id: 'news-spacer-3', height: 'sm' } },
          {
            type: 'ButtonBlock',
            props: {
              id: 'news-more-btn',
              label: 'Xem tất cả tin tức',
              url: '/tin-tuc',
              variant: 'outline',
              size: 'md',
              fullWidth: false,
              alignment: 'center',
            },
          },
        ],
      },
    },

    {
      type: 'Heading',
      props: {
        id: 'dept-heading-new',
        anchorId: 'dao-tao',
        text: 'Các Bộ môn',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'dept-desc-new',
        content: '8 bộ môn chuyên ngành, đào tạo từ cử nhân đến tiến sĩ',
        fontSize: 'base',
        alignment: 'center',
        color: '#64748b',
      },
    },
    { type: 'Spacer', props: { id: 'dept-spacer-new', height: 'sm' } },
    {
      type: 'Grid',
      props: {
        id: 'dept-grid-new',
        columns: '4',
        rows: '2',
        gap: 'md',
        cell0: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vlth',
              imageUrl: PHYS_IMAGES.dept.computerPhysics,
              title: 'Vật lý Tin học',
              linkUrl: '/bo-mon/vat-ly-tin-hoc',
            },
          },
        ],
        cell1: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vllt',
              imageUrl: PHYS_IMAGES.dept.theoretical,
              title: 'Vật lý Lý thuyết',
              linkUrl: '/bo-mon/vat-ly-ly-thuyet',
            },
          },
        ],
        cell2: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vlhn',
              imageUrl: PHYS_IMAGES.dept.nuclear,
              title: 'Vật lý Hạt nhân',
              linkUrl: '/bo-mon/vat-ly-hat-nhan',
            },
          },
        ],
        cell3: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vlcr',
              imageUrl: PHYS_IMAGES.dept.solidState,
              title: 'Vật lý Chất Rắn',
              linkUrl: '/bo-mon/vat-ly-chat-ran',
            },
          },
        ],
        cell4: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vlud',
              imageUrl: PHYS_IMAGES.dept.applied,
              title: 'Vật lý Ứng Dụng',
              linkUrl: '/bo-mon/vat-ly-ung-dung',
            },
          },
        ],
        cell5: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-vldt',
              imageUrl: PHYS_IMAGES.dept.electronics,
              title: 'Vật lý Điện Tử',
              linkUrl: '/bo-mon/vat-ly-dien-tu',
            },
          },
        ],
        cell6: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-dvl',
              imageUrl: PHYS_IMAGES.dept.geophysics,
              title: 'Địa Vật lý',
              linkUrl: '/bo-mon/dia-vat-ly',
            },
          },
        ],
        cell7: [
          {
            type: 'DepartmentCard',
            props: {
              id: 'dept-n-hdktv',
              imageUrl: PHYS_IMAGES.dept.oceanography,
              title: 'Hải dương - Khí tượng - Thủy văn',
              linkUrl: '/bo-mon/hai-duong',
            },
          },
        ],
      },
    },

    { type: 'Spacer', props: { id: 'spacer-leaders-new', height: 'lg' } },

    {
      type: 'Heading',
      props: {
        id: 'leaders-heading-new',
        anchorId: 'doi-ngu',
        text: 'Lãnh đạo Khoa',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'leaders-desc-new',
        content: 'Đội ngũ lãnh đạo giàu kinh nghiệm, tận tâm với sự nghiệp giáo dục và nghiên cứu khoa học.',
        fontSize: 'base',
        alignment: 'center',
        color: '#64748b',
      },
    },
    { type: 'Spacer', props: { id: 'leaders-sp-new', height: 'sm' } },
    {
      type: 'Container',
      props: {
        id: 'leaders-container-new',
        maxWidth: 'lg',
        padding: 'none',
        bgColor: '',
        centered: true,
        content: [
          {
            type: 'Grid',
            props: {
              id: 'leaders-grid-new',
              columns: '3',
              rows: '1',
              gap: 'lg',
              cell0: [
                {
                  type: 'ProfileCard',
                  props: {
                    id: 'leader-n-1',
                    imageUrl: PHYS_IMAGES.leaders.hvTuan,
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
                    id: 'leader-n-2',
                    imageUrl: PHYS_IMAGES.leaders.ttThanh,
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
                    id: 'leader-n-3',
                    imageUrl: PHYS_IMAGES.leaders.dhTrung,
                    name: 'TS. ĐẶNG HOÀI TRUNG',
                    role: 'Phó Trưởng Khoa',
                    description: '',
                    linkUrl: '#',
                  },
                },
              ],
            },
          },
          { type: 'Spacer', props: { id: 'leaders-btn-sp-new', height: 'sm' } },
          {
            type: 'ButtonBlock',
            props: {
              id: 'leaders-btn-new',
              label: 'Xem toàn bộ đội ngũ',
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

    { type: 'Spacer', props: { id: 'spacer-events-new', height: 'lg' } },

    {
      type: 'Container',
      props: {
        id: 'events-section-new',
        maxWidth: 'xl',
        padding: 'md',
        bgColor: '#f8fafc',
        centered: true,
        content: [
          {
            type: 'Columns',
            props: {
              id: 'events-cols-new',
              columns: '2',
              gap: 'lg',
              verticalAlign: 'top',
              col0: [
                {
                  type: 'Heading',
                  props: {
                    id: 'events-heading-new',
                    anchorId: 'nghien-cuu',
                    text: 'Sự kiện sắp tới',
                    level: 'h2',
                    alignment: 'left',
                    color: '#1e293b',
                  },
                },
                {
                  type: 'EventCard',
                  props: {
                    id: 'event-1',
                    title: 'Hội thảo Quốc tế về Vật lý Lý thuyết 2026',
                    date: '15/04',
                    time: '08:00 - 17:00',
                    location: 'Hội trường Khoa Vật lý',
                    linkUrl: '#',
                    accentColor: '#1e40af',
                  },
                },
                {
                  type: 'EventCard',
                  props: {
                    id: 'event-2',
                    title: 'Seminar: Ứng dụng AI trong Vật lý Chất rắn',
                    date: '20/04',
                    time: '14:00 - 16:00',
                    location: 'Phòng F102',
                    linkUrl: '#',
                    accentColor: '#1e40af',
                  },
                },
                {
                  type: 'EventCard',
                  props: {
                    id: 'event-3',
                    title: 'Ngày hội Tuyển sinh 2026',
                    date: '25/04',
                    time: '08:00 - 12:00',
                    location: 'Sảnh chính Trường ĐH KHTN',
                    linkUrl: '#',
                    accentColor: '#1e40af',
                  },
                },
                { type: 'Spacer', props: { id: 'events-sp-new', height: 'sm' } },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'events-btn-new',
                    label: 'Xem lịch sự kiện',
                    url: '/su-kien',
                    variant: 'outline',
                    size: 'sm',
                    fullWidth: false,
                    alignment: 'left',
                  },
                },
              ],
              col1: [
                {
                  type: 'Heading',
                  props: {
                    id: 'video-heading-new',
                    anchorId: 'hoat-dong',
                    text: 'Video nổi bật',
                    level: 'h2',
                    alignment: 'left',
                    color: '#1e293b',
                  },
                },
                {
                  type: 'VideoEmbed',
                  props: {
                    id: 'video-new-1',
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    title: 'Giới thiệu Khoa Vật lý - Vật lý Kỹ thuật',
                    aspectRatio: '16:9',
                  },
                },
                { type: 'Spacer', props: { id: 'video-sp-new', height: 'sm' } },
                {
                  type: 'VideoEmbed',
                  props: {
                    id: 'video-new-2',
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    title: 'Giới thiệu ngành Vật lý',
                    aspectRatio: '16:9',
                  },
                },
              ],
              col2: [],
              col3: [],
            },
          },
        ],
      },
    },

    { type: 'Spacer', props: { id: 'spacer-partners-new', height: 'lg' } },

    {
      type: 'LogoSlider',
      props: {
        id: 'partners-new',
        logos: [
          { src: PHYS_IMAGES.partners.vnuHcm, alt: 'ĐH Quốc Gia', linkUrl: 'https://vnuhcm.edu.vn' },
          { src: PHYS_IMAGES.partners.saigon, alt: 'ĐH Sài Gòn', linkUrl: 'https://sgu.edu.vn' },
          { src: PHYS_IMAGES.partners.canTho, alt: 'ĐH Cần Thơ', linkUrl: 'https://ctu.edu.vn' },
          { src: PHYS_IMAGES.partners.economicsLaw, alt: 'ĐH Kinh tế - Luật', linkUrl: 'https://uel.edu.vn' },
          { src: PHYS_IMAGES.partners.polytechnic, alt: 'ĐH Bách Khoa', linkUrl: 'https://hcmut.edu.vn' },
        ],
        bgImageUrl: PHYS_IMAGES.hero.asiin,
        title: 'Đối tác & Liên kết',
        description: 'Giảng viên Khoa Vật lý - Vật lý Kỹ thuật tham gia hoạt động giảng dạy và nghiên cứu cùng nhiều trường Đại học uy tín và Viện, Trung tâm nghiên cứu trong và ngoài nước.',
        logoSize: '80',
      },
    },

    { type: 'Spacer', props: { id: 'spacer-contact-new', height: 'lg' } },

    {
      type: 'Heading',
      props: {
        id: 'contact-heading-new',
        anchorId: 'lien-he',
        text: 'Liên hệ',
        level: 'h2',
        alignment: 'center',
        color: '#1e293b',
      },
    },
    { type: 'Spacer', props: { id: 'contact-sp-1-new', height: 'sm' } },
    {
      type: 'ContactInfo',
      props: {
        id: 'contact-new',
        address: '227 Nguyễn Văn Cừ, phường Chợ Quán, TP.HCM',
        phone: '+84 28 38355272',
        email: 'phys@hcmus.edu.vn',
        showIcons: true,
        color: '#475569',
        layout: 'inline',
        alignment: 'center',
      },
    },
    { type: 'Spacer', props: { id: 'contact-sp-2-new', height: 'sm' } },
    {
      type: 'SocialIcons',
      props: {
        id: 'social-new',
        icons: [
          { icon: 'facebook', url: 'https://facebook.com/khoavatly.hcmus', color: '#1877f2' },
          { icon: 'youtube', url: '#', color: '#ff0000' },
        ],
        size: 'md',
        gap: 'md',
        alignment: 'center',
      },
    },

    { type: 'Spacer', props: { id: 'spacer-footer-new', height: 'md' } },

    {
      type: 'FooterBlock',
      props: {
        id: 'footer-new',
        bgColor: '#0c2340',
        textColor: '#94a3b8',
        content: [
          {
            type: 'Columns',
            props: {
              id: 'footer-cols-new',
              columns: '4',
              gap: 'lg',
              verticalAlign: 'top',
              col0: [
                {
                  type: 'ImageBlock',
                  props: {
                    id: 'footer-logo-new',
                    src: PHYS_IMAGES.logo,
                    alt: 'Physics HCMUS',
                    caption: '',
                    fit: 'contain',
                    borderRadius: 'none',
                  },
                },
                {
                  type: 'TextBlock',
                  props: {
                    id: 'footer-addr-new',
                    content: '227 Nguyễn Văn Cừ, P. Chợ Quán, Q.5, TP.HCM\nĐiện thoại: +84 28 38355272\nEmail: phys@hcmus.edu.vn',
                    fontSize: 'sm',
                    alignment: 'left',
                    color: '#94a3b8',
                  },
                },
              ],
              col1: [
                {
                  type: 'Heading',
                  props: {
                    id: 'footer-h-dept-new',
                    text: 'Bộ Môn',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-dept-links-new',
                    links: [
                      { label: 'Vật lý Tin học', url: '#' },
                      { label: 'Vật lý Lý thuyết', url: '#' },
                      { label: 'Vật lý Hạt nhân', url: '#' },
                      { label: 'Vật lý Chất Rắn', url: '#' },
                      { label: 'Vật lý Ứng Dụng', url: '#' },
                      { label: 'Vật lý Điện Tử', url: '#' },
                      { label: 'Địa Vật lý', url: '#' },
                      { label: 'Hải dương - Khí tượng', url: '#' },
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
                    id: 'footer-h-info-new',
                    text: 'Thông Tin',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-info-links-new',
                    links: [
                      { label: 'Giới thiệu', url: '/gioi-thieu' },
                      { label: 'Tuyển sinh', url: '/tuyen-sinh' },
                      { label: 'Nghiên cứu', url: '/nghien-cuu' },
                      { label: 'Liên hệ', url: '/lien-he' },
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
                    id: 'footer-h-link-new',
                    text: 'Liên Kết',
                    level: 'h5',
                    alignment: 'left',
                    color: '#ffffff',
                  },
                },
                {
                  type: 'NavLinks',
                  props: {
                    id: 'footer-ext-links-new',
                    links: [
                      { label: 'Trường ĐH KHTN', url: 'https://hcmus.edu.vn' },
                      { label: 'ĐHQG TP.HCM', url: 'https://vnuhcm.edu.vn' },
                      { label: 'Portal HCMUS', url: 'https://portal.hcmus.edu.vn' },
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
              id: 'footer-divider-new',
              style: 'solid',
              color: '#1e3a5f',
              thickness: 'thin',
            },
          },
          {
            type: 'TextBlock',
            props: {
              id: 'copyright-new',
              content: 'Bản quyền © 2026 Khoa Vật Lý - Vật Lý Kỹ Thuật, Trường ĐH Khoa học Tự nhiên - ĐHQG TP.HCM.',
              fontSize: 'sm',
              alignment: 'center',
              color: '#64748b',
            },
          },
        ],
      },
    },

    {
      type: 'ChatButton',
      props: {
        id: 'new-chat-btn',
        tooltipText: 'Hỏi đáp với AI',
        bgColor: '#1d4ed8',
        iconColor: '#ffffff',
        title: 'Trợ lý AI',
        subtitle: 'Hỏi đáp về Khoa Vật lý',
        welcomeMessage:
          'Xin chào! Tôi là trợ lý ảo của Khoa Vật lý - Vật lý Kỹ thuật. Bạn cần hỗ trợ thông tin gì?',
        placeholder: 'Nhập câu hỏi của bạn...',
      },
    },
  ],
};

const main = async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  if (!admin) {
    console.log('No SuperAdmin user found, skipping homepage seed');
    return;
  }

  const existingOld = await prisma.pageLayout.findUnique({
    where: { slug: 'trang-chu' },
  });
  if (existingOld) {
    await prisma.pageLayout.update({
      where: { slug: 'trang-chu' },
      data: { puckData: HOMEPAGE_PUCK_DATA as any },
    });
    console.log('Old homepage layout updated');
  } else {
    await prisma.pageLayout.create({
      data: {
        name: 'Trang chủ',
        slug: 'trang-chu',
        description: 'Trang chủ Khoa Vật lý - Vật lý Kỹ thuật (phiên bản cũ)',
        puckData: HOMEPAGE_PUCK_DATA as any,
        isPublished: false,
        createdBy: admin.id,
      },
    });
    console.log('Old homepage layout created');
  }

  const existingNew = await prisma.pageLayout.findUnique({
    where: { slug: 'trang-chu-moi' },
  });
  if (existingNew) {
    await prisma.pageLayout.update({
      where: { slug: 'trang-chu-moi' },
      data: { puckData: NEW_HOMEPAGE_PUCK_DATA as any },
    });
    console.log('New homepage layout updated');
  } else {
    await prisma.pageLayout.create({
      data: {
        name: 'New Homepage',
        slug: 'trang-chu-moi',
        description: 'Trang chủ mới - layout quốc tế, full-screen hero, search bar, animations',
        puckData: NEW_HOMEPAGE_PUCK_DATA as any,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });
    console.log('New homepage layout created');
  }
};

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
