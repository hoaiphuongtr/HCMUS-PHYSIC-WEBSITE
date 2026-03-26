"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { widgetApi, type WidgetType } from "@/lib/api";
import { WidgetFormModal } from "./widget-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
  const [showCreate, setShowCreate] = useState(false);

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
      toast.error(err.message || "Failed to update widget");
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["WIDGETS", "DELETE"],
    mutationFn: (id: string) => widgetApi.remove(id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["WIDGETS"] });
      toast.success("Widget deleted");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to delete widget");
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
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">
            extension
          </span>
          <h1 className="text-sm font-semibold">Widget Types</h1>
          <Badge variant="secondary">{widgets.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <span className="material-symbols-outlined text-[14px]">add</span>
          Create Widget
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-muted-foreground">
              search
            </span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <Card
              key={w.id}
              size="sm"
              className={w.isActive ? "" : "opacity-50"}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-muted-foreground">
                        {w.icon || "widgets"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">{w.name}</h3>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {w.type}
                      </span>
                    </div>
                  </div>
                  <Switch
                    size="sm"
                    checked={w.isActive}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: w.id, isActive: !!checked })
                    }
                  />
                </div>

                {w.description && (
                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">
                    {w.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={CATEGORY_VARIANT[w.category] || "outline"}>
                    {CATEGORY_LABELS[w.category] || w.category}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground mr-1">
                      {Object.keys(w.configSchema).length} fields
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditingWidget(w)}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        edit
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        if (confirm(`Delete "${w.name}"?`))
                          deleteMutation.mutate(w.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              extension_off
            </span>
            <p className="text-sm">No widget types found</p>
          </div>
        )}
      </div>

      {(showCreate || editingWidget) && (
        <WidgetFormModal
          widget={editingWidget}
          onClose={() => {
            setShowCreate(false);
            setEditingWidget(null);
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["WIDGETS"] });
            setShowCreate(false);
            setEditingWidget(null);
          }}
        />
      )}
    </>
  );
}
