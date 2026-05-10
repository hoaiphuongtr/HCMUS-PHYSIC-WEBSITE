"use client";

import type { ComponentConfig } from "@puckeditor/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMediaUrl } from "@/lib/api";
import { t, type LocalizedString } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { mediaPickerField } from "../fields/media-picker-field";
import {
  localizedTextField,
  localizedTextareaField,
} from "../fields/localized-text-field";

const formatDate = (value: string | null | undefined, locale: string): string => {
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
  const placeholder = t(defaultText, locale) || t(POST_LABELS.titleFallback, locale);
  const content = text || placeholder;
  return (
    <h1
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
        className="prose prose-slate max-w-none text-base text-content-1000 leading-relaxed my-4 prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored rich text
        dangerouslySetInnerHTML={{ __html: source }}
      />
    );
  }
  return (
    <article className="prose prose-slate max-w-none text-base text-content-1000 leading-relaxed my-4">
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
    <img
      src={finalSrc}
      alt={finalAlt}
      className="w-full rounded-lg object-cover my-4"
      style={{ aspectRatio }}
    />
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
    <div className="flex flex-wrap gap-2 my-3">
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
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 my-4 space-y-2 text-sm text-content-1000">
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
