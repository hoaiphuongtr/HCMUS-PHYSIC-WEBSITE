import type { Metadata } from "next";

/**
 * Tên gọi chính thức — KHAI BÁO MỘT CHỖ DUY NHẤT.
 *
 * Trước đây mỗi file tự gõ lại nên trôi mỗi nơi một kiểu ("Khoa Vật lý" thiếu
 * vế "Vật lý kỹ thuật", chỗ "HCMUS" chỗ "VNUHCM-University of Science").
 * Cần đổi tên thì sửa ở đây, mọi trang + JSON-LD + ảnh OG theo cùng.
 *
 * Quy ước: tiếng Việt dùng TÊN TRƯỜNG ĐẦY ĐỦ, tiếng Anh dùng viết tắt VNU HCMUS.
 */
export const FACULTY_VI = "Khoa Vật lý - Vật lý kỹ thuật";
export const FACULTY_EN = "Faculty of Physics & Engineering Physics";
export const UNIVERSITY_VI = "Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM";
export const UNIVERSITY_EN = "VNU HCMUS";
/** Tên đầy đủ dùng cho tiêu đề trang, JSON-LD, chân trang. */
export const SITE_NAME_VI = `${FACULTY_VI} | ${UNIVERSITY_VI}`;
export const SITE_NAME_EN = `${FACULTY_EN} | ${UNIVERSITY_EN}`;
/** Mô tả mặc định — dùng khi trang không tự khai mô tả riêng. */
export const DESCRIPTION_VI = `${FACULTY_VI}, ${UNIVERSITY_VI}. Tin tức, sự kiện, học bổng và thông tin tuyển sinh.`;
export const DESCRIPTION_EN = `${FACULTY_EN}, ${UNIVERSITY_EN}. News, events, scholarships and admissions.`;

export const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
};

export const buildCanonical = (path: string): string => {
  const base = getBaseUrl().replace(/\/$/, "");
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleaned}`;
};

/** hreflang alternates cho một path (không kèm tiền tố locale). */
export const buildLanguageAlternates = (
  path: string,
): Record<string, string> => {
  const base = getBaseUrl().replace(/\/$/, "");
  const cleaned = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    vi: `${base}/vi${cleaned}`,
    en: `${base}/en${cleaned}`,
    "x-default": `${base}/vi${cleaned}`,
  };
};

export const buildOgImage = (args?: {
  slug?: string;
  title?: string;
  subtitle?: string;
}): string => {
  const base = getBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams();
  if (args?.slug) params.set("slug", args.slug);
  if (args?.title) params.set("title", args.title);
  if (args?.subtitle) params.set("subtitle", args.subtitle);
  const query = params.toString();
  return `${base}/api/og${query ? `?${query}` : ""}`;
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: SITE_NAME_VI,
    // Đuôi cho từng trang con: chỉ tên khoa, thêm cả tên trường thì tiêu đề dài
    // quá mức Google hiển thị (~70 ký tự) và bị cắt.
    template: `%s | ${FACULTY_VI}`,
  },
  description: DESCRIPTION_VI,
  keywords: [
    "Khoa Vật lý - Vật lý kỹ thuật",
    "VNU HCMUS",
    "Trường ĐH Khoa học Tự nhiên",
    "ĐHQG-HCM",
    "Vật lý kỹ thuật",
    "Tuyển sinh",
    "Học bổng",
  ],
  authors: [{ name: SITE_NAME_VI }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: FACULTY_VI,
    title: SITE_NAME_VI,
    description: DESCRIPTION_VI,
    images: [
      {
        url: buildOgImage(),
        width: 1200,
        height: 630,
        alt: SITE_NAME_VI,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME_VI,
    description: DESCRIPTION_VI,
    images: [buildOgImage()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: getBaseUrl(),
  },
};

export const facultyOrganization = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: FACULTY_VI,
  alternateName: FACULTY_EN,
  url: getBaseUrl(),
  logo: `${getBaseUrl()}/Logo_Phys-blue.png`,
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: UNIVERSITY_VI,
    alternateName: UNIVERSITY_EN,
    url: "https://hcmus.edu.vn",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "227 Nguyễn Văn Cừ, Phường 4, Quận 5",
    addressLocality: "TP. Hồ Chí Minh",
    addressRegion: "TPHCM",
    postalCode: "70000",
    addressCountry: "VN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84-28-38353193",
    contactType: "customer service",
    areaServed: "VN",
    availableLanguage: ["Vietnamese", "English"],
  },
  sameAs: ["https://www.facebook.com/Khoavatly.HCMUS"],
});
