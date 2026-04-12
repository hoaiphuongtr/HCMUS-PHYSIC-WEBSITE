const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type PageLayout = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  puckData: any | null;
  publishedPuckData: any | null;
  isPublished: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function getLayoutBySlug(slug: string): Promise<PageLayout> {
  const res = await fetch(`${API_URL}/page-layouts/slug/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Layout not found: ${slug}`);
  return res.json();
}
