"use client";

import { useState } from "react";
import type { WidgetType } from "@/lib/api";
import { WidgetPreview } from "./widget-previews";

const CATEGORY_LABELS: Record<string, string> = {
  NAVIGATION: "Navigation",
  FEED_COMPONENTS: "Feed & News",
  CONTENT: "Content",
  UTILITY_INFO: "Utility & Info",
};

const CATEGORY_ICONS: Record<string, string> = {
  NAVIGATION: "menu",
  FEED_COMPONENTS: "newspaper",
  CONTENT: "web",
  UTILITY_INFO: "info",
};

export function ComponentLibrary({
  widgets,
  onAddWidget,
  disabled,
}: {
  widgets: WidgetType[];
  onAddWidget: (widgetId: string) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = widgets.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.type.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, WidgetType[]>>((acc, w) => {
    (acc[w.category] ??= []).push(w);
    return acc;
  }, {});

  const categoryOrder = ["NAVIGATION", "FEED_COMPONENTS", "CONTENT", "UTILITY_INFO"];

  return (
    <div className="w-[280px] shrink-0 bg-white border-r border-slate-200/60 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Components
        </h3>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() =>
                  setCollapsed((p) => ({ ...p, [cat]: !p[cat] }))
                }
                className="flex items-center justify-between w-full py-2 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">
                    {CATEGORY_ICONS[cat] || "category"}
                  </span>
                  {CATEGORY_LABELS[cat] || cat}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">
                    {items.length}
                  </span>
                  <span className="material-symbols-outlined text-[14px]">
                    {isCollapsed ? "expand_more" : "expand_less"}
                  </span>
                </span>
              </button>
              {!isCollapsed && (
                <div className="space-y-1.5 pb-2">
                  {items.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => onAddWidget(w.id)}
                      disabled={disabled}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("widgetId", w.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="w-full text-left rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none group overflow-hidden"
                    >
                      <div className="p-2 bg-slate-50/50 border-b border-slate-50">
                        <WidgetPreview
                          type={w.type}
                          config={w.defaultConfig}
                          icon={w.icon}
                          name={w.name}
                        />
                      </div>
                      <div className="px-2.5 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500">
                          {w.icon || "widgets"}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 truncate">
                            {w.name}
                          </div>
                          {w.description && (
                            <div className="text-[9px] text-slate-400 truncate">
                              {w.description}
                            </div>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-[14px] text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          add_circle
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No widgets found
          </div>
        )}
      </div>
    </div>
  );
}
