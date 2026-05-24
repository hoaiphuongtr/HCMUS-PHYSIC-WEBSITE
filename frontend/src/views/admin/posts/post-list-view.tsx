"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  postApi,
  type ContentStatusValue,
  type PostLayoutRef,
  type PostRecord,
} from "@/lib/api";
import { useConfirm } from "@/components/use-confirm";
import { AdminSelect } from "@/components/admin/admin-select";
import {
  POST_CATEGORY_OPTIONS_VI,
  categoryLabelVi,
} from "@/lib/post-categories";

const PAGE_SIZE = 12;

const STATUS_STYLES: Record<ContentStatusValue, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const STATUS_OPTIONS: ContentStatusValue[] = [
  "DRAFT",
  "PENDING",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
];


const layoutBadgeStyle = (layout: PostLayoutRef): string => {
  if (layout.isPublished)
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (layout.scheduledAt)
    return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-50 text-slate-700 border border-slate-200";
};

const layoutStatusText = (layout: PostLayoutRef): string => {
  if (layout.isPublished) return "pub";
  if (layout.scheduledAt) return "sched";
  return "draft";
};

const earliestPublishedAt = (layouts: PostLayoutRef[]): string | null => {
  let min: number | null = null;
  for (const l of layouts) {
    if (!l.isPublished || !l.publishedAt) continue;
    const t = new Date(l.publishedAt).getTime();
    if (Number.isNaN(t)) continue;
    if (min === null || t < min) min = t;
  }
  return min === null ? null : new Date(min).toISOString();
};

const formatDDMMYYYY = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatPublicAt = (post: PostRecord): string => {
  if (post.publishedAt) return formatDDMMYYYY(post.publishedAt);
  const fromLayout = earliestPublishedAt(post.layouts);
  if (fromLayout) return formatDDMMYYYY(fromLayout);
  if (post.status === "PUBLISHED") return formatDDMMYYYY(post.updatedAt);
  return "—";
};

export function PostListView() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const listQuery = useQuery({
    queryKey: ["POSTS", "PAGED", page, category, status, search],
    queryFn: () =>
      postApi.listPaged({
        page,
        pageSize: PAGE_SIZE,
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationKey: ["POSTS", "DELETE"],
    mutationFn: (id: string) => postApi.remove(id),
    onSuccess: () => {
      toast.success("Đã xóa bài đăng");
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Không thể xóa");
    },
  });

  const confirmDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Xóa bài "${title}"?`,
      description: "Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (ok) deleteMutation.mutate(id);
  };

  const data = listQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(category || status || search);

  const resetFilters = () => {
    setCategory("");
    setStatus("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-content-1000">Bài đăng</h1>
          <p className="text-xs text-slate-500">
            Danh sách tất cả bài đăng. Mỗi bài có thể được gắn vào nhiều layout
            public.
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Tạo bài đăng mới
        </Link>
      </header>

      <div className="flex-1 p-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề, slug, mô tả…"
            className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="min-w-[200px]">
            <AdminSelect
              value={category}
              onChange={(next) => {
                setCategory(next);
                setPage(1);
              }}
              placeholder="Tất cả danh mục"
              clearLabel="Tất cả danh mục"
              options={POST_CATEGORY_OPTIONS_VI}
            />
          </div>
          <div className="min-w-[180px]">
            <AdminSelect
              value={status}
              onChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
              placeholder="Tất cả status"
              clearLabel="Tất cả status"
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: STATUS_LABELS[s],
              }))}
            />
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Xóa lọc
            </button>
          ) : null}
          <span className="ml-auto text-xs text-slate-500">
            {listQuery.isLoading ? "Đang tải…" : `${total} kết quả`}
          </span>
        </div>

        {listQuery.isLoading && !data ? (
          <p className="text-sm text-slate-400">Đang tải…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-500">
              {hasFilters
                ? "Không có bài đăng nào khớp với bộ lọc."
                : 'Chưa có bài đăng nào. Bấm "Tạo bài đăng mới" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Bài đăng
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Danh mục
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Layouts
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Public at
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/posts?id=${post.id}`}
                            className="text-sm font-medium text-blue-700 hover:underline"
                          >
                            {post.title}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            /{post.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {categoryLabelVi(post.category)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold " +
                            STATUS_STYLES[post.status]
                          }
                        >
                          {STATUS_LABELS[post.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {post.layouts.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Chưa gắn layout
                            </span>
                          ) : (
                            post.layouts.map((layout) => (
                              <Link
                                key={layout.id}
                                href={`/admin/widgets-layout?edit=${layout.id}`}
                                className={
                                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium " +
                                  layoutBadgeStyle(layout)
                                }
                                title={`Mở ${layout.name}`}
                              >
                                <span>{layout.name}</span>
                                <span className="text-[9px] uppercase opacity-70">
                                  {layoutStatusText(layout)}
                                </span>
                              </Link>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatPublicAt(post)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Link
                            href={`/admin/posts?id=${post.id}`}
                            className="px-2 py-1 text-xs text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                          >
                            Sửa
                          </Link>
                          <button
                            type="button"
                            onClick={() => confirmDelete(post.id, post.title)}
                            className="px-2 py-1 text-xs text-rose-700 border border-rose-200 rounded-md hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  const pages = buildPageList(page, totalPages);
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Trước
      </button>
      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            key={`gap-${idx}`}
            className="px-2 text-xs text-slate-400 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={
              p === page
                ? "px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md"
                : "px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sau →
      </button>
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
