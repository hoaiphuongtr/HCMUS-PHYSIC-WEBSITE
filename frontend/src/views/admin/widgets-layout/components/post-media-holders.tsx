"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { resolveMediaUrl } from "@/lib/api";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { localizedTextField } from "../fields/localized-text-field";
import { toEmbedUrl } from "./media-src";

// ── Holder đa phương tiện cho bài viết ──────────────────────────────────────
// Đây là HOLDER, không phải khối nội dung tự do: dữ liệu do trình soạn bài bơm
// vào lúc xuất bản (xem PLACEHOLDER_TYPES trong backend/src/post/puck-inject.ts).
// Layout có holder nào thì trình soạn bài mới hiện ô nhập tương ứng — nội dung
// bám theo bố cục, không bắt mọi bài phải điền mọi thứ.
//
// Khi CHƯA có dữ liệu:
//   - đang dựng layout  → hiện khung gạch đứt để biết chỗ này sẽ có gì
//   - ngoài trang công khai → ẩn hẳn, không để lại ô trống lỗ chỗ

type GalleryImage = { src: string; alt: string };

/** Prop do trình soạn bài BƠM vào — hiện ở panel chỉ để xem, không nhập tay. */
const autoField = (label: string) =>
  ({ type: "text", label: `${label} (auto)` }) as const;

function EmptyHolder({ label }: { label: string }) {
  return (
    <div className="my-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#121a2b] py-10 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

// ── PostGallery: băng ảnh cuộn ngang có nút lật ──────────────────────────────
function PostGalleryRender({
  images,
  caption,
  injected,
}: {
  images: GalleryImage[];
  caption: LocalizedString;
  injected?: boolean;
}) {
  const { locale } = useLocale();
  const [index, setIndex] = useState(0);
  const list = (images ?? []).filter((im) => im?.src);

  if (!list.length) {
    // Bài không có ảnh thì KHÔNG để lại khung trống ngoài site.
    if (injected) return null;
    return <EmptyHolder label="Thư viện ảnh của bài (điền khi soạn bài)" />;
  }

  const go = (next: number) => setIndex((next + list.length) % list.length);
  const current = list[Math.min(index, list.length - 1)];
  const text = t(caption, locale);

  return (
    <figure className="my-6">
      <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-[#121a2b]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveMediaUrl(current.src)}
          alt={current.alt || text || ""}
          className="w-full h-auto max-h-[70vh] object-contain mx-auto"
          loading="lazy"
        />
        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/65"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/65"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        ) : null}
      </div>

      {list.length > 1 ? (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {list.map((im, i) => (
            <button
              key={`${im.src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === index}
              className={
                "w-16 h-12 rounded overflow-hidden border-2 transition-colors " +
                (i === index
                  ? "border-blue-600"
                  : "border-transparent opacity-70 hover:opacity-100")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(im.src)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}

      {text ? (
        <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {text}
        </figcaption>
      ) : null}
    </figure>
  );
}

export const PostGallery: ComponentConfig<{
  images: GalleryImage[];
  caption: LocalizedString;
  injected?: boolean;
}> = {
  label: "Post Gallery (holder)",
  defaultProps: { images: [], caption: { vi: "", en: "" } },
  fields: {
    caption: localizedTextField("Chú thích chung (tuỳ chọn)"),
    images: autoField("Ảnh (lấy từ bài viết)"),
  },
  render: ({ images, caption, injected }) => (
    <PostGalleryRender
      images={images ?? []}
      caption={caption}
      injected={injected}
    />
  ),
};

// ── PostVideo: nhúng video/tài liệu, tự co theo màn hình ─────────────────────
function PostVideoRender({
  url,
  caption,
  injected,
}: {
  url: string;
  caption: LocalizedString;
  injected?: boolean;
}) {
  const { locale } = useLocale();
  const embed = toEmbedUrl(url || "");

  if (!embed) {
    if (injected) return null;
    return <EmptyHolder label="Video của bài (dán link khi soạn bài)" />;
  }

  const text = t(caption, locale);
  return (
    <figure className="my-6">
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
        <iframe
          src={embed}
          title={text || "Video"}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {text ? (
        <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {text}
        </figcaption>
      ) : null}
    </figure>
  );
}

export const PostVideo: ComponentConfig<{
  url: string;
  caption: LocalizedString;
  injected?: boolean;
}> = {
  label: "Post Video (holder)",
  defaultProps: { url: "", caption: { vi: "", en: "" } },
  fields: {
    caption: localizedTextField("Chú thích video (tuỳ chọn)"),
    url: autoField("Link video (lấy từ bài viết)"),
  },
  render: ({ url, caption, injected }) => (
    <PostVideoRender url={url ?? ""} caption={caption} injected={injected} />
  ),
};
