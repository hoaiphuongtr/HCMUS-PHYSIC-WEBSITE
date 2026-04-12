import { notFound } from "next/navigation";
import { getLayoutBySlug } from "@/lib/api";
import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOMEPAGE_SLUG = process.env.NEXT_PUBLIC_HOMEPAGE_SLUG || "trang-chu";

export default async function HomePage() {
  try {
    const layout = await getLayoutBySlug(HOMEPAGE_SLUG);
    if (!layout.isPublished) notFound();
    return <PuckRenderer puckData={layout.publishedPuckData ?? layout.puckData} />;
  } catch {
    notFound();
  }
}
