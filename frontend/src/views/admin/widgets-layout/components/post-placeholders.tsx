"use client";

import type { ComponentConfig } from "@puckeditor/core";
import Image from "next/image";
import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMediaUrl } from "@/lib/api";

// Ảnh thân bài di trú đi qua bộ tối ưu ảnh của Next: gốc PNG/JPEG hàng trăm KB
// được thu về kích thước hiển thị + WebP/AVIF, giảm hàng chục lần dung lượng tải.
// Tham số url do CHÍNH máy chủ Next fetch (không phải trình duyệt); trên host NAT
// không hairpin, container không tự với tới IP công khai của nó nên cho phép bake
// một origin nội bộ (vd http://backend:3001) riêng cho lượt fetch của bộ tối ưu.
const OPTIMIZER_FETCH_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_FETCH_ORIGIN;
const PUBLIC_MEDIA_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const optimizedBodyImageUrl = (src: string): string => {
  const abs = resolveMediaUrl(src);
  if (!/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(src)) return abs;
  const fetchUrl =
    OPTIMIZER_FETCH_ORIGIN && abs.startsWith(PUBLIC_MEDIA_ORIGIN)
      ? OPTIMIZER_FETCH_ORIGIN + abs.slice(PUBLIC_MEDIA_ORIGIN.length)
      : abs;
  return `/_next/image?url=${encodeURIComponent(fetchUrl)}&w=1080&q=70`;
};

import { DynamicIcon } from "@/components/admin/icons";
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
      className="text-4xl font-bold text-content-1000 dark:text-slate-100 scroll-mt-20 my-4"
      style={{ textAlign: alignment as any }}
    >
      {content}
    </h1>
  );
}

export const PostBody: ComponentConfig<{
  markdown: string;
  defaultMarkdown: LocalizedString;
  injected?: boolean;
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
  render: ({ markdown, defaultMarkdown, injected }) => (
    <PostBodyRender
      markdown={markdown}
      defaultMarkdown={defaultMarkdown}
      injected={!!injected}
    />
  ),
};

function PostBodyRender({
  markdown,
  defaultMarkdown,
  injected,
}: {
  markdown: string;
  defaultMarkdown: LocalizedString;
  injected: boolean;
}) {
  const { locale } = useLocale();
  if (injected && !markdown) {
    // Bài di trú không có nội dung nguồn: không để trang trống trơn.
    return (
      <p className="text-slate-500 dark:text-slate-400 italic py-8 text-center">
        {locale === "en"
          ? "This article's content is being updated."
          : "Nội dung bài viết đang được cập nhật."}
      </p>
    );
  }
  const rawSource = markdown || t(defaultMarkdown, locale) || "";
  const source = rawSource
    .replace(
      /<iframe[^>]*src=["']https?:\/\/phys\.hcmus\.edu\.vn[^"']*["'][^>]*><\/iframe>/gi,
      "",
    )
    // Relative /uploads/* srcs (migrated legacy media) must point at the API
    // host, same as cover images — otherwise body <img>/<iframe> 404 against the
    // public origin. Mirrors resolveMediaUrl used for PostCoverImage.
    .replace(
      /(<(?:img|iframe)[^>]+src=["'])(\/uploads\/[^"']+)(["'])/gi,
      (_m, pre: string, src: string, post: string) =>
        `${pre}${pre.startsWith("<img") ? optimizedBodyImageUrl(src) : resolveMediaUrl(src)}${post}`,
    )
    .replace(/<img(?![^>]*\bloading=)/gi, (() => {
      let imgIdx = 0;
      return () =>
        ++imgIdx <= 1 ? '<img decoding="async" ' : '<img loading="lazy" decoding="async" ';
    })())
    // Đánh dấu BẢNG DỮ LIỆU (có viền / border-color trên ô / MsoTableGrid) bằng
    // data-grid để CSS ép table-layout:fixed;width:100% CHỈ cho các bảng này —
    // bảng bố cục không viền (vd ảnh + chú thích cạnh nhau) giữ nguyên auto. Mục
    // đích: bảng dữ liệu luôn CO VỪA cột, không tràn → không mất đường kẻ/nội dung
    // ở màn hình hẹp hay khi zoom (100%/150%). Non-greedy: bảng lồng nhau hiếm gặp.
    .replace(
      /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
      (m: string, attrs: string, inner: string) => {
        const isGrid =
          /\bborder\s*=/.test(attrs) ||
          /MsoTableGrid/.test(attrs) ||
          /border-color/i.test(inner);
        if (!isGrid) return m;
        // Bảng ảnh (nhân sự) cần table-layout:fixed để ảnh co vừa cột; bảng chữ
        // (tuyển sinh) cần BỎ width cứng để cột co theo nội dung — hai cách ngược
        // nhau, nên phân loại theo có <img> hay không.
        const kind = /<img/i.test(inner) ? "img" : "text";
        return `<table${attrs} data-grid="${kind}">${inner}</table>`;
      },
    );
  const looksLikeHtml = /<\w+[^>]*>/.test(source.trim());
  if (looksLikeHtml) {
    return (
      <>
        <style>{`
          [data-post-body],
          [data-post-body] *:not(a):not(a *) {
            font-family: inherit !important;
            background: transparent !important;
            line-height: inherit;
          }
          /* Màu chữ: KHÔNG ép !important để màu inline do người dùng chọn
             (<span style="color:…"> từ trình soạn thảo) hiển thị đúng. Chỉ đặt
             mặc định kế thừa cho phần tử KHÔNG có màu inline; thẻ <font color>
             (định dạng cũ, độ ưu tiên thấp) vẫn bị chuẩn hoá về màu chủ đề. */
          [data-post-body],
          [data-post-body] *:not(a):not(a *) {
            color: inherit;
          }
          /* Normalise font-size on EVERY non-heading element (incl. <b>/<strong>/
             <font>/<small> that legacy Word-export markup uses) so quoted/bold text
             doesn't render tiny and inconsistent — especially on mobile. */
          [data-post-body] *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6) {
            font-size: inherit !important;
          }
          /* Chặn tràn ngang: nội dung dán từ Word thường có <span> định dạng cứng
             (Verdana/line-height:115%…) rộng quá khổ và là inline nên max-width
             không ghì được → cả trang cuộn ngang / thu nhỏ, ảnh trông "co lại".
             Clip trong khung bài + ngắt từ dài để khoá bề rộng theo cột. */
          [data-post-body] {
            overflow-x: clip;
            overflow-wrap: break-word;
            word-break: break-word;
          }
          [data-post-body] iframe,
          [data-post-body] embed,
          [data-post-body] object {
            display: block;
            width: 100%;
            max-width: 100%;
            min-height: 600px;
            border: 0;
          }
          [data-post-body] img {
            max-width: 100% !important;
            /* KHÔNG ép width:auto — giữ thuộc tính width/height của ảnh để trình
               duyệt tính aspect-ratio và giữ chỗ trước khi ảnh tải xong (tránh CLS
               khi tải nguội). max-width:100% vẫn co ảnh vừa cột trên mobile. */
            height: auto !important;
            display: inline-block;
          }
          [data-post-body] table {
            display: block;
            overflow-x: auto;
            max-width: 100%;
            /* overflow-x:auto cũng cắt 1px theo chiều dọc → đường kẻ dưới cùng
               của hàng cuối bị mất. Chừa 1px để gridline không bị khung cuộn cắt. */
            padding-bottom: 1px;
          }
          @media (max-width: 768px) {
            [data-post-body] p,
            [data-post-body] li {
              text-align: left !important;
              text-indent: 0 !important;
              word-break: break-word;
            }
          }
        `}</style>
        <article
          data-post-body
          className="prose prose-slate dark:prose-invert max-w-none leading-relaxed my-4 prose-table:border prose-th:border prose-td:border prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored rich text
          dangerouslySetInnerHTML={{ __html: source }}
        />
      </>
    );
  }
  return (
    <article
      data-post-body
      className="prose prose-slate max-w-none text-content-1000 dark:text-slate-100 leading-relaxed my-4"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </article>
  );
}

// ── LegacyHtml ────────────────────────────────────────────────────────────────
// Faithful renderer for migrated legacy page bodies (TinyMCE HTML). Unlike
// PostBody it does NOT normalise away the original styling — it preserves inline
// colors, backgrounds, fonts, table borders and layout so migrated pages mimic
// the legacy site 1-to-1. It only: resolves /uploads/* media to the API host,
// makes media responsive, and restores list markers + bordered-table gridlines
// that Tailwind's preflight strips.
export function LegacyHtmlRender({
  html,
  injected,
}: {
  html: LocalizedString;
  injected: boolean;
}) {
  const { locale } = useLocale();
  const raw = t(html, locale) || "";
  if (injected && !raw.trim()) return null;
  const source = raw.replace(
    /(<(?:img|iframe)[^>]+src=["'])(\/uploads\/[^"']+)(["'])/gi,
    (_m, pre: string, src: string, post: string) =>
      `${pre}${pre.startsWith("<img") ? optimizedBodyImageUrl(src) : resolveMediaUrl(src)}${post}`,
  )
    .replace(/<img(?![^>]*\bloading=)/gi, (() => {
      let imgIdx = 0;
      return () =>
        ++imgIdx <= 1 ? '<img decoding="async" ' : '<img loading="lazy" decoding="async" ';
    })())
    // Đánh dấu BẢNG DỮ LIỆU (có viền / border-color trên ô / MsoTableGrid) bằng
    // data-grid để CSS ép table-layout:fixed;width:100% CHỈ cho các bảng này —
    // bảng bố cục không viền (vd ảnh + chú thích cạnh nhau) giữ nguyên auto. Mục
    // đích: bảng dữ liệu luôn CO VỪA cột, không tràn → không mất đường kẻ/nội dung
    // ở màn hình hẹp hay khi zoom (100%/150%). Non-greedy: bảng lồng nhau hiếm gặp.
    .replace(
      /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
      (m: string, attrs: string, inner: string) => {
        const isGrid =
          /\bborder\s*=/.test(attrs) ||
          /MsoTableGrid/.test(attrs) ||
          /border-color/i.test(inner);
        if (!isGrid) return m;
        // Bảng ảnh (nhân sự) cần table-layout:fixed để ảnh co vừa cột; bảng chữ
        // (tuyển sinh) cần BỎ width cứng để cột co theo nội dung — hai cách ngược
        // nhau, nên phân loại theo có <img> hay không.
        const kind = /<img/i.test(inner) ? "img" : "text";
        return `<table${attrs} data-grid="${kind}">${inner}</table>`;
      },
    );
  return (
    <div className="legacy-content my-4">
      <style>{`
        .legacy-content { max-width: 100%; overflow-wrap: break-word; line-height: 1.65; color: #1f2937; }
        /* height:auto !important ĐÈ chiều cao cố định trong inline style (vd ảnh
           nhân sự "width:120px;height:150px"): khi ô bảng co hẹp lúc zoom 125/200%,
           max-width kéo bề rộng nhỏ lại — nếu chiều cao vẫn cố định thì ảnh bị
           DÃN DỌC. Ép height:auto để luôn giữ đúng tỉ lệ. */
        .legacy-content img { max-width: 100%; height: auto !important; }
        .legacy-content iframe, .legacy-content embed, .legacy-content object {
          max-width: 100%; width: 100%; min-height: 500px; border: 0;
        }
        .legacy-content table { max-width: 100%; border-collapse: collapse; }
        /* Viền cả trên phần tử <table> để đường kẻ ngoài cùng (dòng/cột cuối)
           không bị cắt khi bảng nằm trong khung cuộn ngang (overflow). */
        .legacy-content table[border], .legacy-content table.MsoTableGrid {
          border: 1px solid #111827;
        }
        .legacy-content table[border] td, .legacy-content table[border] th,
        .legacy-content table.MsoTableGrid td, .legacy-content table.MsoTableGrid th {
          border: 1px solid #111827; padding: 6px 10px;
        }
        /* Bảng Joomla/TinyMCE (vd trang tuyển sinh) đặt inline chỉ "border-color"
           trên ô mà KHÔNG có border-style/width — dựa vào CSS "td{border:1px solid}"
           của site cũ. Thiếu nó thì ô không có viền thật: các "đường kẻ" chỉ là khe
           cellspacing nên đường kẻ DƯỚI CÙNG (không có khe bên dưới) biến mất. Cấp
           lại width+style, GIỮ màu inline (dùng border-width/style, không dùng
           shorthand để không ghi đè border-color inline). */
        .legacy-content td[style*="border-color"],
        .legacy-content th[style*="border-color"] {
          border-width: 1px; border-style: solid; padding: 6px 10px;
        }
        /* Trên màn hình hẹp (laptop, hoặc khi zoom trình duyệt) cột nội dung co lại;
           nếu min-content của bảng > bề rộng cột, bảng KHÔNG co được → tràn ra ngoài
           và khung cuộn ngang cắt mất viền/đường kẻ ngoài cùng bên phải. Cho phép ô
           ngắt từ khi cần (overflow-wrap:anywhere) để min-content nhỏ lại, bảng co
           vừa cột → không tràn, không cuộn, mọi đường kẻ (kể cả cột cuối) đều hiện. */
        .legacy-content td, .legacy-content th { overflow-wrap: anywhere; }
        /* Bảng CHỮ: bỏ width cứng trên ô (vd width:90px) để cột co theo nội dung
           (kết hợp overflow-wrap) → bảng vừa cột, giữ tỉ lệ tự nhiên, không tràn. */
        .legacy-content table[data-grid="text"] td,
        .legacy-content table[data-grid="text"] th { width: auto !important; }
        /* Bảng ẢNH (nhân sự): fixed + 100% để ảnh (max-width:100%) co vừa cột,
           không đẩy bảng rộng quá cột → không cắt cột/nội dung khi zoom. */
        .legacy-content table[data-grid="img"] { table-layout: fixed; width: 100%; }
        .legacy-content ul { list-style: disc outside; padding-left: 1.5rem; margin: 0.5rem 0; }
        .legacy-content ol { list-style: decimal outside; padding-left: 1.5rem; margin: 0.5rem 0; }
        .legacy-content li { margin: 0.25rem 0; }
        .legacy-content p { margin: 0.6rem 0; }
        .legacy-content a { color: #1d4ed8; text-decoration: underline; }
        .legacy-content h1, .legacy-content h2, .legacy-content h3,
        .legacy-content h4, .legacy-content h5 { font-weight: 700; margin: 1rem 0 0.5rem; line-height: 1.3; }
        .legacy-content > * { max-width: 100%; }
        /* KHÔNG dùng display:block cho bảng ở mobile — nó tách border-collapse làm
           mất đường kẻ ngoài. Bảng rộng đã được cuộn ngang bởi khung <main
           overflow-x-auto> bao ngoài, nên chỉ cần cho phép tràn để cuộn. */
        @media (max-width: 768px) {
          .legacy-content table { white-space: nowrap; }
        }
      `}</style>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: migrated legacy rich text */}
      <div dangerouslySetInnerHTML={{ __html: source }} />
    </div>
  );
}

export const LegacyHtml: ComponentConfig<{
  html: LocalizedString;
  injected?: boolean;
}> = {
  label: "Legacy HTML",
  defaultProps: { html: { vi: "", en: "" }, injected: false },
  fields: {
    html: localizedTextareaField("Legacy HTML"),
    injected: {
      type: "radio",
      label: "Injected",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: ({ html, injected }) => (
    <LegacyHtmlRender html={html} injected={!!injected} />
  ),
};

export const PostCoverImage: ComponentConfig<{
  src: string;
  alt: string;
  defaultSrc: string;
  defaultAlt: LocalizedString;
  aspectRatio: string;
  injected?: boolean;
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
  render: ({ src, alt, defaultSrc, defaultAlt, aspectRatio, injected }) => (
    <PostCoverImageRender
      src={src}
      alt={alt}
      defaultSrc={defaultSrc}
      defaultAlt={defaultAlt}
      aspectRatio={aspectRatio}
      injected={!!injected}
    />
  ),
};

function PostCoverImageRender({
  src,
  alt,
  defaultSrc,
  defaultAlt,
  aspectRatio,
  injected,
}: {
  src: string;
  alt: string;
  defaultSrc: string;
  defaultAlt: LocalizedString;
  aspectRatio: string;
  injected: boolean;
}) {
  const { locale } = useLocale();
  // Trang chi tiết bài (injected=true) KHÔNG hiển thị ảnh bìa nữa: ảnh bìa chỉ
  // dùng làm thumbnail (trang chủ/danh sách) + og:image khi share, tránh lặp lại
  // to đùng ở đầu bài. Editor template (injected=false) vẫn hiện placeholder để
  // người soạn thấy bố cục.
  if (injected) return null;
  // Ảnh bìa cũng qua bộ tối ưu: gốc legacy có thể là PNG hàng trăm KB và
  // chính nó là ứng viên LCP nên hưởng lợi nhiều nhất từ WebP thu gọn.
  const finalSrc = optimizedBodyImageUrl(src || defaultSrc);
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
      className="w-full rounded-lg overflow-hidden my-4 bg-slate-50 dark:bg-[#121a2b] flex items-center justify-center"
      style={{ aspectRatio: aspectRatio || "16/9" }}
    >
      {/** biome-ignore lint/performance/noImgElement: needs natural aspect, not fill */}
      {/* Ảnh bìa là ứng viên LCP đầu trang: nạp sớm + giữ chỗ theo tỷ lệ để không gây CLS. */}
      <img
        src={finalSrc}
        alt={finalAlt}
        decoding="async"
        fetchPriority="high"
        className="max-w-full max-h-full w-auto h-auto object-contain"
      />
    </div>
  );
}

type TagChip = { slug: string; name: LocalizedString; icon?: string | null };

const tagArrayField = {
  type: "array",
  label: "Placeholder tags (template)",
  arrayFields: {
    slug: { type: "text", label: "Slug" },
    name: localizedTextField("Name"),
    icon: { type: "text", label: "Icon (image URL or Material Symbol)" },
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
  injected?: boolean;
  iconSize?: number;
}> = {
  label: "Post Tags",
  defaultProps: {
    tags: [],
    iconSize: 50,
    defaultTags: [
      { slug: "tag-mau", name: { vi: "Tag mẫu", en: "Sample tag" } },
      { slug: "thong-bao", name: { vi: "Thông báo", en: "Notice" } },
    ],
  },
  fields: {
    iconSize: {
      type: "number",
      label: "Kích thước icon (px)",
      min: 16,
      max: 240,
    },
    defaultTags: tagArrayField,
    tags: { ...tagArrayField, label: "Injected tags (auto)" },
  },
  render: ({ tags, defaultTags, injected, iconSize }) => (
    <PostTagListRender
      tags={tags}
      defaultTags={defaultTags}
      injected={injected}
      iconSize={iconSize}
    />
  ),
};

function PostTagListRender({
  tags,
  defaultTags,
  injected,
  iconSize,
}: {
  tags: TagChip[];
  defaultTags: TagChip[];
  injected?: boolean;
  iconSize?: number;
}) {
  const { locale } = useLocale();
  const size = iconSize && iconSize > 0 ? iconSize : 50;
  // Once a post is injected, trust its tags verbatim — even an empty array
  // (post had its tags removed) must render nothing, not fall back to the
  // template's sample tags. defaultTags are only for the un-injected preview.
  const list = injected ? tags || [] : tags && tags.length ? tags : defaultTags || [];
  if (!list.length) {
    return <div className="hidden" aria-hidden="true" />;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 my-3">
      {list.map((tag) => {
        const tagName = t(tag.name, locale) || tag.slug;
        const icon = tag.icon;
        const isImg = icon ? /^(https?:|\/uploads)/.test(icon) : false;
        // Image-icon tags (e.g. SDG badges) render as the image alone — no pill,
        // no "#name" — small and inline, like the faculty site presents them.
        if (isImg && icon) {
          return (
            // biome-ignore lint/performance/noImgElement: external tag badge, not a Next asset
            <img
              key={tag.slug}
              src={resolveMediaUrl(icon)}
              alt={tagName}
              title={tagName}
              className="object-contain rounded-sm"
              style={{
                height: `${size}px`,
                width: "auto",
                maxWidth: `${size}px`,
              }}
            />
          );
        }
        return (
          <span
            key={tag.slug}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
          >
            {icon && <DynamicIcon name={icon} className="w-3.5 h-3.5" />}#
            {tagName}
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
      className="rounded-lg border border-gray-200 bg-gray-50 p-4 my-4 space-y-2 text-sm text-content-1000 dark:text-slate-100"
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
  categorySlug: string;
  defaultCategoryLabel: LocalizedString;
  publishedAt: string;
}> = {
  label: "Post Header",
  defaultProps: {
    text: "",
    defaultText: { vi: "Tiêu đề bài đăng", en: "Post title" },
    categoryLabel: "",
    categorySlug: "",
    defaultCategoryLabel: { vi: "Chuyên mục", en: "Category" },
    publishedAt: "",
  },
  fields: {
    defaultText: localizedTextField("Placeholder title (template)"),
    defaultCategoryLabel: localizedTextField("Placeholder category (template)"),
    text: autoLabel("Injected title"),
    categoryLabel: autoLabel("Injected category label"),
    categorySlug: autoLabel("Injected category slug"),
    publishedAt: autoLabel("Injected publishedAt (ISO)"),
  },
  render: ({
    text,
    defaultText,
    categoryLabel,
    categorySlug,
    defaultCategoryLabel,
    publishedAt,
  }) => (
    <PostHeaderRender
      text={text}
      defaultText={defaultText}
      categoryLabel={categoryLabel}
      categorySlug={categorySlug}
      defaultCategoryLabel={defaultCategoryLabel}
      publishedAt={publishedAt}
    />
  ),
};

function PostHeaderRender({
  text,
  defaultText,
  categoryLabel,
  categorySlug,
  defaultCategoryLabel,
  publishedAt,
}: {
  text: string;
  defaultText: LocalizedString;
  categoryLabel: string;
  categorySlug: string;
  defaultCategoryLabel: LocalizedString;
  publishedAt: string;
}) {
  const { locale } = useLocale();
  const title = text || t(defaultText, locale);
  const cat = categoryLabel || t(defaultCategoryLabel, locale);
  const dateLine = formatPublishedHeader(publishedAt, locale);
  const homeLabel = locale === "en" ? "Home" : "Trang chủ";
  const newsLabel = locale === "en" ? "News" : "Tin tức";
  const sep = (
    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
      /
    </span>
  );
  return (
    <header
      data-post-body
      className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <nav
          aria-label="Breadcrumb"
          // Single scrollable line (no flex-wrap): giữ chiều cao cố định ~1 dòng nên
          // dù render sau hydration cũng không đẩy tiêu đề xuống (tránh CLS) và gọn
          // hơn trên mobile thay vì xuống 5–6 dòng.
          className="flex items-center gap-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 min-w-0 overflow-x-auto whitespace-nowrap [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <NextLink
            href={`/${locale}`}
            className="text-blue-700 dark:text-blue-300 underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700 hover:decoration-blue-600 dark:hover:decoration-blue-200"
          >
            {homeLabel}
          </NextLink>
          {sep}
          <NextLink
            href={`/${locale}/tin-tuc`}
            className="text-blue-700 dark:text-blue-300 underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700 hover:decoration-blue-600 dark:hover:decoration-blue-200"
          >
            {newsLabel}
          </NextLink>
          {cat ? (
            <>
              {sep}
              <NextLink
                href={
                  categorySlug
                    ? `/${locale}/tin-tuc?category=${categorySlug}`
                    : `/${locale}/tin-tuc`
                }
                className="text-blue-700 dark:text-blue-300 underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700 hover:decoration-blue-600 dark:hover:decoration-blue-200"
              >
                {cat}
              </NextLink>
            </>
          ) : null}
        </nav>
        {dateLine ? (
          <time className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
            {dateLine}
          </time>
        ) : null}
      </div>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-content-1000 dark:text-slate-100 leading-snug break-words">
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
const DEFAULT_FONT_LEVEL = 8;

const scaleForLevel = (level: number) =>
  (
    FONT_SIZE_LEVELS.find((l) => l.level === level) ??
    FONT_SIZE_LEVELS[DEFAULT_FONT_LEVEL]
  ).scale;

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
    // Thẻ <style> zoom đã được render sẵn ở SSR theo mức mặc định, nên chỉ cập nhật
    // khi người dùng có mức lưu khác mặc định — trường hợp phổ biến không đổi gì,
    // tránh reflow toàn bài sau hydrate (nguyên nhân CLS trên bài nhiều ảnh).
    if (safe !== DEFAULT_FONT_LEVEL) setLevel(safe);
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
    // Zoom áp qua thẻ <style> render theo `level` bên dưới (phản ứng theo state),
    // không thao tác DOM trực tiếp nữa.
    window.localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  };

  const onCopyLink = async () => {
    const url = window.location.href;
    let ok = false;
    // navigator.clipboard chỉ tồn tại trong secure context (HTTPS/localhost) —
    // bản triển khai HTTP theo IP phải rơi về execCommand qua textarea ẩn.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch {
        /* thử fallback bên dưới */
      }
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  const onShareFacebook = () => {
    // Chia sẻ qua hộp thoại chính thức của Facebook: mở popup, người dùng bấm "Đăng"
    // trong UI của FB → tạo bài thật trên tường/nhóm/Trang họ chọn. Đây là cách DUY
    // NHẤT được phép đăng lên tường cá nhân (Meta bỏ publish_actions từ 2018 nên
    // KHÔNG thể tự đăng bằng token). Preview (ảnh/tiêu đề) lấy từ thẻ Open Graph —
    // chỉ hiện khi site chạy trên domain công khai + HTTPS (FB crawler không đọc IP).
    //
    // Ưu tiên og:url/canonical (dùng domain thật khi đã cấu hình NEXT_PUBLIC_SITE_URL)
    // thay vì window.location.href thô theo IP sandbox.
    const canonical =
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content") ||
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
      window.location.href;
    // Dòng trạng thái (caption) MẶC ĐỊNH khi chia sẻ: tiêu đề bài + tên Khoa, kèm
    // một hashtag thương hiệu. `quote`/`hashtag` chỉ điền sẵn CHẮC CHẮN khi share qua
    // Share Dialog kèm app-id (đặt NEXT_PUBLIC_FB_APP_ID); với sharer.php thì Meta có
    // thể bỏ qua (không chính thức) — nhưng vẫn gửi để "được thì tốt".
    const pageTitle =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") || document.title;
    const quote = encodeURIComponent(
      `«${pageTitle}» — Khoa Vật lý – Vật lý Kỹ thuật, Trường ĐH KHTN (ĐHQG-HCM)`,
    );
    const hashtag = encodeURIComponent("#KhoaVatLyVatLyKyThuat");
    // Có app-id → dùng /dialog/share (đẹp hơn, hỗ trợ quote/hashtag); không có →
    // rơi về /sharer/sharer.php (không cần app-id). Cả hai chỉ là popup tới facebook.com.
    const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
    const href = encodeURIComponent(canonical);
    const shareUrl = appId
      ? `https://www.facebook.com/dialog/share?app_id=${appId}&display=popup&href=${href}&quote=${quote}&hashtag=${hashtag}`
      : `https://www.facebook.com/sharer/sharer.php?u=${href}&quote=${quote}`;
    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer,width=600,height=650",
    );
  };

  return (
    <>
      {/* Render thẳng ở SSR: mức phóng mặc định có mặt ngay lần vẽ đầu tiên nên
          không còn cú nhảy zoom sau hydrate (nguồn gốc CLS ~0.4 trên bài nhiều ảnh). */}
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static, không có dữ liệu người dùng
        dangerouslySetInnerHTML={{
          __html: `[data-post-body]{zoom:${scaleForLevel(level)};}`,
        }}
      />
      <div ref={anchorRef} aria-hidden="true" className="h-0 w-0" />
      <aside
        aria-label="Reader tools"
        style={{
          top: `${STICKY_TOP_TO_PX[stickyTop]}px`,
          left: leftPx ?? -9999,
        }}
        className="hidden lg:flex flex-col items-center gap-3 fixed z-30 w-12"
      >
        <div className="flex flex-col items-center bg-white dark:bg-[#1a2436] border border-slate-200 dark:border-slate-800 rounded-full shadow-sm py-1.5">
          <button
            type="button"
            onClick={() => changeLevel(level + 1)}
            aria-label={t(TOOL_LABELS.increase, locale)}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30"
            disabled={level >= FONT_SIZE_LEVELS.length - 1}
          >
            <span className="text-lg leading-none">+</span>
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold py-1 select-none">
            aA
          </span>
          <button
            type="button"
            onClick={() => changeLevel(level - 1)}
            aria-label={t(TOOL_LABELS.decrease, locale)}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30"
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
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1a2436] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
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
