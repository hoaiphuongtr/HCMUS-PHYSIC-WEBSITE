import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbListSchema, JsonLd } from "@/components/JsonLd";
import { VisitorTracker } from "@/components/visitor-tracker";
import { getLayoutBySlug } from "@/lib/api";
import { buildCanonical, buildOgImage, getBaseUrl } from "@/lib/seo";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  try {
    const layout = await getLayoutBySlug(slugPath);
    if (!layout.isPublished) return {};
    const title = layout.name;
    const description =
      layout.description ??
      `${layout.name} - Khoa Vật lý, Đại học Khoa học Tự nhiên - ĐHQG TP.HCM`;
    const canonical = buildCanonical(`/${slugPath}`);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: "article",
        url: canonical,
        locale: "vi_VN",
        images: [
          {
            url: buildOgImage({ slug: slugPath, title, subtitle: description }),
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
        images: [
          buildOgImage({ slug: slugPath, title, subtitle: description }),
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
