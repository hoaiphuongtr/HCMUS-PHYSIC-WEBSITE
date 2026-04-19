"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type MediaItem, mediaApi, resolveMediaUrl } from "@/lib/api";
import { MediaDetailModal } from "./media-detail-modal";
import { UploadZone } from "./upload-zone";

const PAGE_SIZE = 24;

export function MediaLibraryView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tagSlug, setTagSlug] = useState<string | undefined>();
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const listQuery = useQuery({
    queryKey: ["MEDIA", "LIST", { page, search, tagSlug }],
    queryFn: () =>
      mediaApi.list({ page, pageSize: PAGE_SIZE, search, tagSlug }),
  });

  const tagsQuery = useQuery({
    queryKey: ["MEDIA", "TAGS_IN_USE"],
    queryFn: mediaApi.tagsInUse,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["MEDIA"] });
  };

  const total = listQuery.data?.total ?? 0;
  const items = listQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Media Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} ảnh đã được tải lên
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên, alt…"
          className="w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
        />
      </header>

      <div className="mb-6">
        <UploadZone
          tagSlugs={tagSlug ? [tagSlug] : undefined}
          onUploaded={invalidate}
        />
      </div>

      {(tagsQuery.data?.length ?? 0) > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Lọc theo tag:</span>
          <button
            type="button"
            onClick={() => {
              setTagSlug(undefined);
              setPage(1);
            }}
            className={
              "px-3 py-1 text-xs rounded-full border transition-colors " +
              (tagSlug === undefined
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            }
          >
            Tất cả
          </button>
          {tagsQuery.data?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTagSlug(t.slug);
                setPage(1);
              }}
              className={
                "px-3 py-1 text-xs rounded-full border transition-colors " +
                (tagSlug === t.slug
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
              }
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {listQuery.isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Đang tải…
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          {search || tagSlug
            ? "Không có ảnh phù hợp."
            : "Chưa có ảnh nào. Kéo thả vào vùng trên để bắt đầu."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-400 transition-colors"
            >
              {/** biome-ignore lint/performance/noImgElement: user uploads not allowlisted in next images */}
              <img
                src={resolveMediaUrl(item.url)}
                alt={item.alt ?? item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {item.tags.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                  {item.tags.slice(0, 2).map((t) => (
                    <span
                      key={t.slug}
                      className="px-1.5 py-0.5 text-[9px] rounded bg-black/60 text-white truncate"
                    >
                      {t.slug}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <footer className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Trước
          </button>
          <span className="text-xs text-slate-500">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Sau
          </button>
        </footer>
      )}

      {selected && (
        <MediaDetailModal
          item={selected}
          allTags={tagsQuery.data ?? []}
          onClose={() => setSelected(null)}
          onChanged={invalidate}
        />
      )}
    </div>
  );
}
