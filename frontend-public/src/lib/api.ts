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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return res.json();
}

export type Subscription = {
  id: string;
  email: string;
  visitorId: string | null;
  tagSlugs: string[];
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const subscriptionApi = {
  create(body: { email: string; tagSlugs: string[]; visitorId?: string }) {
    return apiFetch<Subscription>(`/subscription`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  findByEmail(email: string) {
    return apiFetch<{ tagSlugs: string[] }>(
      `/subscription/by-email?email=${encodeURIComponent(email)}`,
    );
  },
};

export type VisitorProfile = {
  tagWeights: Record<string, number>;
  slugWeights: Record<string, number>;
  subscribedTagSlugs: string[];
};

export type VisitorSuggestions = {
  suggestedLinks: { label: string; url: string }[];
  hotTags: { slug: string; label: string }[];
};

export const visitorApi = {
  trackSlug(visitorId: string, slug: string) {
    return apiFetch<{ ok: boolean }>(`/visitor/track-slug`, {
      method: "POST",
      body: JSON.stringify({ visitorId, slug }),
    });
  },
  trackPost(visitorId: string, postId: string) {
    return apiFetch<{ ok: boolean }>(`/visitor/track-post`, {
      method: "POST",
      body: JSON.stringify({ visitorId, postId }),
    });
  },
  getProfile(visitorId: string) {
    return apiFetch<VisitorProfile>(`/visitor/${visitorId}/profile`);
  },
  getSuggestions(visitorId: string, limit = 6) {
    return apiFetch<VisitorSuggestions>(
      `/visitor/${visitorId}/suggestions?limit=${limit}`,
    );
  },
};

export type MediaItem = {
  id: string;
  name: string;
  type: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; slug: string; name: string }[];
};

export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
};

export const mediaApi = {
  list: (_query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    tagSlug?: string;
  }) =>
    Promise.resolve({
      items: [] as MediaItem[],
      total: 0,
      page: 1,
      pageSize: 0,
    }),
  tagsInUse: () =>
    Promise.resolve([] as { id: string; slug: string; name: string }[]),
};

export type PostCategoryValue =
  | "EDUCATIONAL_NEWS"
  | "SCIENTIFIC_INFORMATION"
  | "RECRUITMENT"
  | "EVENT"
  | "SCHOLARSHIP";

export type PostPublicCard = {
  id: string;
  title: string | { vi?: string; en?: string };
  slug: string;
  excerpt: string | { vi?: string; en?: string } | null;
  category: PostCategoryValue;
  coverUrl: string | null;
  coverAlt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  eventLocation: string | { vi?: string; en?: string } | null;
  publishedAt: string;
  layoutSlug: string | null;
};

export type PostPagedResponse = {
  items: PostPublicCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export const postPublicApi = {
  latest: (limit = 4) =>
    apiFetch<PostPublicCard[]>(`/posts/public/latest?limit=${limit}`),
  upcomingEvents: (limit = 4) =>
    apiFetch<PostPublicCard[]>(`/posts/public/upcoming-events?limit=${limit}`),
  list: (params: {
    page?: number;
    pageSize?: number;
    category?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params.category) sp.set("category", params.category);
    if (params.fromDate) sp.set("fromDate", params.fromDate);
    if (params.toDate) sp.set("toDate", params.toDate);
    if (params.search) sp.set("search", params.search);
    const query = sp.toString();
    return apiFetch<PostPagedResponse>(
      `/posts/public/list${query ? `?${query}` : ""}`,
    );
  },
};
