"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { type MediaItem, mediaApi, resolveMediaUrl } from "@/lib/api";
import { ModalPortal } from "@/views/admin/widgets-layout/portal-menu";

type MediaDetailModalProps = {
  item: MediaItem;
  allTags: { slug: string; name: string }[];
  onClose: () => void;
  onChanged: () => void;
};

export function MediaDetailModal({
  item,
  allTags,
  onClose,
  onChanged,
}: MediaDetailModalProps) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [name, setName] = useState(item.name);
  const [tagSlugs, setTagSlugs] = useState<string[]>(
    item.tags.map((t) => t.slug),
  );
  const [tagInput, setTagInput] = useState("");

  const absoluteUrl = resolveMediaUrl(item.url);

  const updateMutation = useMutation({
    mutationKey: ["MEDIA", "UPDATE"],
    mutationFn: () => mediaApi.update(item.id, { name, alt, tagSlugs }),
    onSuccess: () => {
      toast.success("Đã lưu");
      onChanged();
      onClose();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Lưu thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["MEDIA", "DELETE"],
    mutationFn: () => mediaApi.remove(item.id),
    onSuccess: () => {
      toast.success("Đã xóa");
      onChanged();
      onClose();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Xóa thất bại");
    },
  });

  const addTag = (slug: string) => {
    const clean = slug.trim().toLowerCase();
    if (!clean || tagSlugs.includes(clean)) return;
    setTagSlugs([...tagSlugs, clean]);
    setTagInput("");
  };

  const removeTag = (slug: string) => {
    setTagSlugs(tagSlugs.filter((s) => s !== slug));
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(absoluteUrl).then(
      () => toast.success("Đã copy URL"),
      () => toast.error("Copy thất bại"),
    );
  };

  const confirmDelete = () => {
    if (confirm("Xóa ảnh này? Hành động không thể hoàn tác.")) {
      deleteMutation.mutate();
    }
  };

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
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_360px]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 flex items-center justify-center p-4 min-h-[320px]">
            {/** biome-ignore lint/performance/noImgElement: user uploads not allowlisted in next images */}
            <img
              src={absoluteUrl}
              alt={item.alt ?? item.name}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          <div className="flex flex-col overflow-y-auto">
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {item.name}
              </h2>
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

            <div className="p-5 space-y-4 text-sm flex-1">
              <div>
                <label
                  htmlFor="media-url"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="media-url"
                    readOnly
                    value={absoluteUrl}
                    className="flex-1 px-2 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="media-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Tên
                </label>
                <input
                  id="media-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label
                  htmlFor="media-alt"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Alt text
                </label>
                <input
                  id="media-alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Mô tả ngắn cho ảnh"
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <div className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tagSlugs.length === 0 ? (
                    <span className="text-xs text-slate-400">Chưa có tag</span>
                  ) : (
                    tagSlugs.map((slug) => (
                      <span
                        key={slug}
                        className="px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"
                      >
                        {slug}
                        <button
                          type="button"
                          onClick={() => removeTag(slug)}
                          className="text-blue-400 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Thêm tag rồi Enter (slug: hoc-bong, tuyen-sinh…)"
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                />
                {allTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {allTags
                      .filter((t) => !tagSlugs.includes(t.slug))
                      .slice(0, 8)
                      .map((t) => (
                        <button
                          type="button"
                          key={t.slug}
                          onClick={() => addTag(t.slug)}
                          className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          + {t.slug}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <dl className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <dt>Loại</dt>
                  <dd className="font-mono">{item.mimeType ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Dung lượng</dt>
                  <dd>
                    {item.size ? `${(item.size / 1024).toFixed(1)} KB` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tải lên</dt>
                  <dd>{new Date(item.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <footer className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
              >
                Xóa
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
