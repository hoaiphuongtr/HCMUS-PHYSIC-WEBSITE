import { notFound } from "next/navigation";
import { getLayoutBySlug } from "@/lib/api";
import { PuckRenderer } from "@admin/views/admin/widgets-layout/puck-renderer";
import { VisitorTracker } from "@/components/visitor-tracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const layout = await getLayoutBySlug(slug);
    if (!layout.isPublished) notFound();
    return (
      <>
        <VisitorTracker slug={slug} />
        <PuckRenderer puckData={layout.publishedPuckData ?? layout.puckData} />
      </>
    );
  } catch {
    notFound();
  }
}
