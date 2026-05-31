"use client";

import {
  DynamicIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
} from "@/components/admin/icons";
import type { WidgetInstance } from "@/lib/api";
import { WidgetPreview } from "./widget-previews";

const COL_SPAN_OPTIONS = [
  { value: 3, label: "1/4" },
  { value: 4, label: "1/3" },
  { value: 6, label: "1/2" },
  { value: 8, label: "2/3" },
  { value: 9, label: "3/4" },
  { value: 12, label: "Full" },
];

export function WidgetInstanceCard({
  instance,
  isSelected,
  onSelect,
  onUpdateWidget,
  onRemoveWidget,
}: {
  instance: WidgetInstance;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateWidget: (
    instanceId: string,
    body: {
      config?: Record<string, any>;
      isVisible?: boolean;
      colSpan?: number;
      row?: number;
    },
  ) => void;
  onRemoveWidget: (instanceId: string) => void;
}) {
  const widget = instance.widget;
  const config = { ...widget?.defaultConfig, ...instance.config };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border-2 transition-all cursor-pointer group relative ${isSelected ? "border-blue-400 shadow-lg shadow-blue-100/50 ring-2 ring-blue-100" : "border-transparent hover:border-slate-200 hover:shadow-md"} ${!instance.isVisible ? "opacity-50" : ""}`}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center bg-white dark:bg-[#1a2436]/90 shadow-sm border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          {COL_SPAN_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateWidget(instance.id, { colSpan: opt.value });
              }}
              className={`px-1.5 py-0.5 text-[9px] font-medium transition-colors ${(instance.colSpan || 12) === opt.value ? "bg-blue-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202c44]"}`}
              title={`Width: ${opt.label}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateWidget(instance.id, { isVisible: !instance.isVisible });
          }}
          className="p-1 rounded-md bg-white dark:bg-[#1a2436]/90 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202c44] text-slate-500 dark:text-slate-400"
          title={instance.isVisible ? "Hide" : "Show"}
        >
          {instance.isVisible ? (
            <EyeIcon className="w-3.5 h-3.5" />
          ) : (
            <EyeOffIcon className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveWidget(instance.id);
          }}
          className="p-1 rounded-md bg-white dark:bg-[#1a2436]/90 shadow-sm border border-red-200 hover:bg-red-50 text-red-400 hover:text-red-600"
          title="Remove"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2436] rounded-xl overflow-hidden">
        <div className="p-3">
          <WidgetPreview
            type={widget?.type || ""}
            config={config}
            icon={widget?.icon}
            name={widget?.name || "Widget"}
          />
        </div>

        <div className="px-3 py-2 bg-slate-50 dark:bg-[#121a2b]/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <DynamicIcon
              name={widget?.icon || "widgets"}
              className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {widget?.name || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(instance.colSpan || 12) < 12 && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                {COL_SPAN_OPTIONS.find((o) => o.value === instance.colSpan)
                  ?.label || `${instance.colSpan}/12`}
              </span>
            )}
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#202c44]/60 text-slate-500 dark:text-slate-400">
              {widget?.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
