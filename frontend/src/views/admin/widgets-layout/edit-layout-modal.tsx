"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryApi, type PageLayout, pageLayoutApi } from "@/lib/api";
import { toSlug } from "@/lib/utils";

export function EditLayoutModal({
  layout,
  onClose,
  onUpdated,
}: {
  layout: PageLayout;
  onClose: () => void;
  onUpdated: (layout: PageLayout) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(layout.name);
  const [slug, setSlug] = useState(layout.slug);
  const [description, setDescription] = useState(layout.description || "");
  const [categoryId, setCategoryId] = useState(layout.categoryId ?? "");
  const [isPostTemplate, setIsPostTemplate] = useState(
    layout.isPostTemplate ?? false,
  );
  const [isPrivate, setIsPrivate] = useState(layout.isPrivate ?? false);
  const [slugTouched, setSlugTouched] = useState(false);
  const categoriesQuery = useQuery({
    queryKey: ["CATEGORIES"],
    queryFn: categoryApi.list,
  });

  const updateMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "UPDATE"],
    mutationFn: (body: {
      name: string;
      slug: string;
      description?: string;
      categoryId?: string | null;
      isPostTemplate?: boolean;
      isPrivate?: boolean;
    }) => pageLayoutApi.update(layout.id, body),
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      queryClient.invalidateQueries({
        queryKey: ["PAGE_LAYOUTS", layout.id],
      });
      toast.success("Đã cập nhật layout");
      onUpdated(data);
      onClose();
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Không cập nhật được layout");
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      slug,
      description: description || undefined,
      categoryId: categoryId || null,
      isPostTemplate,
      isPrivate,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Layout</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              Public URL path. Changing this will break existing links.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {/* Cờ TƯỜNG MINH. Trước đây chỉ cần gắn danh mục là layout tự lọt vào
              danh sách mẫu, nên trang giới thiệu/liên hệ lỡ gắn danh mục cũng
              hiện ra mà người dùng không hiểu vì sao. */}
          <div className="space-y-1.5">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPostTemplate}
                onChange={(e) => setIsPostTemplate(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="text-sm font-medium">
                  Dùng làm layout mẫu cho bài viết mới
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Chỉ layout được tick ở đây mới hiện trong ô chọn mẫu lúc soạn
                  bài.
                </span>
              </span>
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="text-sm font-medium">
                  Chỉ mình tôi dùng layout này
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Người khác trong cùng bộ môn sẽ không thấy nó trong danh sách
                  layout lẫn ô chọn mẫu. Super admin vẫn thấy để quản trị.
                </span>
              </span>
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Danh mục của layout mẫu (tuỳ chọn)</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2436]"
            >
              <option value="">— Không gắn danh mục —</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.vi}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Danh mục "Sự kiện" thì mẫu chỉ hiện cho bài sự kiện; danh mục khác
              thì hiện cho bài tin tức.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
