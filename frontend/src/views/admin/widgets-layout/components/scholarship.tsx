"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { Search as SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { localizedTextField } from "../fields/localized-text-field";
import { resolveMediaSrc, resolveOptimizerSrc } from "./media-src";
import { TagIcons } from "./news-feed";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PAGE_SIZE = 9;

type ScholarshipPost = {
  slug: string;
  title: LocalizedString;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  tags?: { slug: string; name: string; icon: string | null }[];
  layouts?: { slug: string; isPublished: boolean }[];
};

const postDate = (p: ScholarshipPost) => p.publishedAt || p.updatedAt;

const fmtDate = (iso: string | null | undefined, locale: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function ScholarshipListRender({
  title,
  keyword,
  categorySlug,
  isEditing,
}: {
  title: LocalizedString;
  keyword: string;
  categorySlug: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ScholarshipPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(
    (pageToLoad: number, replace: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageToLoad),
        pageSize: String(PAGE_SIZE),
      });
      const search = query.trim() || keyword || "";
      if (search) params.set("search", search);
      if (categorySlug) params.set("category", categorySlug);
      fetch(`${API_URL}/posts/public/list?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : { items: [], total: 0, hasMore: false }))
        .then((d) => {
          const list: ScholarshipPost[] = d.items || [];
          setItems((prev) => (replace ? list : [...prev, ...list]));
          setTotal(d.total || 0);
          setHasMore(Boolean(d.hasMore));
        })
        .catch(() => {
          if (replace) {
            setItems([]);
            setTotal(0);
          }
          setHasMore(false);
        })
        .finally(() => setLoading(false));
    },
    [query, keyword, categorySlug],
  );

  // Đổi từ khóa -> nạp lại từ trang 1.
  useEffect(() => {
    setPage(1);
    const id = window.setTimeout(() => load(1, true), 300);
    return () => window.clearTimeout(id);
  }, [load]);

  // Infinite scroll: chạm sentinel cuối danh sách -> nạp trang kế và nối thêm.
  useEffect(() => {
    if (isEditing || !hasMore || loading) return;
    const el = sentinel.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const next = page + 1;
          setPage(next);
          load(next, false);
        }
      },
      { rootMargin: "400px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasMore, loading, page, load, isEditing]);

  const postHref = (p: ScholarshipPost) => {
    const layoutSlug = p.layouts?.find((l) => l.isPublished)?.slug;
    return `/${locale}/${layoutSlug ?? `tin-tuc/${p.slug}`}`;
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0c2340] dark:text-slate-100">
            {t(title, locale) ||
              (locale === "en" ? "Scholarships" : "Các chương trình học bổng")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {locale === "en" ? `${total} articles` : `${total} bài viết`}
          </p>
        </div>
        {/* Góc trên phải: ô tìm kiếm (list là infinite scroll). */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full md:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isEditing}
              placeholder={
                locale === "en" ? "Search articles…" : "Tìm bài viết…"
              }
              className="w-full pl-9 pr-3 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-16">
          {locale === "en"
            ? "No articles match your search."
            : "Không tìm thấy bài viết phù hợp."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <a
              key={p.slug}
              href={isEditing ? "#" : postHref(p)}
              tabIndex={isEditing ? -1 : undefined}
              className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="h-40 bg-slate-100 dark:bg-[#202c44] overflow-hidden">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      p.coverUrl.startsWith("/uploads")
                        ? `/_next/image?url=${encodeURIComponent(resolveOptimizerSrc(p.coverUrl))}&w=640&q=70`
                        : resolveMediaSrc(p.coverUrl)
                    }
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300 dark:text-slate-600">
                    📰
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {t(p.title, locale)}
                </h3>
                <p className="mt-auto pt-3 text-xs text-slate-400">
                  {fmtDate(postDate(p), locale)}
                </p>
                <TagIcons tags={p.tags} size={50} />
              </div>
            </a>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-slate-100 dark:bg-[#1a2436] animate-pulse"
            />
          ))}
        </div>
      )}
      {/* mốc kích hoạt nạp thêm cho infinite scroll */}
      <div ref={sentinel} className="h-px w-full" />
    </section>
  );
}

export const ScholarshipList: ComponentConfig<{
  title: LocalizedString;
  keyword: string;
  categorySlug: string;
}> = {
  label: "Scholarship List",
  fields: {
    title: localizedTextField("Title"),
    keyword: { type: "text", label: "Base keyword (search)" },
    categorySlug: { type: "text", label: "Category slug (optional)" },
  },
  defaultProps: {
    title: { vi: "Các chương trình học bổng", en: "Scholarships" },
    keyword: "học bổng",
    categorySlug: "",
  },
  render: ({ title, keyword, categorySlug, puck }) => (
    <ScholarshipListRender
      title={title}
      keyword={keyword}
      categorySlug={categorySlug}
      isEditing={Boolean(puck?.isEditing)}
    />
  ),
};
