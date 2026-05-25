import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLayoutBySlug } from "@/lib/api";
import { buildCanonical, buildOgImage } from "@/lib/seo";

export const revalidate = 3600;

const HOMEPAGE_SLUG = process.env.NEXT_PUBLIC_HOMEPAGE_SLUG || "trang-chu";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const layout = await getLayoutBySlug(HOMEPAGE_SLUG);
    if (!layout.isPublished) return {};
    const title = layout.name || "Khoa Vật lý - Vật lý Kỹ thuật | HCMUS";
    const description =
      layout.description ??
      "Khoa Vật lý - Vật lý Kỹ thuật, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM. Tin tức, sự kiện, học bổng, và thông tin tuyển sinh.";
    const canonical = buildCanonical("/");
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        locale: "vi_VN",
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
