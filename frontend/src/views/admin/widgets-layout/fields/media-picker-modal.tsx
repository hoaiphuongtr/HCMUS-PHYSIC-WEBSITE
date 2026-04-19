"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { mediaApi, resolveMediaUrl } from "@/lib/api";
import { ModalPortal } from "../portal-menu";

const PAGE_SIZE = 24;

type MediaPickerModalProps = {
  onSelect: (url: string) => void;
  onClose: () => void;
};

export function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tagSlug, setTagSlug] = useState<string | undefined>();

  const listQuery = useQuery({
    queryKey: ["MEDIA", "LIST", { page, search, tagSlug }],
    queryFn: () =>
      mediaApi.list({ page, pageSize: PAGE_SIZE, search, tagSlug }),
  });

  const tagsQuery = useQuery({
    queryKey: ["MEDIA", "TAGS_IN_USE"],
    queryFn: mediaApi.tagsInUse,
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="presentation"
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Chọn ảnh từ thư viện
            </h2>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm…"
              className="w-56 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </header>

          {(tagsQuery.data?.length ?? 0) > 0 && (
            <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTagSlug(undefined);
                  setPage(1);
                }}
                className={
                  "px-2.5 py-0.5 text-[11px] rounded-full border " +
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
                    "px-2.5 py-0.5 text-[11px] rounded-full border " +
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

          <div className="flex-1 overflow-y-auto p-5">
            {listQuery.isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Đang tải…
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Không có ảnh. Hãy upload vào{" "}
                <a href="/admin/media" className="text-blue-600 underline">
                  Media Library
                </a>
                .
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(resolveMediaUrl(item.url));
                      onClose();
                    }}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-400 transition-colors"
                  >
                    {/** biome-ignore lint/performance/noImgElement: user uploads not allowlisted in next images */}
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={item.alt ?? item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <footer className="px-5 py-3 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Trước
              </button>
              <span className="text-xs text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Sau
              </button>
            </footer>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
