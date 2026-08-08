"use client";

import type { ComponentConfig } from "@puckeditor/core";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { localizedSummary } from "../fields/item-summary";
import { localizedTextField } from "../fields/localized-text-field";
import { localizedRichTextField } from "../fields/localized-rich-text-field";
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
  homeUrl,
  homeLabel,
}: {
  title: LocalizedString;
  subtitle: LocalizedString;
  bgImage: string;
  homeUrl: string;
  homeLabel: LocalizedString;
}) {
  const { locale } = useLocale();
  const heading = t(title, locale);
  const sub = t(subtitle, locale);
  const bg = resolveMediaUrl(bgImage || "");
  const homeText =
    t(homeLabel, locale) || (locale === "en" ? "Home" : "Trang chủ");
  const homeHref = homeUrl ? `/${locale}${homeUrl}` : `/${locale}`;
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
        {/* Với ảnh nền: dùng gradient nhẹ (đậm dần xuống dưới) để ẢNH HIỆN
            RÕ mà chữ vẫn đọc được; không ảnh: phủ đặc để giữ nền navy. */}
        <div
          className={
            bg
              ? "absolute inset-0 bg-gradient-to-t from-[#0c2340]/85 via-[#0c2340]/45 to-[#0c2340]/30"
              : "absolute inset-0 bg-[#0c2340]/80"
          }
          aria-hidden="true"
        />
        <div className="relative max-w-[1200px] mx-auto px-6 py-14 md:py-20 text-center">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            {heading}
          </h1>
          {sub ? (
            <p className="mt-3 text-sm md:text-base text-white/90 max-w-3xl mx-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
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
            href={homeHref}
            className="hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            🏠 {homeText}
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
  homeUrl: string;
  homeLabel: LocalizedString;
}> = {
  label: "Page Hero",
  defaultProps: {
    title: { vi: "Tiêu đề trang", en: "Page title" },
    subtitle: { vi: "", en: "" },
    bgImage: "",
    homeUrl: "/",
    homeLabel: { vi: "Trang chủ", en: "Home" },
  },
  fields: {
    title: localizedTextField("Title"),
    subtitle: localizedTextField("Subtitle"),
    bgImage: mediaPickerField("Background image"),
    homeUrl: { type: "text", label: "Breadcrumb — link Trang chủ" },
    homeLabel: localizedTextField("Breadcrumb — nhãn Trang chủ"),
  },
  render: ({ title, subtitle, bgImage, homeUrl, homeLabel }) => (
    <PageHeroRender
      title={title}
      subtitle={subtitle}
      bgImage={bgImage}
      homeUrl={homeUrl}
      homeLabel={homeLabel}
    />
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

type LegacySection = { title: LocalizedString; html: LocalizedString };

function LegacyPageBodyRender({
  html,
  sections,
}: {
  html: LocalizedString;
  sections?: LegacySection[];
}) {
  const { locale } = useLocale();
  // Trang ngành gồm 9 mục (giới thiệu, chuẩn đầu ra, chương trình đào tạo…). Ghép
  // hết vào một trang thì dài tới mức không ai cuộn hết, nên chia tab như site cũ.
  // Chỉ những mục có nội dung thật mới thành tab.
  const tabs = (sections ?? []).filter((sec) => t(sec.html, locale)?.trim());
  const [active, setActive] = useState(0);
  const activeIdx = Math.min(active, Math.max(0, tabs.length - 1));
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
        {/* overflow-x-auto: bảng legacy có bề rộng cố định (vd bảng chỉ tiêu tuyển
            sinh) rộng hơn cột nội dung — cho cuộn ngang trong cột thay vì tràn đè
            lên sidebar. */}
        {/* overflow-x-auto cắt nội dung ở CẠNH PHẢI + DƯỚI (phía có thanh cuộn) →
            đường kẻ ngoài cùng bên phải và hàng cuối của bảng bị mất khi bảng vừa
            khít bề rộng cột. pb-2 chừa cạnh dưới; pr-2 chừa cạnh phải: bảng hẹp
            (max-width:100%) co vào trong content-box (đủ khoảng để viền phải hiện,
            không sinh thanh cuộn thừa); bảng rộng vẫn tràn min-content → cuộn ngang
            như cũ. */}
        <main className="min-w-0 overflow-x-auto pb-2 pr-2">
          {tabs.length > 1 ? (
            <>
              <div
                role="tablist"
                aria-label={locale === "en" ? "Sections" : "Các mục"}
                className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 mb-5"
              >
                {tabs.map((sec, i) => (
                  <button
                    key={t(sec.title, locale) || i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    onClick={() => setActive(i)}
                    className={
                      "px-3 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors " +
                      (i === activeIdx
                        ? "border-blue-700 text-blue-700 dark:text-blue-300 dark:border-blue-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")
                    }
                  >
                    {t(sec.title, locale)}
                  </button>
                ))}
              </div>
              <LegacyHtmlRender
                html={tabs[activeIdx]?.html ?? html}
                injected={false}
              />
            </>
          ) : (
            <LegacyHtmlRender
              html={tabs.length === 1 ? (tabs[0]?.html ?? html) : html}
              injected={false}
            />
          )}
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
  sections?: LegacySection[];
}> = {
  label: "Legacy Page Body",
  defaultProps: { html: { vi: "", en: "" } },
  fields: {
    html: localizedRichTextField("Nội dung trang"),
    // Có tab thì trang hiện dạng TAB và bỏ qua "Nội dung trang"; để trống thì
    // trang hiện liền một mạch như cũ. Nhờ vậy không phải thêm component mới và
    // các trang legacy đang dùng vẫn chạy y nguyên.
    sections: {
      type: "array",
      label: "Tách nội dung thành các tab (bỏ trống nếu không muốn tách)",
      getItemSummary: (item, i) =>
        localizedSummary(item?.title, `Tab ${(i ?? 0) + 1}`),
      arrayFields: {
        title: localizedTextField("Tên tab (chữ hiện trên nút)"),
        html: localizedRichTextField("Nội dung của tab này"),
      },
    },
  },
  render: ({ html, sections }) => (
    <LegacyPageBodyRender html={html} sections={sections} />
  ),
};
