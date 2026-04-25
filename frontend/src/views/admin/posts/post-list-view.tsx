"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  postApi,
  type ContentStatusValue,
  type PostLayoutRef,
} from "@/lib/api";

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

const CATEGORY_LABELS: Record<string, string> = {
  EDUCATIONAL_NEWS: "Tin học vụ",
  SCIENTIFIC_INFORMATION: "Thông tin khoa học",
  RECRUITMENT: "Tuyển dụng",
  EVENT: "Sự kiện",
  SCHOLARSHIP: "Học bổng",
};

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

export function PostListView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["POSTS"],
    queryFn: postApi.list,
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

  const confirmDelete = (id: string, title: string) => {
    if (window.confirm(`Xóa bài "${title}"? Hành động này không thể hoàn tác.`))
      deleteMutation.mutate(id);
  };

  const items = listQuery.data ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-content-1000">
            Bài đăng
          </h1>
          <p className="text-xs text-slate-500">
            Danh sách tất cả bài đăng. Mỗi bài có thể được gắn vào nhiều
            layout public.
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Tạo bài đăng mới
        </Link>
      </header>

      <div className="flex-1 p-6">
        {listQuery.isLoading ? (
          <p className="text-sm text-slate-400">Đang tải…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-500">
              Chưa có bài đăng nào. Bấm "Tạo bài đăng mới" để bắt đầu.
            </p>
          </div>
        ) : (
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
                      {CATEGORY_LABELS[post.category] ?? post.category}
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
                            <button
                              key={layout.id}
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin/widgets-layout?edit=${layout.id}`,
                                )
                              }
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
                            </button>
                          ))
                        )}
                      </div>
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
        )}
      </div>
    </div>
  );
}
