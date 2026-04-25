"use client";

import type { ComponentConfig } from "@puckeditor/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMediaUrl } from "@/lib/api";
import { mediaPickerField } from "../fields/media-picker-field";

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
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

export const PostTitle: ComponentConfig<{
  text: string;
  defaultText: string;
  alignment: string;
}> = {
  label: "Post Title",
  defaultProps: {
    text: "",
    defaultText: "Tiêu đề bài đăng",
    alignment: "left",
  },
  fields: {
    defaultText: { type: "text", label: "Placeholder text (template)" },
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
  render: ({ text, defaultText, alignment }) => {
    const content = text || defaultText || "Tiêu đề bài đăng";
    return (
      <h1
        className="text-4xl font-bold text-content-1000 scroll-mt-20 my-4"
        style={{ textAlign: alignment as any }}
      >
        {content}
      </h1>
    );
  },
};

export const PostBody: ComponentConfig<{
  markdown: string;
  defaultMarkdown: string;
}> = {
  label: "Post Body",
  defaultProps: {
    markdown: "",
    defaultMarkdown:
      "## Nội dung bài đăng\n\nPlaceholder — nội dung thực tế sẽ được điền từ trang tạo post.",
  },
  fields: {
    defaultMarkdown: {
      type: "textarea",
      label: "Placeholder markdown (template)",
    },
    markdown: autoTextarea("Injected markdown"),
  },
  render: ({ markdown, defaultMarkdown }) => {
    const source = markdown || defaultMarkdown || "";
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
  },
};

export const PostCoverImage: ComponentConfig<{
  src: string;
  alt: string;
  defaultSrc: string;
  defaultAlt: string;
  aspectRatio: string;
}> = {
  label: "Post Cover Image",
  defaultProps: {
    src: "",
    alt: "",
    defaultSrc: "",
    defaultAlt: "Ảnh bìa bài đăng",
    aspectRatio: "21/9",
  },
  fields: {
    defaultSrc: mediaPickerField("Placeholder cover (template)"),
    defaultAlt: { type: "text", label: "Placeholder alt" },
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
  render: ({ src, alt, defaultSrc, defaultAlt, aspectRatio }) => {
    const finalSrc = resolveMediaUrl(src || defaultSrc);
    const finalAlt = alt || defaultAlt || "";
    if (!finalSrc) {
      return (
        <div
          className="w-full rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm my-4"
          style={{ aspectRatio }}
        >
          Ảnh bìa sẽ hiển thị tại đây
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
  },
};

type TagChip = { slug: string; name: string };

const tagArrayField = {
  type: "array",
  label: "Placeholder tags (template)",
  arrayFields: {
    slug: { type: "text", label: "Slug" },
    name: { type: "text", label: "Name" },
  },
  getItemSummary: (item: TagChip) => item.name || item.slug || "Tag",
} as const;

export const PostTagList: ComponentConfig<{
  tags: TagChip[];
  defaultTags: TagChip[];
}> = {
  label: "Post Tags",
  defaultProps: {
    tags: [],
    defaultTags: [
      { slug: "tag-mau", name: "Tag mẫu" },
      { slug: "thong-bao", name: "Thông báo" },
    ],
  },
  fields: {
    defaultTags: tagArrayField,
    tags: { ...tagArrayField, label: "Injected tags (auto)" },
  },
  render: ({ tags, defaultTags }) => {
    const list = tags && tags.length ? tags : defaultTags || [];
    if (!list.length) {
      return <div className="hidden" aria-hidden="true" />;
    }
    return (
      <div className="flex flex-wrap gap-2 my-3">
        {list.map((tag) => (
          <span
            key={tag.slug}
            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
          >
            #{tag.name || tag.slug}
          </span>
        ))}
      </div>
    );
  },
};

export const PostEventInfo: ComponentConfig<{
  startAt: string;
  endAt: string;
  location: string;
  defaultStart: string;
  defaultEnd: string;
  defaultLocation: string;
}> = {
  label: "Post Event Info",
  defaultProps: {
    startAt: "",
    endAt: "",
    location: "",
    defaultStart: "",
    defaultEnd: "",
    defaultLocation: "Địa điểm sự kiện",
  },
  fields: {
    defaultStart: { type: "text", label: "Placeholder start (ISO)" },
    defaultEnd: { type: "text", label: "Placeholder end (ISO)" },
    defaultLocation: { type: "text", label: "Placeholder location" },
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
  }) => {
    const start = formatDate(startAt || defaultStart);
    const end = formatDate(endAt || defaultEnd);
    const place = location || defaultLocation;
    if (!start && !end && !place) {
      return <div className="hidden" aria-hidden="true" />;
    }
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 my-4 space-y-2 text-sm text-content-1000">
        {start ? (
          <div>
            <span className="font-semibold">Bắt đầu:</span> {start}
          </div>
        ) : null}
        {end ? (
          <div>
            <span className="font-semibold">Kết thúc:</span> {end}
          </div>
        ) : null}
        {place ? (
          <div>
            <span className="font-semibold">Địa điểm:</span> {place}
          </div>
        ) : null}
      </div>
    );
  },
};
