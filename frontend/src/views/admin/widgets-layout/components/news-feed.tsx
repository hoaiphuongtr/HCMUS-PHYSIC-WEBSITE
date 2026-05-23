"use client";

import type { ComponentConfig } from "@puckeditor/core";
import {
  Calendar,
  CalendarPlus,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type PostPublicCard, postPublicApi, resolveMediaUrl } from "@/lib/api";
import { t, type LocalizedString } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import { localizedTextField } from "../fields/localized-text-field";

const CATEGORY_LABELS: Record<
  string,
  { vi: string; en: string; color: string }
> = {
  EDUCATIONAL_NEWS: {
    vi: "Tin học vụ",
    en: "Educational News",
    color: "#2563eb",
  },
  SCIENTIFIC_INFORMATION: {
    vi: "Thông tin khoa học",
    en: "Scientific Information",
    color: "#7c3aed",
  },
  RECRUITMENT: { vi: "Tuyển dụng", en: "Recruitment", color: "#dc2626" },
  EVENT: { vi: "Sự kiện", en: "Event", color: "#059669" },
  SCHOLARSHIP: { vi: "Học bổng", en: "Scholarship", color: "#d97706" },
};

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
};

function NewsCard({ post, locale, prefix, showEventTime }: NewsCardProps) {
  const cat = CATEGORY_LABELS[post.category];
  const catLabel = cat ? (locale === "en" ? cat.en : cat.vi) : post.category;
  const catColor = cat?.color ?? "#2563eb";
  const dateText = showEventTime
    ? formatDate(post.eventStartAt, locale)
    : formatDate(post.publishedAt, locale);
  const title = localizeWithFallback(post.title, locale);
  const href = post.layoutSlug ? `${prefix}/${post.layoutSlug}` : null;

  const cardInner = (
    <article className="group relative h-full flex flex-col bg-white">
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100">
        {post.coverUrl ? (
          <img
            src={resolveMediaUrl(post.coverUrl)}
            alt={post.coverAlt || title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <ImageIcon className="w-9 h-9 text-slate-400" />
          </div>
        )}
      </div>
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <div
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: catColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: catColor }}
          />
          <span>{catLabel}</span>
        </div>
        <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 line-clamp-2">
          {title}
        </h3>
        {dateText && (
          <p className="text-[12px] text-slate-500 mt-2">{dateText}</p>
        )}
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
  const cat = CATEGORY_LABELS[post.category];
  const catLabel = cat ? (locale === "en" ? cat.en : cat.vi) : post.category;
  const catColor = cat?.color ?? "#059669";
  const dateText = formatDate(post.eventStartAt, locale);
  const title = localizeWithFallback(post.title, locale);
  const href = post.layoutSlug ? `${prefix}/${post.layoutSlug}` : null;
  const gcalUrl = buildGCalUrl(post, locale);
  const ariaLabel =
    locale === "en" ? "Add to Google Calendar" : "Thêm vào Google Calendar";

  return (
    <article className="group relative h-full flex flex-col bg-white">
      {href ? (
        <Link href={href} className="block">
          <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100">
            {post.coverUrl ? (
              <img
                src={resolveMediaUrl(post.coverUrl)}
                alt={post.coverAlt || title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <Calendar className="w-9 h-9 text-slate-400" />
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-md bg-slate-100">
          {post.coverUrl ? (
            <img
              src={resolveMediaUrl(post.coverUrl)}
              alt={post.coverAlt || title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <Calendar className="w-9 h-9 text-slate-400" />
            </div>
          )}
        </div>
      )}
      <div className="pt-3 pb-1 flex flex-col flex-1 relative pr-12">
        <div
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: catColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: catColor }}
          />
          <span>{catLabel}</span>
        </div>
        {href ? (
          <Link href={href}>
            <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 line-clamp-2">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-slate-900 line-clamp-2">
            {title}
          </h3>
        )}
        {dateText && (
          <p className="text-[12px] text-slate-500 mt-2">{dateText}</p>
        )}
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-0 bottom-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
}> = {
  label: "Latest News (auto)",
  defaultProps: {
    title: { vi: "Tin mới nhất", en: "Latest News" },
    viewAllLabel: { vi: "Xem tất cả", en: "View all" },
    viewAllUrl: "/tin-tuc",
    accentColor: "#1e40af",
    limit: 4,
    posts: [],
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
    posts: {
      type: "text",
      label: "Posts (auto-synced — do not edit)",
    } as any,
  },
  render: ({ title, viewAllLabel, viewAllUrl, accentColor, limit, posts }) => (
    <LatestNewsAutoRender
      title={title}
      viewAllLabel={viewAllLabel}
      viewAllUrl={viewAllUrl}
      accentColor={accentColor}
      limit={limit}
      posts={posts || []}
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
}: {
  title: LocalizedString;
  viewAllLabel: LocalizedString;
  viewAllUrl: string;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
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
        <p className="text-sm text-slate-400">
          {locale === "en"
            ? "No news yet. Snapshot will populate after publishing a post."
            : "Chưa có tin tức nào. Snapshot sẽ tự cập nhật khi có bài đăng được publish."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {data.map((post) => (
            <NewsCard
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

export const UpcomingEventsAuto: ComponentConfig<{
  title: LocalizedString;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
}> = {
  label: "Upcoming Events (auto)",
  defaultProps: {
    title: { vi: "Sự kiện sắp tới", en: "Upcoming Events" },
    accentColor: "#059669",
    limit: 4,
    posts: [],
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
  },
  render: ({ title, accentColor, limit, posts }) => (
    <UpcomingEventsAutoRender
      title={title}
      accentColor={accentColor}
      limit={limit}
      posts={posts || []}
    />
  ),
};

function UpcomingEventsAutoRender({
  title,
  accentColor,
  limit,
  posts,
}: {
  title: LocalizedString;
  accentColor: string;
  limit: number;
  posts: PostPublicCard[];
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
        <p className="text-sm text-slate-400">
          {locale === "en"
            ? "No upcoming events. Snapshot will populate after publishing an event."
            : "Hiện chưa có sự kiện sắp tới. Snapshot sẽ tự cập nhật khi publish sự kiện."}
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

const ALL_CATEGORIES = [
  { value: "", labelVi: "Tất cả", labelEn: "All" },
  {
    value: "EDUCATIONAL_NEWS",
    labelVi: "Tin học vụ",
    labelEn: "Educational News",
  },
  {
    value: "SCIENTIFIC_INFORMATION",
    labelVi: "Thông tin khoa học",
    labelEn: "Scientific Information",
  },
  { value: "RECRUITMENT", labelVi: "Tuyển dụng", labelEn: "Recruitment" },
  { value: "EVENT", labelVi: "Sự kiện", labelEn: "Event" },
  { value: "SCHOLARSHIP", labelVi: "Học bổng", labelEn: "Scholarship" },
];

const PAGE_SIZE = 12;

export const NewsListPaginated: ComponentConfig<{
  title: LocalizedString;
  accentColor: string;
}> = {
  label: "News List Paginated",
  defaultProps: {
    title: { vi: "Tin tức", en: "News" },
    accentColor: "#1e40af",
  },
  fields: {
    title: localizedTextField("Section title"),
    accentColor: colorField("Accent Color"),
  },
  render: ({ title, accentColor, puck }) => (
    <NewsListPaginatedRender
      title={title}
      accentColor={accentColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function NewsListPaginatedRender({
  title,
  accentColor,
  isEditing,
}: {
  title: LocalizedString;
  accentColor: string;
  isEditing: boolean;
}) {
  const { locale, prefix } = useLocalePrefix();
  const [items, setItems] = useState<PostPublicCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
            setItems((prev) => [...prev, ...res.items]);
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
    setSearch(searchDraft.trim());
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
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
              className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
          </div>
        </form>
        <div className="min-w-[160px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {locale === "en" ? "Category" : "Danh mục"}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {locale === "en" ? c.labelEn : c.labelVi}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {locale === "en" ? "From date" : "Từ ngày"}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {locale === "en" ? "To date" : "Đến ngày"}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-sm text-slate-400 text-center py-12">
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
            />
          ))}
        </div>
      )}

      {isEditing ? (
        items.length > 0 && (
          <p className="text-center text-[11px] text-slate-400 py-4 italic">
            Preview chỉ hiển thị {Math.min(items.length, PAGE_SIZE)} bài đầu.
            Public site sẽ infinite scroll khi user kéo xuống.
          </p>
        )
      ) : (
        <>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loading && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
                  {locale === "en" ? "Loading..." : "Đang tải..."}
                </span>
              )}
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-center text-xs text-slate-400 py-6">
              {locale === "en" ? "End of list." : "Đã hết bài."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
