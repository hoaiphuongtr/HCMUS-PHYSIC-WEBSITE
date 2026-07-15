"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { localizedTextField } from "../fields/localized-text-field";
import { resolveMediaSrc } from "./media-src";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PAGE_SIZE = 9;

type ScholarshipPost = {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString | null;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  layouts?: { slug: string; isPublished: boolean }[];
};

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
  categorySlug,
  isEditing,
}: {
  title: LocalizedString;
  categorySlug: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ScholarshipPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const id = window.setTimeout(() => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        category: categorySlug || "hoc-bong",
      });
      if (query.trim()) params.set("search", query.trim());
      fetch(`${API_URL}/posts/public/list?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
        .then((d) => {
          setItems(d.items || []);
          setTotal(d.total || 0);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(id);
  }, [query, page, categorySlug]);

  const postHref = (p: ScholarshipPost) => {
    const layoutSlug = p.layouts?.find((l) => l.isPublished)?.slug;
    return `/${locale}/${layoutSlug ?? `tin-tuc/${p.slug}`}`;
  };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0c2340] dark:text-slate-100">
            {t(title, locale) ||
              (locale === "en" ? "Scholarships" : "Các chương trình học bổng")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {locale === "en"
              ? `${total} scholarship announcements`
              : `${total} thông báo học bổng`}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            disabled={isEditing}
            placeholder={
              locale === "en" ? "Search scholarships…" : "Tìm học bổng…"
            }
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a2436] text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-slate-100 dark:bg-[#1a2436] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-16">
          {locale === "en"
            ? "No scholarships match your search."
            : "Không tìm thấy học bổng phù hợp."}
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
                    src={resolveMediaSrc(p.coverUrl)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300 dark:text-slate-600">
                    🎓
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {t(p.title, locale)}
                </h3>
                <p className="mt-auto pt-3 text-xs text-slate-400">
                  {fmtDate(p.publishedAt || p.updatedAt, locale)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 8)
            .map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  n === page
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-[#202c44] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}

export const ScholarshipList: ComponentConfig<{
  title: LocalizedString;
  categorySlug: string;
}> = {
  label: "Scholarship List",
  fields: {
    title: localizedTextField("Title"),
    categorySlug: { type: "text", label: "Category slug" },
  },
  defaultProps: {
    title: { vi: "Các chương trình học bổng", en: "Scholarships" },
    categorySlug: "hoc-bong",
  },
  render: ({ title, categorySlug, puck }) => (
    <ScholarshipListRender
      title={title}
      categorySlug={categorySlug}
      isEditing={Boolean(puck?.isEditing)}
    />
  ),
};
