"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  DynamicIcon,
  PencilIcon,
  SearchIcon,
} from "@/components/admin/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { type WidgetType, widgetApi } from "@/lib/api";
import { WidgetFormModal } from "./widget-form-modal";

const CATEGORY_LABELS: Record<string, string> = {
  NAVIGATION: "Navigation",
  FEED_COMPONENTS: "Feed & News",
  CONTENT: "Content",
  UTILITY_INFO: "Utility & Info",
};

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  NAVIGATION: "default",
  FEED_COMPONENTS: "secondary",
  CONTENT: "outline",
  UTILITY_INFO: "secondary",
};

export function WidgetsManageView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingWidget, setEditingWidget] = useState<WidgetType | null>(null);

  const { data: widgets = [] } = useQuery({
    queryKey: ["WIDGETS"],
    queryFn: () => widgetApi.list(),
  });

  const toggleMutation = useMutation({
    mutationKey: ["WIDGETS", "UPDATE"],
    mutationFn: (params: { id: string; isActive: boolean }) =>
      widgetApi.update(params.id, { isActive: params.isActive } as any),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["WIDGETS"] });
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Không cập nhật được widget");
    },
  });


  const filtered = widgets.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.type.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || w.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b bg-card px-5 shrink-0">
        <div className="flex items-center gap-3">
          <DynamicIcon
            name="extension"
            className="w-[18px] h-[18px] text-muted-foreground"
          />
          <h1 className="text-sm font-semibold">Widget Types</h1>
          <Badge variant="secondary">{widgets.length}</Badge>
        </div>

      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1">
            <Button
              variant={!categoryFilter ? "default" : "outline"}
              size="xs"
              onClick={() => setCategoryFilter("")}
            >
              All
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <Button
                key={k}
                variant={categoryFilter === k ? "default" : "outline"}
                size="xs"
                onClick={() => setCategoryFilter(categoryFilter === k ? "" : k)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>

        {/* Cùng một kiểu danh sách với trang Bố cục trang (ul chia dòng), thay cho
            lưới thẻ trước đây — hai màn hình quản lý cạnh nhau mà mỗi cái một
            kiểu khiến người dùng tưởng là hai chức năng khác nhau. */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((w) => (
              <li
                key={w.id}
                className={
                  "flex items-center gap-3 px-3 py-2.5" +
                  (w.isActive ? "" : " opacity-50")
                }
              >
                <div className="size-8 shrink-0 rounded-md bg-muted flex items-center justify-center">
                  <DynamicIcon
                    name={w.icon || "widgets"}
                    className="w-[18px] h-[18px] text-muted-foreground"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                    {w.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {w.type}
                    {w.description ? ` · ${w.description}` : ""}
                  </p>
                </div>
                <Badge
                  variant={CATEGORY_VARIANT[w.category] || "outline"}
                  className="shrink-0"
                >
                  {CATEGORY_LABELS[w.category] || w.category}
                </Badge>
                <span className="shrink-0 text-[11px] text-muted-foreground w-20 text-right">
                  {Object.keys(w.configSchema).length} thuộc tính
                </span>
                <Switch
                  size="sm"
                  checked={w.isActive}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: w.id, isActive: !!checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setEditingWidget(w)}
                  title="Sửa thuộc tính"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <DynamicIcon
              name="extension_off"
              className="w-9 h-9 mb-2 mx-auto block"
            />
            <p className="text-sm">No widget types found</p>
          </div>
        )}
      </div>

      {editingWidget && (
        <WidgetFormModal
          widget={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["WIDGETS"] });
            setEditingWidget(null);
          }}
        />
      )}
    </>
  );
}
