"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { CalendarPlus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  type Category,
  categoryApi,
  type PostPublicCard,
  postPublicApi,
  resolveMediaUrl,
} from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { categoryColor } from "@/lib/post-categories";
import { colorField } from "../fields/color-field";
import { localizedTextField } from "../fields/localized-text-field";
import { resolveOptimizerSrc } from "./media-src";

const formatDate = (iso: string | null, locale: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (locale === "en") {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return `Ngày ${String(d.getDate()).padStart(2, "0")} tháng ${
    d.getMonth() + 1
  } năm ${d.getFullYear()}`;
};

// Faculty seal shown when a post has no cover, or its cover image fails to
// load (many migrated legacy covers point at files that 404).
const DEFAULT_COVER = "/default-cover.png";

function CoverImg({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Ảnh bìa card qua BỘ TỐI ƯU (WebP, w=640) thay vì tải file gốc 1–2MB — nhỏ hơn
  // ~20 lần nên trang tin tức/danh sách load nhanh hơn hẳn. Chỉ tối ưu ảnh trong
  // kho (/uploads); URL tuyệt đối lạ thì để nguyên. Lỗi → ảnh bìa mặc định.
  let url = DEFAULT_COVER;
  if (src && !failed) {
    url = src.startsWith("/uploads")
      ? `/_next/image?url=${encodeURIComponent(resolveOptimizerSrc(src))}&w=640&q=70`
      : resolveMediaUrl(src);
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

// Tag icon badges (e.g. SDG images) shown under a post card / title. Only tags
// whose icon is an image (URL or /uploads path) are rendered.
export function TagIcons({
  tags,
  size,
  align = "left",
}: {
  tags?: { slug: string; name: string; icon: string | null }[];
  size: number;
  align?: "left" | "center" | "right";
}) {
  const imgTags = (tags ?? []).filter(
    (tg) => tg.icon && /^(https?:|\/uploads)/.test(tg.icon),
  );
  if (imgTags.length === 0) return null;
  const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";
  return (
    <div className={`flex flex-wrap items-center gap-1.5 mt-2 ${justify}`}>
      {imgTags.map((tg) => (
        // biome-ignore lint/performance/noImgElement: tiny fixed-size badge
        <img
          key={tg.slug}
          src={resolveMediaUrl(tg.icon as string)}
          alt={tg.name}
          title={tg.name}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="object-contain"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

const formatGCalDate = (iso: string): string =>
  new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");

const buildGCalUrl = (post: PostPublicCard, locale: string): string => {
  if (!post.eventStartAt) return "#";
  const title = encodeURIComponent(t(post.title, locale));
  const start = formatGCalDate(post.eventStartAt);
  const end = formatGCalDate(post.eventEndAt || post.eventStartAt);
  const details = encodeURIComponent(t(post.excerpt ?? "", locale));
  const location = encodeURIComponent(t(post.eventLocation ?? "", locale));
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

const localizeWithFallback = (
  value: PostPublicCard["title"],
  locale: string,
): string => t(value as LocalizedString, locale);

type NewsCardProps = {
  post: PostPublicCard;
  locale: string;
  prefix: string;
  showEventTime?: boolean;
  tagSize?: number;
  tagAlign?: "left" | "center" | "right";
};

function NewsCard({
  post,
  locale,
  prefix,
  showEventTime,
  tagSize = 50,
  tagAlign = "left",
}: NewsCardProps) {
  const dateText = showEventTime
    ? formatDate(post.eventStartAt, locale)
    : formatDate(post.publishedAt, locale);
  const title = localizeWithFallback(post.title, locale);
  const href = post.layoutSlug ? `${prefix}/${post.layoutSlug}` : null;

  const cardInner = (
    <article className="group relative h-full flex flex-col bg-white dark:bg-[#1a2436] cursor-pointer">
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100 dark:bg-[#1a2436]">
        <CoverImg
          src={post.coverUrl}
          alt={post.coverAlt || title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
          {title}
        </h3>
        {dateText && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            {dateText}
          </p>
        )}
        <TagIcons tags={post.tags} size={tagSize} align={tagAlign} />
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 rounded-md"
      >
        {cardInner}
      </Link>
    );
  }
  return <div className="h-full">{cardInner}</div>;
}

function EventCard({
  post,
  locale,
  prefix,
}: {
  post: PostPublicCard;
  locale: string;
  prefix: string;
}) {
  const cat = post.category;
  const catLabel = cat
    ? t(cat.name as LocalizedString, locale)
    : "";
  const catColor = categoryColor(cat?.slug);
  const dateText = formatDate(post.eventStartAt, locale);
  const title = localizeWithFallback(post.title, locale);
  const href = post.layoutSlug ? `${prefix}/${post.layoutSlug}` : null;
  const gcalUrl = buildGCalUrl(post, locale);
  const ariaLabel =
    locale === "en" ? "Add to Google Calendar" : "Thêm vào Google Calendar";

  return (
    <article className="group relative h-full flex flex-col bg-white dark:bg-[#1a2436]">
      {href ? (
        <Link href={href} className="block">
          <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100 dark:bg-[#1a2436]">
            <CoverImg
              src={post.coverUrl}
              alt={post.coverAlt || title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
      ) : (
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100 dark:bg-[#1a2436]">
          <CoverImg
            src={post.coverUrl}
            alt={post.coverAlt || title}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div className="pt-3 pb-1 flex flex-col flex-1 relative pr-12">
        {href ? (
          <Link href={href}>
            <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
            {title}
          </h3>
        )}
        {dateText && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
            {dateText}
          </p>
        )}
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-0 bottom-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-[#202c44] transition-colors"
          title={ariaLabel}
          aria-label={ariaLabel}
        >
          <CalendarPlus className="w-[22px] h-[22px]" />
        </a>
      </div>
    </article>
  );
}

function NewsFeedHeader({
  title,
  viewAllLabel,
  viewAllUrl,
  accentColor,
}: {
  title: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
  accentColor: string;
}) {
  return (
    <div
      className="flex items-end justify-between mb-5 border-b-2 pb-2"
      style={{ borderColor: accentColor }}
    >
      <h2
        className="text-xl md:text-2xl font-bold uppercase tracking-wide"
        style={{ color: accentColor }}
      >
        {title}
      </h2>
      {viewAllLabel && viewAllUrl && (
        <Link
          href={viewAllUrl}
          className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  );
}

const useLocalePrefix = () => {
  const { locale } = useLocale();
  return { locale, prefix: `/${locale}` };
};

export const LatestNewsAuto: ComponentConfig<{
  title: LocalizedString;
  viewAllLabel: LocalizedString;
  viewAllUrl: string;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
  tagSize: number;
  tagAlign: "left" | "center" | "right";
}> = {
  label: "Latest News (auto)",
  defaultProps: {
    title: { vi: "Tin mới nhất", en: "Latest News" },
    viewAllLabel: { vi: "Xem tất cả", en: "View all" },
    viewAllUrl: "/tin-tuc",
    accentColor: "#1e40af",
    limit: 4,
    posts: [],
    tagSize: 50,
    tagAlign: "left",
  },
  fields: {
    title: localizedTextField("Section title"),
    viewAllLabel: localizedTextField("View-all label"),
    viewAllUrl: { type: "text", label: "View-all URL" },
    accentColor: colorField("Accent Color"),
    limit: {
      type: "number",
      label: "Limit",
    },
    tagSize: { type: "number", label: "Cỡ ảnh tag (px)", min: 16, max: 120 },
    tagAlign: {
      type: "select",
      label: "Canh ảnh tag",
      options: [
        { label: "Trái", value: "left" },
        { label: "Giữa", value: "center" },
        { label: "Phải", value: "right" },
      ],
    },
    posts: {
      type: "text",
      label: "Posts (auto-synced — do not edit)",
    } as any,
  },
  render: ({
    title,
    viewAllLabel,
    viewAllUrl,
    accentColor,
    limit,
    posts,
    tagSize,
    tagAlign,
  }) => (
    <LatestNewsAutoRender
      title={title}
      viewAllLabel={viewAllLabel}
      viewAllUrl={viewAllUrl}
      accentColor={accentColor}
      limit={limit}
      posts={posts || []}
      tagSize={tagSize}
      tagAlign={tagAlign}
    />
  ),
};

function LatestNewsAutoRender({
  title,
  viewAllLabel,
  viewAllUrl,
  accentColor,
  limit,
  posts,
  tagSize = 50,
  tagAlign = "left",
}: {
  title: LocalizedString;
  viewAllLabel: LocalizedString;
  viewAllUrl: string;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
  tagSize?: number;
  tagAlign?: "left" | "center" | "right";
}) {
  const { locale, prefix } = useLocalePrefix();
  const safeLimit = Math.max(1, Math.min(limit || 4, 12));
  const data = (posts || []).slice(0, safeLimit);

  return (
    <section className="w-full py-8 md:py-12 px-6">
      <NewsFeedHeader
        title={t(title, locale)}
        viewAllLabel={t(viewAllLabel, locale)}
        viewAllUrl={`${prefix}${viewAllUrl.startsWith("/") ? viewAllUrl : `/${viewAllUrl}`}`}
        accentColor={accentColor || "#1e40af"}
      />
      {data.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {locale === "en"
            ? "No news yet."
            : "Chưa có tin tức nào."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {data.map((post) => (
            <NewsCard
              key={post.id}
              post={post}
              locale={locale}
              prefix={prefix}
              tagSize={tagSize}
              tagAlign={tagAlign}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export const UpcomingEventsAuto: ComponentConfig<{
  title: LocalizedString;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
  emptyText: LocalizedString;
}> = {
  label: "Upcoming Events (auto)",
  defaultProps: {
    title: { vi: "Sự kiện sắp tới", en: "Upcoming Events" },
    accentColor: "#059669",
    limit: 4,
    posts: [],
    emptyText: {
      vi: "Hiện chưa có sự kiện sắp tới.",
      en: "No upcoming events at the moment.",
    },
  },
  fields: {
    title: localizedTextField("Section title"),
    accentColor: colorField("Accent Color"),
    limit: {
      type: "number",
      label: "Limit",
    },
    posts: {
      type: "text",
      label: "Posts (auto-synced — do not edit)",
    } as any,
    emptyText: localizedTextField("Empty-state message (no events)"),
  },
  render: ({ title, accentColor, limit, posts, emptyText }) => (
    <UpcomingEventsAutoRender
      title={title}
      accentColor={accentColor}
      limit={limit}
      posts={posts || []}
      emptyText={emptyText}
    />
  ),
};

function UpcomingEventsAutoRender({
  title,
  accentColor,
  limit,
  posts,
  emptyText,
}: {
  title: LocalizedString;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
  emptyText: LocalizedString;
}) {
  const { locale, prefix } = useLocalePrefix();
  const safeLimit = Math.max(1, Math.min(limit || 4, 12));
  const data = (posts || []).slice(0, safeLimit);

  return (
    <section className="w-full py-8 md:py-12 px-6">
      <NewsFeedHeader
        title={t(title, locale)}
        accentColor={accentColor || "#059669"}
      />
      {data.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t(emptyText, locale) ||
            (locale === "en"
              ? "No upcoming events at the moment."
              : "Hiện chưa có sự kiện sắp tới.")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {data.map((post) => (
            <EventCard
              key={post.id}
              post={post}
              locale={locale}
              prefix={prefix}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const PAGE_SIZE = 12;

export const NewsListPaginated: ComponentConfig<{
  title: LocalizedString;
  accentColor: string;
  tagSize: number;
  tagAlign: "left" | "center" | "right";
}> = {
  label: "News List Paginated",
  defaultProps: {
    title: { vi: "Tin tức", en: "News" },
    accentColor: "#1e40af",
    tagSize: 50,
    tagAlign: "left",
  },
  fields: {
    title: localizedTextField("Section title"),
    accentColor: colorField("Accent Color"),
    tagSize: { type: "number", label: "Cỡ ảnh tag (px)", min: 16, max: 120 },
    tagAlign: {
      type: "select",
      label: "Canh ảnh tag",
      options: [
        { label: "Trái", value: "left" },
        { label: "Giữa", value: "center" },
        { label: "Phải", value: "right" },
      ],
    },
  },
  render: ({ title, accentColor, tagSize, tagAlign, puck }) => (
    <NewsListPaginatedRender
      title={title}
      accentColor={accentColor}
      tagSize={tagSize}
      tagAlign={tagAlign}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function NewsListPaginatedRender({
  title,
  accentColor,
  isEditing,
  tagSize = 50,
  tagAlign = "left",
}: {
  title: LocalizedString;
  accentColor: string;
  isEditing: boolean;
  tagSize?: number;
  tagAlign?: "left" | "center" | "right";
}) {
  const { locale, prefix } = useLocalePrefix();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PostPublicCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(
    () => searchParams.get("category") ?? "",
  );
  const [search, setSearch] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [fromDate, setFromDate] = useState(
    () => searchParams.get("from") ?? "",
  );
  const [toDate, setToDate] = useState(() => searchParams.get("to") ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCategory(searchParams.get("category") ?? "");
    const nextSearch = searchParams.get("search") ?? "";
    setSearch(nextSearch);
    setSearchDraft(nextSearch);
    setFromDate(searchParams.get("from") ?? "");
    setToDate(searchParams.get("to") ?? "");
  }, [searchParams]);

  const syncUrl = (next: {
    category?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const merged = {
      category: next.category ?? category,
      search: next.search ?? search,
      from: next.fromDate ?? fromDate,
      to: next.toDate ?? toDate,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    let alive = true;
    categoryApi
      .list()
      .then((res) => {
        if (alive) setCategories(res.filter((c) => c.status));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const reqIdRef = useRef(0);

  // Reset + reload when filters change
  useEffect(() => {
    const myId = ++reqIdRef.current;
    setLoading(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    postPublicApi
      .list({
        page: 1,
        pageSize: PAGE_SIZE,
        category: category || undefined,
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
      .then((res) => {
        if (reqIdRef.current !== myId) return;
        setItems(res.items);
        setHasMore(res.hasMore);
        setLoading(false);
      })
      .catch(() => {
        if (reqIdRef.current !== myId) return;
        setLoading(false);
      });
  }, [category, search, fromDate, toDate]);

  // Infinite scroll (disabled in editor preview)
  // Only re-attach observer when filters or hasMore flag changes, NOT on
  // every page/loading state change (would cause re-fire loop on failure).
  const stateRef = useRef({
    page,
    loading,
    failed: false,
    category,
    search,
    fromDate,
    toDate,
  });
  stateRef.current = {
    page,
    loading,
    failed: stateRef.current.failed,
    category,
    search,
    fromDate,
    toDate,
  };
  // Reset failed flag when filters change
  useEffect(() => {
    stateRef.current.failed = false;
  }, [category, search, fromDate, toDate]);

  useEffect(() => {
    if (isEditing) return;
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const s = stateRef.current;
        if (s.loading || s.failed) return;
        const nextPage = s.page + 1;
        setLoading(true);
        postPublicApi
          .list({
            page: nextPage,
            pageSize: PAGE_SIZE,
            category: s.category || undefined,
            search: s.search || undefined,
            fromDate: s.fromDate || undefined,
            toDate: s.toDate || undefined,
          })
          .then((res) => {
            setItems((prev) => {
              const seen = new Set(prev.map((p) => p.id));
              const fresh = res.items.filter((p) => !seen.has(p.id));
              return [...prev, ...fresh];
            });
            setPage(nextPage);
            setHasMore(res.hasMore);
            setLoading(false);
          })
          .catch(() => {
            stateRef.current.failed = true;
            setLoading(false);
          });
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isEditing, hasMore]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchDraft.trim();
    setSearch(trimmed);
    syncUrl({ search: trimmed });
  };

  const lineColor = accentColor || "#1e40af";

  return (
    <section className="w-full py-8 md:py-12 px-6">
      <div
        className="flex items-end justify-between mb-5 border-b-2 pb-2"
        style={{ borderColor: lineColor }}
      >
        <h2
          className="text-xl md:text-2xl font-bold uppercase tracking-wide"
          style={{ color: lineColor }}
        >
          {t(title, locale)}
        </h2>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <form onSubmit={submitSearch} className="flex-1 min-w-[240px]">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {locale === "en" ? "Search" : "Tìm kiếm"}
          </label>
          <div className="relative">
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={
                locale === "en"
                  ? "Title, slug, excerpt..."
                  : "Tiêu đề, slug, tóm tắt..."
              }
              className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
          </div>
        </form>
        <div className="min-w-[160px]">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {locale === "en" ? "Category" : "Danh mục"}
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              syncUrl({ category: e.target.value });
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-[#1a2436]"
          >
            <option value="">{locale === "en" ? "All" : "Tất cả"}</option>
            {(() => {
              const seen = new Set<string>();
              return categories
                .map((c) => ({
                  c,
                  label: (
                    locale === "en" ? c.name.en || c.name.vi : c.name.vi
                  )
                    .trim()
                    .toLowerCase(),
                }))
                .filter(({ label }) => {
                  if (!label || seen.has(label)) return false;
                  seen.add(label);
                  return true;
                })
                .map(({ c }) => (
                  <option key={c.id} value={c.slug}>
                    {locale === "en" ? c.name.en || c.name.vi : c.name.vi}
                  </option>
                ));
            })()}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {locale === "en" ? "From date" : "Từ ngày"}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              syncUrl({ fromDate: e.target.value });
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {locale === "en" ? "To date" : "Đến ngày"}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              syncUrl({ toDate: e.target.value });
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-12">
          {locale === "en"
            ? "No posts match the filters."
            : "Không có bài viết nào phù hợp."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-5 md:gap-6">
          {items.map((post) => (
            <NewsCard
              key={post.id}
              post={post}
              locale={locale}
              prefix={prefix}
              tagSize={tagSize}
              tagAlign={tagAlign}
            />
          ))}
        </div>
      )}

      {isEditing ? (
        items.length > 0 && (
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4 italic">
            Preview chỉ hiển thị {Math.min(items.length, PAGE_SIZE)} bài đầu.
            Public site sẽ infinite scroll khi user kéo xuống.
          </p>
        )
      ) : (
        <>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loading && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 animate-spin" />
                  {locale === "en" ? "Loading..." : "Đang tải..."}
                </span>
              )}
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
              {locale === "en" ? "End of list." : "Đã hết bài."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
