"use client";

import type { ComponentConfig } from "@puckeditor/core";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";
import { LegacyHtmlRender } from "./post-placeholders";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── PageHero ──────────────────────────────────────────────────────────────────
// Legacy section-page banner: full-width bgimage with dark overlay, centered
// uppercase title + subtitle, and a breadcrumb bar beneath (Trang chủ / Title).
function PageHeroRender({
  title,
  subtitle,
  bgImage,
}: {
  title: LocalizedString;
  subtitle: LocalizedString;
  bgImage: string;
}) {
  const { locale } = useLocale();
  const heading = t(title, locale);
  const sub = t(subtitle, locale);
  const bg = resolveMediaUrl(bgImage || "");
  const home = locale === "en" ? "Home" : "Trang chủ";
  return (
    <>
      <section
        className="relative w-full bg-[#0c2340] text-white"
        style={
          bg
            ? {
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[#0c2340]/80" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-6 py-14 md:py-20 text-center">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-wide">
            {heading}
          </h1>
          {sub ? (
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl mx-auto">
              {sub}
            </p>
          ) : null}
        </div>
      </section>
      <nav
        aria-label="Breadcrumb"
        className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101826]"
      >
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <NextLink
            href={`/${locale}`}
            className="hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            🏠 {home}
          </NextLink>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700 dark:text-slate-200">{heading}</span>
        </div>
      </nav>
    </>
  );
}

export const PageHero: ComponentConfig<{
  title: LocalizedString;
  subtitle: LocalizedString;
  bgImage: string;
}> = {
  label: "Page Hero",
  defaultProps: {
    title: { vi: "Tiêu đề trang", en: "Page title" },
    subtitle: { vi: "", en: "" },
    bgImage: "",
  },
  fields: {
    title: localizedTextField("Title"),
    subtitle: localizedTextField("Subtitle"),
    bgImage: mediaPickerField("Background image"),
  },
  render: ({ title, subtitle, bgImage }) => (
    <PageHeroRender title={title} subtitle={subtitle} bgImage={bgImage} />
  ),
};

// ── LegacyPageBody ──────────────────────────────────────────────────────────
// Two-column body mimicking the legacy section pages: the migrated HTML content
// on the left, and a sidebar (Danh mục links + live Tin mới nhất) on the right.
type LatestPost = {
  id: string;
  slug: string;
  title: LocalizedString | string;
  coverUrl: string | null;
  publishedAt: string;
  layoutSlug: string | null;
};

// Danh mục sidebar lấy từ chính bảng Category (đồng nhất với bộ lọc trang tin
// tức) thay vì danh sách legacy cứng — link trỏ về trang tin đã lọc theo mục.
type SidebarCategory = { slug: string; name: LocalizedString; status?: boolean };
let catCache: { at: number; data: SidebarCategory[] } | null = null;
let catInflight: Promise<SidebarCategory[]> | null = null;
const CAT_TTL_MS = 60_000;
function fetchSidebarCategories(): Promise<SidebarCategory[]> {
  if (catCache && Date.now() - catCache.at < CAT_TTL_MS) {
    return Promise.resolve(catCache.data);
  }
  if (catInflight) return catInflight;
  catInflight = fetch(`${API_URL}/categories`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => {
      const arr = (Array.isArray(d) ? d : []).filter(
        (c: SidebarCategory & { status?: boolean }) => c.status !== false,
      );
      catCache = { at: Date.now(), data: arr };
      return arr;
    })
    .catch(() => [] as SidebarCategory[])
    .finally(() => {
      catInflight = null;
    });
  return catInflight;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Module-level dedup + short TTL cache: the sidebar appears on every section page,
// so without this each navigation (and each concurrent instance) refetches the same
// latest-news list. Shares one in-flight request across all callers.
const NEWS_TTL_MS = 60_000;
let newsCache: { at: number; data: LatestPost[] } | null = null;
let newsInflight: Promise<LatestPost[]> | null = null;

function fetchLatestNews(): Promise<LatestPost[]> {
  if (newsCache && Date.now() - newsCache.at < NEWS_TTL_MS) {
    return Promise.resolve(newsCache.data);
  }
  if (newsInflight) return newsInflight;
  newsInflight = fetch(`${API_URL}/posts/public/latest?limit=6`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => {
      const arr = Array.isArray(d) ? (d as LatestPost[]) : [];
      newsCache = { at: Date.now(), data: arr };
      return arr;
    })
    .catch(() => [] as LatestPost[])
    .finally(() => {
      newsInflight = null;
    });
  return newsInflight;
}

function LegacyPageBodyRender({ html }: { html: LocalizedString }) {
  const { locale } = useLocale();
  const prefix = `/${locale}`;
  const [news, setNews] = useState<LatestPost[]>([]);
  const [cats, setCats] = useState<SidebarCategory[]>([]);

  useEffect(() => {
    let alive = true;
    fetchLatestNews().then((d) => {
      if (alive) setNews(d);
    });
    fetchSidebarCategories().then((d) => {
      if (alive) setCats(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const postUrl = (p: LatestPost) =>
    `${prefix}/${p.layoutSlug ?? `tin-tuc/${p.slug}`}`;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        <main className="min-w-0">
          <LegacyHtmlRender html={html} injected={false} />
        </main>
        <aside className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-[#0c2340] dark:text-slate-100 border-b-2 border-blue-700 pb-2 mb-3">
              {locale === "en" ? "Categories" : "Danh mục"}
            </h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {cats.map((c) => {
                const href = `${prefix}/tin-tuc?category=${c.slug}`;
                return (
                  <li key={c.slug}>
                    <a
                      href={href}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span className="uppercase tracking-wide">
                        {t(c.name, locale)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ›
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c2340] dark:text-slate-100 border-b-2 border-blue-700 pb-2 mb-3">
              {locale === "en" ? "Latest news" : "Tin mới nhất"}
            </h2>
            <ul className="space-y-4">
              {news.map((p) => (
                <li key={p.id}>
                  <NextLink href={postUrl(p)} className="flex gap-3 group">
                    <span className="shrink-0 w-20 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {p.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(p.coverUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          // Hide gracefully if the cover is missing (some legacy
                          // post covers weren't migrated) instead of a broken icon.
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {t(p.title as LocalizedString, locale)}
                      </span>
                      <span className="block mt-1 text-xs text-slate-400">
                        📅 {formatDate(p.publishedAt)}
                      </span>
                    </span>
                  </NextLink>
                </li>
              ))}
              {news.length === 0 ? (
                <li className="text-sm text-slate-400">…</li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export const LegacyPageBody: ComponentConfig<{
  html: LocalizedString;
}> = {
  label: "Legacy Page Body",
  defaultProps: { html: { vi: "", en: "" } },
  fields: { html: localizedTextareaField("Legacy HTML") },
  render: ({ html }) => <LegacyPageBodyRender html={html} />,
};
