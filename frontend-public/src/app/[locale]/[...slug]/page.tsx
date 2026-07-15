import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbListSchema, JsonLd } from "@/components/JsonLd";
import { VisitorTracker } from "@/components/visitor-tracker";
import { getLayoutBySlug } from "@/lib/api";
import {
  buildCanonical,
  buildLanguageAlternates,
  buildOgImage,
  getBaseUrl,
} from "@/lib/seo";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string[]; locale?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const slugPath = slug.join("/");
  const isEn = locale === "en";
  try {
    const layout = await getLayoutBySlug(slugPath);
    if (!layout.isPublished) return {};
    // Tên trang lưu một chuỗi (tiếng Việt); phần đuôi/mô tả đổi theo ngôn ngữ đang xem.
    const titleText = isEn
      ? `${layout.name} | Faculty of Physics - HCMUS`
      : `${layout.name} | Khoa Vật lý - HCMUS`;
    const description =
      layout.description ??
      (isEn
        ? `${layout.name} - Faculty of Physics & Engineering Physics, VNUHCM-University of Science`
        : `${layout.name} - Khoa Vật lý, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM`);
    const canonical = buildCanonical(`/${slugPath}`);
    return {
      title: { absolute: titleText },
      description,
      alternates: {
        canonical,
        languages: buildLanguageAlternates(`/${slugPath}`),
      },
      openGraph: {
        title: titleText,
        description,
        type: "article",
        url: canonical,
        locale: isEn ? "en_US" : "vi_VN",
        images: [
          {
            url: buildOgImage({
              slug: slugPath,
              title: layout.name,
              subtitle: description,
            }),
            width: 1200,
            height: 630,
            alt: titleText,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: titleText,
        description,
        images: [
          buildOgImage({
            slug: slugPath,
            title: layout.name,
            subtitle: description,
          }),
        ],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {};
  }
}

export default async function PublicLayoutPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  try {
    const layout = await getLayoutBySlug(slugPath);
    if (!layout.isPublished) notFound();
    const base = getBaseUrl().replace(/\/$/, "");
    const crumbs = [
      { name: "Trang chủ", url: `${base}/` },
      { name: layout.name, url: `${base}/${slugPath}` },
    ];
    return (
      <>
        <JsonLd schema={breadcrumbListSchema(crumbs)} />
        <VisitorTracker slug={slugPath} />
        <PuckRenderer puckData={layout.publishedPuckData ?? layout.puckData} />
      </>
    );
  } catch {
    notFound();
  }
}
