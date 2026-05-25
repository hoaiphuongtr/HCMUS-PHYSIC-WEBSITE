import type { Metadata } from "next";

export const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
};

export const buildCanonical = (path: string): string => {
  const base = getBaseUrl().replace(/\/$/, "");
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleaned}`;
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
    default: "Khoa Vật lý - Vật lý Kỹ thuật | HCMUS",
    template: "%s | Khoa Vật lý - HCMUS",
  },
  description:
    "Khoa Vật lý - Vật lý Kỹ thuật, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM. Tin tức, sự kiện, học bổng, và thông tin tuyển sinh.",
  keywords: [
    "Khoa Vật lý",
    "HCMUS",
    "Đại học Khoa học Tự nhiên",
    "ĐHQG TP.HCM",
    "Vật lý Kỹ thuật",
    "Tuyển sinh",
    "Học bổng",
  ],
  authors: [{ name: "Khoa Vật lý - HCMUS" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Khoa Vật lý - HCMUS",
    title: "Khoa Vật lý - Vật lý Kỹ thuật | HCMUS",
    description:
      "Khoa Vật lý - Vật lý Kỹ thuật, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
    images: [
      {
        url: buildOgImage(),
        width: 1200,
        height: 630,
        alt: "Khoa Vật lý - HCMUS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khoa Vật lý - Vật lý Kỹ thuật | HCMUS",
    description:
      "Khoa Vật lý - Vật lý Kỹ thuật, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
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
  name: "Khoa Vật lý - Vật lý Kỹ thuật, HCMUS",
  alternateName: "Faculty of Physics & Engineering Physics",
  url: getBaseUrl(),
  logo: `${getBaseUrl()}/Logo_Phys-blue.png`,
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
    alternateName: "University of Science, VNU-HCM",
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
