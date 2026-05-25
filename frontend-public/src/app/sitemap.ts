import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type PageLayoutListItem = {
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  scheduledAt?: string | null;
  updatedAt?: string;
};

type PostListItem = {
  slug: string;
  publishedAt: string | null;
  updatedAt?: string;
  layoutSlug?: string | null;
};

const fetchPageLayouts = async (): Promise<PageLayoutListItem[]> => {
  try {
    const res = await fetch(`${API_URL}/page-layouts`, {
      next: { revalidate: 300, tags: ["sitemap"] },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as PageLayoutListItem[];
    const now = Date.now();
    return data.filter((l) => {
      if (!l.isPublished) return false;
      if (l.scheduledAt && new Date(l.scheduledAt).getTime() > now) return false;
      return true;
    });
  } catch {
    return [];
  }
};

const fetchPosts = async (): Promise<PostListItem[]> => {
  try {
    const res = await fetch(
      `${API_URL}/posts/public/list?page=1&pageSize=500`,
      { next: { revalidate: 300, tags: ["sitemap"] } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items: PostListItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/$/, "");
  const [layouts, posts] = await Promise.all([fetchPageLayouts(), fetchPosts()]);
  const now = new Date();

  const layoutEntries: MetadataRoute.Sitemap = layouts.map((layout) => ({
    url: `${base}/${layout.slug}`,
    lastModified: layout.updatedAt
      ? new Date(layout.updatedAt)
      : layout.publishedAt
        ? new Date(layout.publishedAt)
        : now,
    changeFrequency: "weekly" as const,
    priority: layout.slug === "trang-chu" ? 1.0 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = posts
    .filter((p) => p.layoutSlug)
    .map((post) => ({
      url: `${base}/${post.layoutSlug}`,
      lastModified: post.updatedAt
        ? new Date(post.updatedAt)
        : post.publishedAt
          ? new Date(post.publishedAt)
          : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...layoutEntries,
    ...postEntries,
  ];
}
