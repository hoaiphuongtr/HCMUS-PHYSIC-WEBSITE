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
          { label: 'Sinh viên', url: '/sinh-vien' },
          { label: 'Giảng viên', url: '/giang-vien' },
          { label: 'Tuyển sinh 2026', url: '/tuyen-sinh' },
          { label: 'Nghiên cứu sinh', url: '/nghien-cuu-sinh' },
          { label: 'Chương trình đào tạo', url: '/dao-tao' },
          { label: 'Học bổng', url: '/hoc-bong' },
          { label: 'Cựu sinh viên', url: '/cuu-sinh-vien' },
          { label: 'Nhà tuyển dụng', url: '/nha-tuyen-dung' },
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
      type: 'ImageTextBlock',
      props: {
        id: 'about-block',
        imageUrl: PHYS_IMAGES.hero.asiin,
        imageAlt: 'Khoa Vật lý - Vật lý Kỹ thuật HCMUS',
        imagePosition: 'left',
        fullBleed: true,
        headline: 'Khoa Vật lý - Vật lý Kỹ thuật',
        body: 'Là một trong những khoa lâu đời nhất tại Đại học Khoa học Tự nhiên - ĐHQG TP.HCM, Khoa Vật lý - Vật lý Kỹ thuật đào tạo nguồn nhân lực chất lượng cao trong lĩnh vực vật lý và công nghệ, với 5 ngành đạt kiểm định quốc tế ASIIN theo chuẩn châu Âu.',
        stats: [
          { value: '50+', label: 'Năm thành lập' },
          { value: '120+', label: 'Giảng viên & NCS' },
          { value: '3000+', label: 'Sinh viên' },
          { value: '500+', label: 'Công bố quốc tế' },
        ],
        ctaLabel: 'Tìm hiểu thêm',
        ctaUrl: '/gioi-thieu',
        bgColor: '',
      },
    },

    {
      type: 'ImageTextBlock',
      props: {
        id: 'research-block',
        imageUrl: PHYS_IMAGES.sci.quantumWorkshop,
        imageAlt: 'Nghiên cứu khoa học tại Khoa Vật lý',
        imagePosition: 'right',
        fullBleed: true,
        headline: 'Nghiên cứu Đẳng cấp Quốc tế',
        body: 'Đội ngũ giảng viên và nghiên cứu sinh liên tục công bố trên các tạp chí khoa học uy tín quốc tế. Ngành Vật lý và Không gian của HCMUS thuộc Top 550 thế giới theo xếp hạng QS World University Rankings.',
        stats: [
          { value: 'Top 550', label: 'Thế giới (QS Ranking)' },
          { value: '5', label: 'Ngành đạt ASIIN' },
        ],
        ctaLabel: 'Xem nghiên cứu',
        ctaUrl: '/nghien-cuu',
        bgColor: '#f8fafc',
      },
    },

    {
      type: 'Container',
      props: {
        id: 'news-events-section',
        anchorId: 'hoat-dong',
        maxWidth: 'xl',
        padding: 'lg',
        bgColor: '#f8fafc',
        centered: true,
        content: [
          {
            type: 'Columns',
            props: {
              id: 'news-events-cols',
              columns: '2',
              gap: 'lg',
              verticalAlign: 'top',
              col0: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'news-header',
                    title: 'TIN TỨC',
                    linkText: 'Xem thêm',
                    linkUrl: '/tin-tuc',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'n-news-1',
                    imageUrl: PHYS_IMAGES.sci.mamm2026,
                    title: 'Hội thảo quốc tế MAMM 2026 về Vật lý Chất rắn & Khoa học Vật liệu',
                    date: '24/03/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'n-news-2',
                    imageUrl: PHYS_IMAGES.sci.quantumWorkshop,
                    title: 'Sinh viên Khoa Vật lý đạt giải nhất Olympic Vật lý toàn quốc',
                    date: '18/03/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                {
                  type: 'NewsCard',
                  props: {
                    id: 'n-news-3',
                    imageUrl: PHYS_IMAGES.sci.vff20,
                    title: 'Workshop VEF 2.0 - Học bổng nghiên cứu quốc tế cho sinh viên',
                    date: '10/03/2026',
                    linkUrl: '#',
                    layout: 'horizontal',
                  },
                },
                { type: 'Spacer', props: { id: 'news-btn-sp', height: 'sm' } },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'news-more-btn',
                    label: 'Xem tất cả tin tức',
                    url: '/tin-tuc',
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
                    id: 'events-header',
                    title: 'SỰ KIỆN SẮP TỚI',
                    linkText: 'Xem thêm',
                    linkUrl: '/su-kien',
                    bgColor: '#1e40af',
                    textColor: '#ffffff',
                  },
                },
                {
                  type: 'UpcomingEvents',
                  props: {
                    id: 'upcoming-events',
                    events: [
                      {
                        imageUrl: '',
                        title: 'Hội thảo Quốc tế về Vật Lý lý thuyết 2026',
                        date: '15/04/2026',
                        time: '08:00 - 17:00',
                        location: 'Hội trường Khoa Vật lý',
                        linkUrl: '#',
                        featured: false,
                      },
                      {
                        imageUrl: '',
                        title: 'Ứng dụng AI trong Vật lý Chất rắn',
                        date: '10/04/2026',
                        time: '14:00 - 16:00',
                        location: 'Phòng F.102',
                        linkUrl: '#',
                        featured: false,
                      },
                      {
                        imageUrl: '',
                        title: 'Ngày hội Vật lý mở năm 2026',
                        date: '20/04/2026',
                        time: '08:00 - 12:00',
                        location: 'Sảnh chính Trường ĐH KHTN',
                        linkUrl: '#',
                        featured: false,
                      },
                    ],
                  },
                },
                { type: 'Spacer', props: { id: 'events-btn-sp', height: 'sm' } },
                {
                  type: 'ButtonBlock',
                  props: {
                    id: 'events-more-btn',
                    label: 'Xem tất cả sự kiện',
                    url: '/su-kien',
                    variant: 'outline',
                    size: 'sm',
                    fullWidth: false,
                    alignment: 'center',
                  },
                },
              ],
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
                    description: 'Chuyên gia xử lý tín hiệu và học máy, nghiên cứu phân loại tín hiệu điện não đồ và năng lượng tái tạo.',
                    linkUrl: '/nhan-su/pgsts-huynh-van-tuan',
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
                    description: 'Trưởng bộ môn Vật lý Hạt nhân, chuyên mô phỏng MCNP/PENELOPE ứng dụng trong công nghiệp và an toàn bức xạ.',
                    linkUrl: '/nhan-su/pgsts-tran-thien-thanh',
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
                    description: 'Chuyên gia địa vật lý, nghiên cứu phương pháp từ tellur và radar xuyên đất ứng dụng trong thủy văn và kỹ thuật.',
                    linkUrl: '/nhan-su/ts-dang-hoai-trung',
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

    {
      type: 'PartnerShowcase',
      props: {
        id: 'partners-new',
        title: 'Đối tác & Liên kết',
        bgColor: '#0c2340',
        partners: [
          { name: 'Đại học Quốc Gia TP.HCM', logoUrl: PHYS_IMAGES.partners.vnuHcm, description: 'Hệ thống đại học hàng đầu Việt Nam, đơn vị chủ quản của Trường ĐH KHTN', linkUrl: 'https://vnuhcm.edu.vn' },
          { name: 'Đại học Bách Khoa TP.HCM', logoUrl: PHYS_IMAGES.partners.polytechnic, description: 'Hợp tác đào tạo liên ngành và nghiên cứu kỹ thuật ứng dụng', linkUrl: 'https://hcmut.edu.vn' },
          { name: 'Renesas Design Vietnam', logoUrl: PHYS_IMAGES.jobs.renesas, description: 'Công ty TNHH Thiết kế Renesas - Đối tác thực tập và tuyển dụng kỹ sư thiết kế chip', linkUrl: '#' },
          { name: 'TMA Solutions', logoUrl: PHYS_IMAGES.jobs.tmaK51, description: 'Chương trình thực tập sinh viên và tuyển dụng kỹ sư phần mềm', linkUrl: '#' },
          { name: 'Bosch Vietnam', logoUrl: PHYS_IMAGES.jobs.bosh, description: 'Hợp tác nghiên cứu và chương trình thực tập kỹ sư mô phỏng', linkUrl: '#' },
          { name: 'Đại học Sài Gòn', logoUrl: PHYS_IMAGES.partners.saigon, description: 'Đối tác đào tạo giáo viên Vật lý phổ thông', linkUrl: 'https://sgu.edu.vn' },
          { name: 'ESTEC', logoUrl: PHYS_IMAGES.jobs.estec, description: 'Đối tác tuyển dụng kỹ sư trong lĩnh vực kiểm định và đo lường', linkUrl: '#' },
          { name: 'Synopsys', logoUrl: PHYS_IMAGES.jobs.synopsys, description: 'Chương trình Discover Synopsys - Thực tập quốc tế thiết kế vi mạch', linkUrl: '#' },
          { name: 'Đại học Cần Thơ', logoUrl: PHYS_IMAGES.partners.canTho, description: 'Hợp tác nghiên cứu vùng Đồng bằng sông Cửu Long', linkUrl: 'https://ctu.edu.vn' },
          { name: 'Đại học Đà Lạt', logoUrl: PHYS_IMAGES.partners.dalat, description: 'Hợp tác nghiên cứu Vật lý Hạt nhân và đào tạo sau đại học', linkUrl: 'https://dlu.edu.vn' },
        ],
      },
    },

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
                  type: 'ContactInfo',
                  props: {
                    id: 'footer-contact-new',
                    address: '227 Nguyễn Văn Cừ, P. Chợ Quán, Q.5, TP.HCM',
                    phone: '+84 28 38355272',
                    email: 'phys@hcmus.edu.vn',
                    showIcons: true,
                    color: '#94a3b8',
                    layout: 'vertical',
                    alignment: 'left',
                  },
                },
                {
                  type: 'Spacer',
                  props: { id: 'footer-social-sp', height: 'sm' },
                },
                {
                  type: 'SocialIcons',
                  props: {
                    id: 'footer-social-new',
                    icons: [
                      { icon: 'facebook', url: 'https://www.facebook.com/VLH2015', color: '#ffffff' },
                    ],
                    size: 'lg',
                    gap: 'sm',
                    alignment: 'left',
                    variant: 'flat',
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
      data: {
        puckData: NEW_HOMEPAGE_PUCK_DATA as any,
        publishedPuckData: NEW_HOMEPAGE_PUCK_DATA as any,
      },
    });
    console.log('New homepage layout updated');
  } else {
    await prisma.pageLayout.create({
      data: {
        name: 'New Homepage',
        slug: 'trang-chu-moi',
        description: 'Trang chủ mới - layout quốc tế, full-screen hero, search bar, animations',
        puckData: NEW_HOMEPAGE_PUCK_DATA as any,
        publishedPuckData: NEW_HOMEPAGE_PUCK_DATA as any,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });
    console.log('New homepage layout created');
  }

  const SUBPAGE_PUCK_DATA = {
    root: {},
    content: [
      {
        type: 'Navbar',
        props: {
          id: 'sub-navbar',
          logoSrc: PHYS_IMAGES.logo,
          logoAlt: 'Khoa Vật lý - Vật lý Kỹ thuật',
          menuItems: [
            { label: 'Trang chủ', url: '/trang-chu-moi', children: '' },
            { label: 'Giới thiệu', url: '#gioi-thieu', children: '' },
            { label: 'Đào tạo', url: '#dao-tao', children: '' },
            { label: 'Liên hệ', url: '#lien-he', children: '' },
          ],
          bgColor: '#ffffff',
          textColor: '#1e293b',
          showSearch: true,
          searchPlaceholder: 'Nhập từ khóa...',
          searchSuggestions: [
            { label: 'Trang chủ', url: '/trang-chu-moi' },
            { label: 'Tuyển sinh', url: '/tuyen-sinh' },
          ],
        },
      },
      {
        type: 'ImageTextBlock',
        props: {
          id: 'sub-hero',
          imageUrl: PHYS_IMAGES.hero.admissions2026,
          imageAlt: 'Tuyển sinh Đại học 2026',
          imagePosition: 'left',
          fullBleed: true,
          headline: 'Tuyển sinh Đại học 2026',
          body: 'Khoa Vật lý - Vật lý Kỹ thuật tuyển sinh 7 ngành đào tạo bậc Đại học, trong đó 5 ngành đã đạt kiểm định quốc tế ASIIN theo chuẩn châu Âu. Thông tin chi tiết về chỉ tiêu, phương thức xét tuyển và học bổng.',
          stats: [
            { value: '7', label: 'Ngành đào tạo' },
            { value: '5', label: 'Ngành đạt ASIIN' },
          ],
          ctaLabel: 'Xem thông tin tuyển sinh',
          ctaUrl: '#',
          bgColor: '',
        },
      },
      {
        type: 'Container',
        props: {
          id: 'sub-content',
          maxWidth: 'lg',
          padding: 'lg',
          bgColor: '',
          centered: true,
          anchorId: 'gioi-thieu',
          content: [
            {
              type: 'Heading',
              props: {
                id: 'sub-heading-1',
                text: 'Các ngành tuyển sinh',
                level: 'h2',
                alignment: 'left',
                color: '#1e293b',
              },
            },
            { type: 'Spacer', props: { id: 'sub-sp-1', height: 'sm' } },
            {
              type: 'TextBlock',
              props: {
                id: 'sub-text-1',
                content: 'Vật lý học (7440102_NN) · Công nghệ bán dẫn (7440102_NN) · Công nghệ vật lý điện tử và tin học (7440102_NN) · Kỹ thuật hạt nhân (7520402) · Vật lý y khoa (7520403) · Hải dương học (7440228)',
                fontSize: 'lg',
                alignment: 'left',
                color: '#475569',
              },
            },
            { type: 'Spacer', props: { id: 'sub-sp-2', height: 'md' } },
            {
              type: 'Heading',
              props: {
                id: 'sub-heading-2',
                text: 'Chương trình đào tạo đặc biệt',
                level: 'h2',
                alignment: 'left',
                color: '#1e293b',
              },
            },
            { type: 'Spacer', props: { id: 'sub-sp-3', height: 'sm' } },
            {
              type: 'Grid',
              props: {
                id: 'sub-programs-grid',
                columns: '3',
                rows: '1',
                gap: 'md',
                cell0: [
                  {
                    type: 'IconText',
                    props: {
                      id: 'sub-prog-1',
                      icon: 'school',
                      title: 'Cử nhân tài năng Vật lý học',
                      description: 'Chương trình đào tạo chuyên sâu cho sinh viên xuất sắc.',
                      iconColor: '#1d4ed8',
                      layout: 'vertical',
                    },
                  },
                ],
                cell1: [
                  {
                    type: 'IconText',
                    props: {
                      id: 'sub-prog-2',
                      icon: 'translate',
                      title: 'Vật lý học Tăng cường tiếng Anh',
                      description: 'Chương trình giảng dạy song ngữ Việt-Anh.',
                      iconColor: '#1d4ed8',
                      layout: 'vertical',
                    },
                  },
                ],
                cell2: [
                  {
                    type: 'IconText',
                    props: {
                      id: 'sub-prog-3',
                      icon: 'memory',
                      title: 'Cử nhân tài năng Công nghệ bán dẫn',
                      description: 'Đào tạo kỹ sư thiết kế vi mạch và bán dẫn.',
                      iconColor: '#1d4ed8',
                      layout: 'vertical',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        type: 'FooterBlock',
        props: {
          id: 'sub-footer',
          bgColor: '#0c2340',
          textColor: '#94a3b8',
          content: [
            {
              type: 'TextBlock',
              props: {
                id: 'sub-footer-text',
                content: 'Khoa Vật Lý - Vật Lý Kỹ Thuật · 227 Nguyễn Văn Cừ, Q.5, TP.HCM · phys@hcmus.edu.vn',
                fontSize: 'sm',
                alignment: 'center',
                color: '#94a3b8',
              },
            },
          ],
        },
      },
    ],
  };

  const existingSub = await prisma.pageLayout.findUnique({
    where: { slug: 'tuyen-sinh' },
  });
  if (existingSub) {
    await prisma.pageLayout.update({
      where: { slug: 'tuyen-sinh' },
      data: { puckData: SUBPAGE_PUCK_DATA as any },
    });
    console.log('Sub-page "tuyen-sinh" updated');
  } else {
    await prisma.pageLayout.create({
      data: {
        name: 'Tuyển sinh 2026',
        slug: 'tuyen-sinh',
        description: 'Thông tin tuyển sinh Đại học năm 2026',
        puckData: SUBPAGE_PUCK_DATA as any,
        isPublished: false,
        createdBy: admin.id,
      },
    });
    console.log('Sub-page "tuyen-sinh" created');
  }
};

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
