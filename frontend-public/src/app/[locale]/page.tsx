import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLayoutBySlug } from "@/lib/api";
import {
  buildCanonical,
  buildLanguageAlternates,
  buildOgImage,
} from "@/lib/seo";

export const revalidate = 3600;

const HOMEPAGE_SLUG = process.env.NEXT_PUBLIC_HOMEPAGE_SLUG || "trang-chu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  try {
    const layout = await getLayoutBySlug(HOMEPAGE_SLUG);
    if (!layout.isPublished) return {};
    // The homepage always uses the faculty's own name — never the internal
    // layout name (e.g. "New Homepage"), which must not leak into the tab title.
    const title = isEn
      ? "Faculty of Physics & Engineering Physics | HCMUS"
      : "Khoa Vật lý - Vật lý kỹ thuật | HCMUS";
    const description =
      layout.description ??
      (isEn
        ? "Faculty of Physics & Engineering Physics, VNUHCM-University of Science. News, events, scholarships and admissions."
        : "Khoa Vật lý - Vật lý kỹ thuật, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM. Tin tức, sự kiện, học bổng, và thông tin tuyển sinh.");
    const canonical = buildCanonical("/");
    return {
      // absolute so the root "%s | Khoa Vật lý - HCMUS" template isn't appended
      title: { absolute: title },
      description,
      alternates: { canonical, languages: buildLanguageAlternates("/") },
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        locale: isEn ? "en_US" : "vi_VN",
        images: [
          {
            url: buildOgImage({ title, subtitle: description }),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [buildOgImage({ title, subtitle: description })],
      },
    };
  } catch {
    return {};
  }
}

export default async function LocaleHomePage() {
  try {
    const layout = await getLayoutBySlug(HOMEPAGE_SLUG);
    if (!layout.isPublished) notFound();
    return (
      <PuckRenderer puckData={layout.publishedPuckData ?? layout.puckData} />
    );
  } catch {
    notFound();
  }
}
