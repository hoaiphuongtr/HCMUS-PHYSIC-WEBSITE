"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pageLayoutApi, postApi } from "@/lib/api";

type ScheduledItem = {
  kind: "post" | "layout";
  id: string;
  title: string;
  scheduledAt: string;
};

const toLocal = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type ScheduledModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ScheduledItem[];
};

export function ScheduledModal({
  open,
  onOpenChange,
  items,
}: ScheduledModalProps) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        items.map((item) => [
          `${item.kind}:${item.id}`,
          toLocal(item.scheduledAt),
        ]),
      ),
    );
  }, [items]);

  const saveMutation = useMutation({
    mutationFn: async ({
      kind,
      id,
      iso,
    }: {
      kind: "post" | "layout";
      id: string;
      iso: string;
    }) => {
      if (kind === "post") {
        const existing = await postApi.getById(id);
        return postApi.update(id, {
          title: existing.title,
          slug: existing.slug,
          body: existing.body,
          excerpt: existing.excerpt,
          category: existing.category,
          status: "SCHEDULED",
          scheduledAt: iso,
          coverMediaId: existing.coverMediaId,
          coverUrl: existing.coverUrl,
          coverAlt: existing.coverAlt,
          tagSlugs: existing.tags.map((t) => t.slug),
          eventStartAt: existing.eventStartAt,
          eventEndAt: existing.eventEndAt,
          eventLocation: existing.eventLocation,
        });
      }
      return pageLayoutApi.schedulePublish(id, iso);
    },
    onSuccess: () => {
      toast.success("Cập nhật lịch xuất bản");
      queryClient.invalidateQueries({ queryKey: ["DASHBOARD"] });
      queryClient.invalidateQueries({ queryKey: ["POSTS"] });
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Lưu thất bại");
    },
  });

  const handleSave = (item: ScheduledItem) => {
    const key = `${item.kind}:${item.id}`;
    const local = drafts[key];
    if (!local) {
      toast.warn("Chọn thời gian xuất bản");
      return;
    }
    const iso = new Date(local).toISOString();
    if (new Date(iso).getTime() <= Date.now()) {
      toast.error("Thời gian phải ở tương lai");
      return;
    }
    saveMutation.mutate({ kind: item.kind, id: item.id, iso });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a2436] border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            Bài đăng & layout đã lên lịch
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Chỉnh sửa thời gian xuất bản. Mỗi dòng lưu riêng.
          </DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Chưa có nội dung nào được lên lịch.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 max-h-[60vh] overflow-auto">
            {items.map((item) => {
              const key = `${item.kind}:${item.id}`;
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 py-3 flex-wrap"
                >
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.kind === "post"
                        ? "bg-blue-700/30 text-blue-300"
                        : "bg-purple-700/30 text-purple-300"
                    }`}
                  >
                    {item.kind === "post" ? "Post" : "Layout"}
                  </span>
                  <span className="flex-1 min-w-[200px] text-sm text-slate-200">
                    {item.title}
                  </span>
                  <input
                    type="datetime-local"
                    value={drafts[key] ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(item)}
                    disabled={saveMutation.isPending}
                    className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Lưu
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
