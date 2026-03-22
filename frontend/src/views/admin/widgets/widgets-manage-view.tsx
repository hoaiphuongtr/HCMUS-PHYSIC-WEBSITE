"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { widgetApi, type WidgetType } from "@/lib/api";
import { WidgetFormModal } from "./widget-form-modal";

const CATEGORY_LABELS: Record<string, string> = {
  NAVIGATION: "Navigation",
  FEED_COMPONENTS: "Feed & News",
  CONTENT: "Content",
  UTILITY_INFO: "Utility & Info",
};

const CATEGORY_COLORS: Record<string, string> = {
  NAVIGATION: "bg-purple-100 text-purple-700",
  FEED_COMPONENTS: "bg-blue-100 text-blue-700",
  CONTENT: "bg-green-100 text-green-700",
  UTILITY_INFO: "bg-amber-100 text-amber-700",
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
      <header className="flex h-14 items-center justify-between border-b border-slate-200/60 bg-white px-6 shrink-0">
        <div className="text-sm text-slate-500 font-medium">
          <span className="text-slate-400">Configuration</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-900">Widget Types</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Widget
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search widget types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div
              key={w.id}
              className={`rounded-xl border bg-white p-4 transition-all hover:shadow-md ${w.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-slate-500">
                      {w.icon || "widgets"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {w.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {w.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: w.id,
                      isActive: !w.isActive,
                    })
                  }
                  className={`relative w-9 h-5 rounded-full transition-colors ${w.isActive ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${w.isActive ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
              </div>

              {w.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {w.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[w.category] || "bg-slate-100 text-slate-600"}`}
                >
                  {CATEGORY_LABELS[w.category] || w.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingWidget(w)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${w.name}"?`))
                        deleteMutation.mutate(w.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[10px] text-slate-400">
                  {Object.keys(w.configSchema).length} config fields
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
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
