"use client";

import type { ComponentConfig } from "@puckeditor/core";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMediaUrl } from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";

const formatDate = (
  value: string | null | undefined,
  locale: string,
): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const lang = locale === "en" ? "en-GB" : "vi-VN";
  return date.toLocaleString(lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPublishedHeader = (
  value: string | null | undefined,
  locale: string,
): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const lang = locale === "en" ? "en-GB" : "vi-VN";
  const datePart = date.toLocaleDateString(lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offsetH = Math.floor(Math.abs(offsetMin) / 60);
  return `${datePart} ${timePart} GMT${sign}${offsetH}`;
};

const CATEGORY_LABEL_FALLBACK: Record<string, LocalizedString> = {
  EDUCATIONAL_NEWS: { vi: "Tin học vụ", en: "Education" },
  SCIENTIFIC_INFORMATION: { vi: "Thông tin khoa học", en: "Science" },
  RECRUITMENT: { vi: "Tuyển dụng", en: "Recruitment" },
  EVENT: { vi: "Sự kiện", en: "Event" },
  SCHOLARSHIP: { vi: "Học bổng", en: "Scholarship" },
};

const autoLabel = (label: string) =>
  ({ type: "text", label: `${label} (auto)` }) as const;

const autoTextarea = (label: string) =>
  ({ type: "textarea", label: `${label} (auto)` }) as const;

const POST_LABELS = {
  titleFallback: { vi: "Tiêu đề bài đăng", en: "Post title" },
  coverHint: {
    vi: "Ảnh bìa sẽ hiển thị tại đây",
    en: "Cover image will appear here",
  },
  start: { vi: "Bắt đầu", en: "Start" },
  end: { vi: "Kết thúc", en: "End" },
  location: { vi: "Địa điểm", en: "Location" },
};

export const PostTitle: ComponentConfig<{
  text: string;
  defaultText: LocalizedString;
  alignment: string;
}> = {
  label: "Post Title",
  defaultProps: {
    text: "",
    defaultText: { vi: "Tiêu đề bài đăng", en: "Post title" },
    alignment: "left",
  },
  fields: {
    defaultText: localizedTextField("Placeholder text (template)"),
    text: autoLabel("Injected title"),
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  render: ({ text, defaultText, alignment }) => (
    <PostTitleRender
      text={text}
      defaultText={defaultText}
      alignment={alignment}
    />
  ),
};

function PostTitleRender({
  text,
  defaultText,
  alignment,
}: {
  text: string;
  defaultText: LocalizedString;
  alignment: string;
}) {
  const { locale } = useLocale();
  const placeholder =
    t(defaultText, locale) || t(POST_LABELS.titleFallback, locale);
  const content = text || placeholder;
  return (
    <h1
      data-post-body
      className="text-4xl font-bold text-content-1000 scroll-mt-20 my-4"
      style={{ textAlign: alignment as any }}
    >
      {content}
    </h1>
  );
}

export const PostBody: ComponentConfig<{
  markdown: string;
  defaultMarkdown: LocalizedString;
}> = {
  label: "Post Body",
  defaultProps: {
    markdown: "",
    defaultMarkdown: {
      vi: "## Nội dung bài đăng\n\nPlaceholder — nội dung thực tế sẽ được điền từ trang tạo post.",
      en: "## Post content\n\nPlaceholder — actual content will be filled in from the post editor.",
    },
  },
  fields: {
    defaultMarkdown: localizedTextareaField("Placeholder markdown (template)"),
    markdown: autoTextarea("Injected markdown"),
  },
  render: ({ markdown, defaultMarkdown }) => (
    <PostBodyRender markdown={markdown} defaultMarkdown={defaultMarkdown} />
  ),
};

function PostBodyRender({
  markdown,
  defaultMarkdown,
}: {
  markdown: string;
  defaultMarkdown: LocalizedString;
}) {
  const { locale } = useLocale();
  const source = markdown || t(defaultMarkdown, locale) || "";
  const looksLikeHtml = /<\w+[^>]*>/.test(source.trim());
  if (looksLikeHtml) {
    return (
      <article
        data-post-body
        className="prose prose-slate max-w-none text-content-1000 leading-relaxed my-4 prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored rich text
        dangerouslySetInnerHTML={{ __html: source }}
      />
    );
  }
  return (
    <article
      data-post-body
      className="prose prose-slate max-w-none text-content-1000 leading-relaxed my-4"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </article>
  );
}

export const PostCoverImage: ComponentConfig<{
  src: string;
  alt: string;
  defaultSrc: string;
  defaultAlt: LocalizedString;
  aspectRatio: string;
}> = {
  label: "Post Cover Image",
  defaultProps: {
    src: "",
    alt: "",
    defaultSrc: "",
    defaultAlt: { vi: "Ảnh bìa bài đăng", en: "Post cover image" },
    aspectRatio: "21/9",
  },
  fields: {
    defaultSrc: mediaPickerField("Placeholder cover (template)"),
    defaultAlt: localizedTextField("Placeholder alt"),
    src: autoLabel("Injected cover URL"),
    alt: autoLabel("Injected alt"),
    aspectRatio: {
      type: "select",
      label: "Aspect ratio",
      options: [
        { label: "21:9", value: "21/9" },
        { label: "16:9", value: "16/9" },
        { label: "4:3", value: "4/3" },
        { label: "1:1", value: "1/1" },
      ],
    },
  },
  render: ({ src, alt, defaultSrc, defaultAlt, aspectRatio }) => (
    <PostCoverImageRender
      src={src}
      alt={alt}
      defaultSrc={defaultSrc}
      defaultAlt={defaultAlt}
      aspectRatio={aspectRatio}
    />
  ),
};

function PostCoverImageRender({
  src,
  alt,
  defaultSrc,
  defaultAlt,
  aspectRatio,
}: {
  src: string;
  alt: string;
  defaultSrc: string;
  defaultAlt: LocalizedString;
  aspectRatio: string;
}) {
  const { locale } = useLocale();
  const finalSrc = resolveMediaUrl(src || defaultSrc);
  const finalAlt = alt || t(defaultAlt, locale) || "";
  if (!finalSrc) {
    return (
      <div
        className="w-full rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm my-4"
        style={{ aspectRatio }}
      >
        {t(POST_LABELS.coverHint, locale)}
      </div>
    );
  }
  return (
    <div
      className="relative w-full rounded-lg overflow-hidden my-4"
      style={{ aspectRatio }}
    >
      <Image
        src={finalSrc}
        alt={finalAlt}
        fill
        sizes="(max-width: 768px) 100vw, 800px"
        priority
        className="object-cover"
      />
    </div>
  );
}

type TagChip = { slug: string; name: LocalizedString };

const tagArrayField = {
  type: "array",
  label: "Placeholder tags (template)",
  arrayFields: {
    slug: { type: "text", label: "Slug" },
    name: localizedTextField("Name"),
  },
  getItemSummary: (item: { slug: string; name: LocalizedString }) => {
    if (typeof item.name === "string") return item.name || item.slug || "Tag";
    const first = item.name?.vi || item.name?.en;
    return first || item.slug || "Tag";
  },
} as const;

export const PostTagList: ComponentConfig<{
  tags: TagChip[];
  defaultTags: TagChip[];
}> = {
  label: "Post Tags",
  defaultProps: {
    tags: [],
    defaultTags: [
      { slug: "tag-mau", name: { vi: "Tag mẫu", en: "Sample tag" } },
      { slug: "thong-bao", name: { vi: "Thông báo", en: "Notice" } },
    ],
  },
  fields: {
    defaultTags: tagArrayField,
    tags: { ...tagArrayField, label: "Injected tags (auto)" },
  },
  render: ({ tags, defaultTags }) => (
    <PostTagListRender tags={tags} defaultTags={defaultTags} />
  ),
};

function PostTagListRender({
  tags,
  defaultTags,
}: {
  tags: TagChip[];
  defaultTags: TagChip[];
}) {
  const { locale } = useLocale();
  const list = tags && tags.length ? tags : defaultTags || [];
  if (!list.length) {
    return <div className="hidden" aria-hidden="true" />;
  }
  return (
    <div data-post-body className="flex flex-wrap gap-2 my-3">
      {list.map((tag) => {
        const tagName = t(tag.name, locale) || tag.slug;
        return (
          <span
            key={tag.slug}
            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
          >
            #{tagName}
          </span>
        );
      })}
    </div>
  );
}

export const PostEventInfo: ComponentConfig<{
  startAt: string;
  endAt: string;
  location: string;
  defaultStart: string;
  defaultEnd: string;
  defaultLocation: LocalizedString;
}> = {
  label: "Post Event Info",
  defaultProps: {
    startAt: "",
    endAt: "",
    location: "",
    defaultStart: "",
    defaultEnd: "",
    defaultLocation: { vi: "Địa điểm sự kiện", en: "Event location" },
  },
  fields: {
    defaultStart: { type: "text", label: "Placeholder start (ISO)" },
    defaultEnd: { type: "text", label: "Placeholder end (ISO)" },
    defaultLocation: localizedTextField("Placeholder location"),
    startAt: autoLabel("Injected start"),
    endAt: autoLabel("Injected end"),
    location: autoLabel("Injected location"),
  },
  render: ({
    startAt,
    endAt,
    location,
    defaultStart,
    defaultEnd,
    defaultLocation,
  }) => (
    <PostEventInfoRender
      startAt={startAt}
      endAt={endAt}
      location={location}
      defaultStart={defaultStart}
      defaultEnd={defaultEnd}
      defaultLocation={defaultLocation}
    />
  ),
};

function PostEventInfoRender({
  startAt,
  endAt,
  location,
  defaultStart,
  defaultEnd,
  defaultLocation,
}: {
  startAt: string;
  endAt: string;
  location: string;
  defaultStart: string;
  defaultEnd: string;
  defaultLocation: LocalizedString;
}) {
  const { locale } = useLocale();
  const start = formatDate(startAt || defaultStart, locale);
  const end = formatDate(endAt || defaultEnd, locale);
  const place = location || t(defaultLocation, locale);
  if (!start && !end && !place) {
    return <div className="hidden" aria-hidden="true" />;
  }
  return (
    <div
      data-post-body
      className="rounded-lg border border-gray-200 bg-gray-50 p-4 my-4 space-y-2 text-sm text-content-1000"
    >
      {start ? (
        <div>
          <span className="font-semibold">{t(POST_LABELS.start, locale)}:</span>{" "}
          {start}
        </div>
      ) : null}
      {end ? (
        <div>
          <span className="font-semibold">{t(POST_LABELS.end, locale)}:</span>{" "}
          {end}
        </div>
      ) : null}
      {place ? (
        <div>
          <span className="font-semibold">
            {t(POST_LABELS.location, locale)}:
          </span>{" "}
          {place}
        </div>
      ) : null}
    </div>
  );
}

export const PostHeader: ComponentConfig<{
  text: string;
  defaultText: LocalizedString;
  categoryLabel: string;
  defaultCategoryLabel: LocalizedString;
  publishedAt: string;
}> = {
  label: "Post Header (TT-style)",
  defaultProps: {
    text: "",
    defaultText: { vi: "Tiêu đề bài đăng", en: "Post title" },
    categoryLabel: "",
    defaultCategoryLabel: { vi: "Chuyên mục", en: "Category" },
    publishedAt: "",
  },
  fields: {
    defaultText: localizedTextField("Placeholder title (template)"),
    defaultCategoryLabel: localizedTextField("Placeholder category (template)"),
    text: autoLabel("Injected title"),
    categoryLabel: autoLabel("Injected category label"),
    publishedAt: autoLabel("Injected publishedAt (ISO)"),
  },
  render: ({
    text,
    defaultText,
    categoryLabel,
    defaultCategoryLabel,
    publishedAt,
  }) => (
    <PostHeaderRender
      text={text}
      defaultText={defaultText}
      categoryLabel={categoryLabel}
      defaultCategoryLabel={defaultCategoryLabel}
      publishedAt={publishedAt}
    />
  ),
};

function PostHeaderRender({
  text,
  defaultText,
  categoryLabel,
  defaultCategoryLabel,
  publishedAt,
}: {
  text: string;
  defaultText: LocalizedString;
  categoryLabel: string;
  defaultCategoryLabel: LocalizedString;
  publishedAt: string;
}) {
  const { locale } = useLocale();
  const title = text || t(defaultText, locale);
  const cat = categoryLabel || t(defaultCategoryLabel, locale);
  const dateLine = formatPublishedHeader(publishedAt, locale);
  return (
    <header data-post-body className="border-b border-slate-200 pb-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {cat}
        </span>
        {dateLine ? (
          <time className="text-xs text-slate-500 whitespace-nowrap mt-0.5">
            {dateLine}
          </time>
        ) : null}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-content-1000 leading-tight">
        {title}
      </h1>
    </header>
  );
}

const FONT_SIZE_KEY = "postReaderFontSize";
const FONT_SIZE_LEVELS = [
  { level: 0, scale: 0.4 },
  { level: 1, scale: 0.5 },
  { level: 2, scale: 0.6 },
  { level: 3, scale: 0.7 },
  { level: 4, scale: 0.8 },
  { level: 5, scale: 0.9 },
  { level: 6, scale: 1 },
  { level: 7, scale: 1.2 },
  { level: 8, scale: 1.4 },
  { level: 9, scale: 1.6 },
  { level: 10, scale: 1.8 },
  { level: 11, scale: 2 },
  { level: 12, scale: 2.2 },
];
const DEFAULT_FONT_LEVEL = 6;

const STYLE_TAG_ID = "post-reader-tools-style";

const ensureStyleTag = () => {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  return tag;
};

const applyFontLevel = (level: number) => {
  const found =
    FONT_SIZE_LEVELS.find((l) => l.level === level) ??
    FONT_SIZE_LEVELS[DEFAULT_FONT_LEVEL];
  const s = found.scale;
  const tag = ensureStyleTag();
  // Use `zoom` (works across modern browsers) — scales the entire subtree
  // visually, including text rendered by the prose plugin or HTML content,
  // without fighting Tailwind's `:where(...)` specificity rules.
  tag.textContent = `[data-post-body]{zoom:${s};}`;
};

const TOOL_LABELS = {
  decrease: { vi: "Giảm cỡ chữ", en: "Decrease font" },
  increase: { vi: "Tăng cỡ chữ", en: "Increase font" },
  copyLink: { vi: "Sao chép liên kết", en: "Copy link" },
  copied: { vi: "Đã sao chép!", en: "Copied!" },
  shareFb: { vi: "Chia sẻ Facebook", en: "Share on Facebook" },
};

type GapSize = "none" | "sm" | "md" | "lg" | "xl";
type StickyTop = "sm" | "md" | "lg";

const GAP_TO_PX: Record<GapSize, number> = {
  none: -8,
  sm: 8,
  md: 24,
  lg: 48,
  xl: 80,
};

const STICKY_TOP_TO_PX: Record<StickyTop, number> = {
  sm: 64,
  md: 96,
  lg: 128,
};

export const PostReaderTools: ComponentConfig<{
  enabled: boolean;
  gap: GapSize;
  stickyTop: StickyTop;
}> = {
  label: "Post Reader Tools (sidebar)",
  defaultProps: {
    enabled: true,
    gap: "md",
    stickyTop: "md",
  },
  fields: {
    enabled: {
      type: "radio",
      label: "Hiển thị",
      options: [
        { label: "Có", value: true },
        { label: "Không", value: false },
      ],
    },
    gap: {
      type: "select",
      label: "Khoảng cách với bài viết",
      options: [
        { label: "Không có", value: "none" },
        { label: "Nhỏ", value: "sm" },
        { label: "Vừa (mặc định)", value: "md" },
        { label: "Lớn", value: "lg" },
        { label: "Rất lớn", value: "xl" },
      ],
    },
    stickyTop: {
      type: "select",
      label: "Vị trí tính từ trên",
      options: [
        { label: "Sát đỉnh", value: "sm" },
        { label: "Vừa (mặc định)", value: "md" },
        { label: "Cách xa đỉnh", value: "lg" },
      ],
    },
  },
  render: ({ enabled, gap, stickyTop }) =>
    enabled ? (
      <PostReaderToolsRender gap={gap} stickyTop={stickyTop} />
    ) : (
      <span aria-hidden="true" />
    ),
};

function PostReaderToolsRender({
  gap,
  stickyTop,
}: {
  gap: GapSize;
  stickyTop: StickyTop;
}) {
  const { locale } = useLocale();
  const [level, setLevel] = useState<number>(DEFAULT_FONT_LEVEL);
  const [copied, setCopied] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [leftPx, setLeftPx] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(FONT_SIZE_KEY);
    const initial = saved ? Number.parseInt(saved, 10) : DEFAULT_FONT_LEVEL;
    const safe = Number.isFinite(initial) ? initial : DEFAULT_FONT_LEVEL;
    setLevel(safe);
    applyFontLevel(safe);
    return () => {
      const tag = document.getElementById(STYLE_TAG_ID);
      if (tag) tag.remove();
    };
  }, []);

  useEffect(() => {
    const compute = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = rect.left - 48 - GAP_TO_PX[gap];
      setLeftPx(Math.max(8, next));
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [gap]);

  const changeLevel = (next: number) => {
    const clamped = Math.max(0, Math.min(FONT_SIZE_LEVELS.length - 1, next));
    setLevel(clamped);
    applyFontLevel(clamped);
    window.localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore – clipboard may be blocked
    }
  };

  const onShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=600",
    );
  };

  return (
    <>
      <div ref={anchorRef} aria-hidden="true" className="h-0 w-0" />
      <aside
        aria-label="Reader tools"
        style={{
          top: `${STICKY_TOP_TO_PX[stickyTop]}px`,
          left: leftPx ?? -9999,
        }}
        className="hidden lg:flex flex-col items-center gap-3 fixed z-30 w-12"
      >
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-full shadow-sm py-1.5">
          <button
            type="button"
            onClick={() => changeLevel(level + 1)}
            aria-label={t(TOOL_LABELS.increase, locale)}
            className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
            disabled={level >= FONT_SIZE_LEVELS.length - 1}
          >
            <span className="text-lg leading-none">+</span>
          </button>
          <span className="text-[11px] text-slate-500 font-semibold py-1 select-none">
            aA
          </span>
          <button
            type="button"
            onClick={() => changeLevel(level - 1)}
            aria-label={t(TOOL_LABELS.decrease, locale)}
            className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
            disabled={level <= 0}
          >
            <span className="text-lg leading-none">−</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onCopyLink}
          aria-label={t(TOOL_LABELS.copyLink, locale)}
          title={
            copied
              ? t(TOOL_LABELS.copied, locale)
              : t(TOOL_LABELS.copyLink, locale)
          }
          className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1 1" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1-1" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onShareFacebook}
          aria-label={t(TOOL_LABELS.shareFb, locale)}
          title={t(TOOL_LABELS.shareFb, locale)}
          className="w-10 h-10 rounded-full bg-[#1877F2] text-white shadow-sm flex items-center justify-center hover:opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.45 2.91h-2.33V22c4.78-.79 8.43-4.94 8.43-9.94z" />
          </svg>
        </button>

        {copied ? (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg z-50"
          >
            {t(TOOL_LABELS.copied, locale)}
          </div>
        ) : null}
      </aside>
    </>
  );
}
