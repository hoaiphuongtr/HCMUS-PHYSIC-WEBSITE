"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  widgetApi,
  pageLayoutApi,
  type PageLayout,
  type WidgetInstance,
} from "@/lib/api";
import { ComponentLibrary } from "./component-library";
import { PageCanvas } from "./page-canvas";
import { CreateLayoutModal } from "./create-layout-modal";
import { WidgetConfigForm } from "./widget-config-form";

export function WidgetsLayoutView() {
  const queryClient = useQueryClient();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [layoutMenuId, setLayoutMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLayoutMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: widgets = [] } = useQuery({
    queryKey: ["WIDGETS"],
    queryFn: () => widgetApi.list({ isActive: "true" }),
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["PAGE_LAYOUTS"],
    queryFn: () => pageLayoutApi.list(),
  });

  const { data: selectedLayout } = useQuery({
    queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
    queryFn: () => pageLayoutApi.getById(selectedLayoutId!),
    enabled: !!selectedLayoutId,
  });

  const selectedInstance = selectedLayout?.widgets?.find(
    (w: WidgetInstance) => w.id === selectedInstanceId,
  );

  const invalidateLayout = () =>
    queryClient.invalidateQueries({
      queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
    });

  const addWidgetMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "ADD_WIDGET"],
    mutationFn: (params: {
      layoutId: string;
      widgetId: string;
      order: number;
      row?: number;
      colSpan?: number;
    }) =>
      pageLayoutApi.addWidget(params.layoutId, {
        widgetId: params.widgetId,
        order: params.order,
        row: params.row,
        colSpan: params.colSpan,
      }),
    onSuccess() {
      invalidateLayout();
      toast.success("Widget added");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to add widget");
    },
  });

  const updateWidgetMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "UPDATE_WIDGET"],
    mutationFn: (params: {
      layoutId: string;
      instanceId: string;
      body: {
        config?: Record<string, any>;
        order?: number;
        row?: number;
        colSpan?: number;
        isVisible?: boolean;
      };
    }) =>
      pageLayoutApi.updateWidget(
        params.layoutId,
        params.instanceId,
        params.body,
      ),
    onSuccess() {
      invalidateLayout();
      toast.success("Widget updated");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to update widget");
    },
  });

  const removeWidgetMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DELETE_WIDGET"],
    mutationFn: (params: { layoutId: string; instanceId: string }) =>
      pageLayoutApi.removeWidget(params.layoutId, params.instanceId),
    onSuccess() {
      invalidateLayout();
      setSelectedInstanceId(null);
      toast.success("Widget removed");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to remove widget");
    },
  });

  const reorderMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "REORDER"],
    mutationFn: (params: { layoutId: string; orderedIds: string[] }) =>
      pageLayoutApi.reorderWidgets(params.layoutId, params.orderedIds),
    onSuccess() {
      invalidateLayout();
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to reorder widgets");
    },
  });

  const publishMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "PUBLISH"],
    mutationFn: (layoutId: string) => pageLayoutApi.publish(layoutId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      toast.success("Layout published");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to publish layout");
    },
  });

  const deleteLayoutMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DELETE"],
    mutationFn: (layoutId: string) => pageLayoutApi.remove(layoutId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      if (selectedLayoutId === deleteLayoutMutation.variables) {
        setSelectedLayoutId(null);
        setSelectedInstanceId(null);
      }
      toast.success("Layout deleted");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to delete layout");
    },
  });

  const duplicateLayoutMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DUPLICATE"],
    mutationFn: (layoutId: string) => pageLayoutApi.duplicate(layoutId),
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      setSelectedLayoutId(data.id);
      setSelectedInstanceId(null);
      toast.success("Layout duplicated");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to duplicate layout");
    },
  });

  const handleAddWidget = (widgetId: string) => {
    if (!selectedLayoutId) return;
    const ws = selectedLayout?.widgets || [];
    const order = ws.length;
    const maxRow = ws.reduce((max, w) => Math.max(max, w.row ?? 0), -1);
    addWidgetMutation.mutate({
      layoutId: selectedLayoutId,
      widgetId,
      order,
      row: maxRow + 1,
      colSpan: 12,
    });
  };

  const handleAddWidgetAt = (
    widgetId: string,
    row: number,
    colSpan: number,
  ) => {
    if (!selectedLayoutId) return;
    const ws = selectedLayout?.widgets || [];
    addWidgetMutation.mutate({
      layoutId: selectedLayoutId,
      widgetId,
      order: ws.length,
      row,
      colSpan,
    });
  };

  const handleUpdateWidget = (
    instanceId: string,
    body: {
      config?: Record<string, any>;
      order?: number;
      row?: number;
      colSpan?: number;
      isVisible?: boolean;
    },
  ) => {
    if (!selectedLayoutId) return;
    updateWidgetMutation.mutate({
      layoutId: selectedLayoutId,
      instanceId,
      body,
    });
  };

  const handleRemoveWidget = (instanceId: string) => {
    if (!selectedLayoutId) return;
    removeWidgetMutation.mutate({
      layoutId: selectedLayoutId,
      instanceId,
    });
  };

  const handleReorder = (orderedIds: string[]) => {
    if (!selectedLayoutId) return;
    reorderMutation.mutate({ layoutId: selectedLayoutId, orderedIds });
  };

  const handleLayoutCreated = (layout: PageLayout) => {
    queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
    setSelectedLayoutId(layout.id);
    setShowCreateModal(false);
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-slate-200/60 bg-white px-5 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-slate-400">
            dashboard_customize
          </span>
          <div className="text-sm font-semibold text-slate-800">
            Page Layout Builder
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedLayout && !selectedLayout.isPublished && (
            <button
              onClick={() => publishMutation.mutate(selectedLayoutId!)}
              disabled={publishMutation.isPending}
              className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px]">
                publish
              </span>
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </button>
          )}
          {selectedLayout?.isPublished && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-50 text-green-600 rounded-full flex items-center gap-1 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Published
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <ComponentLibrary
          widgets={widgets}
          onAddWidget={handleAddWidget}
          disabled={!selectedLayoutId}
        />

        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200/60 bg-white flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
              {layouts.map((l) => (
                <div key={l.id} className="relative shrink-0">
                  <button
                    onClick={() => {
                      setSelectedLayoutId(l.id);
                      setSelectedInstanceId(null);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setLayoutMenuId(l.id);
                    }}
                    className={
                      "px-3 py-1.5 rounded-md border text-left transition-all flex items-center gap-2 " +
                      (selectedLayoutId === l.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300")
                    }
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                        {l.name}
                        {l.isPublished && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400">/{l.slug}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLayoutMenuId(layoutMenuId === l.id ? null : l.id);
                      }}
                      className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        more_vert
                      </span>
                    </button>
                  </button>

                  {layoutMenuId === l.id && (
                    <div
                      ref={menuRef}
                      className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]"
                    >
                      <button
                        onClick={() => {
                          duplicateLayoutMutation.mutate(l.id);
                          setLayoutMenuId(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[14px] text-slate-400">
                          content_copy
                        </span>
                        Duplicate
                      </button>
                      <div className="border-t border-slate-100 my-0.5" />
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this layout? This cannot be undone.",
                            )
                          ) {
                            deleteLayoutMutation.mutate(l.id);
                          }
                          setLayoutMenuId(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          delete
                        </span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowCreateModal(true)}
                className="shrink-0 px-3 py-1.5 rounded-md border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center gap-1.5 text-slate-400 hover:text-blue-500"
              >
                <span className="material-symbols-outlined text-[14px]">
                  add
                </span>
                <span className="text-[11px] font-medium">New</span>
              </button>
            </div>
          </div>

          {selectedLayoutId && selectedLayout ? (
            <PageCanvas
              layout={selectedLayout}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={setSelectedInstanceId}
              onUpdateWidget={handleUpdateWidget}
              onRemoveWidget={handleRemoveWidget}
              onReorder={handleReorder}
              onAddWidgetAt={handleAddWidgetAt}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3 block">
                  dashboard_customize
                </span>
                <p className="text-sm font-medium">
                  Select or create a layout to start building
                </p>
                <p className="text-xs mt-1">
                  Choose a layout above or create a new one
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedInstance && (
          <div className="w-[300px] shrink-0 bg-white border-l border-slate-200/60 flex flex-col h-full overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  {selectedInstance.widget?.icon || "widgets"}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {selectedInstance.widget?.name}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {selectedInstance.widget?.type}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstanceId(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <section>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Layout
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">
                      Width
                    </span>
                    <div className="flex gap-0.5">
                      {[
                        { value: 3, label: "1/4" },
                        { value: 4, label: "1/3" },
                        { value: 6, label: "1/2" },
                        { value: 8, label: "2/3" },
                        { value: 9, label: "3/4" },
                        { value: 12, label: "Full" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() =>
                            handleUpdateWidget(selectedInstance.id, {
                              colSpan: opt.value,
                            })
                          }
                          className={
                            "flex-1 py-1 text-[10px] font-medium rounded border transition-colors " +
                            ((selectedInstance.colSpan || 12) === opt.value
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : "border-slate-200 text-slate-500 hover:border-slate-300")
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">
                      Row
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={selectedInstance.row ?? 0}
                        onChange={(e) =>
                          handleUpdateWidget(selectedInstance.id, {
                            row: Number(e.target.value),
                          })
                        }
                        className="w-14 px-2 py-1 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-300"
                      />
                      <span className="text-[9px] text-slate-400">
                        Same row = side-by-side
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Visible</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={selectedInstance.isVisible}
                      onClick={() =>
                        handleUpdateWidget(selectedInstance.id, {
                          isVisible: !selectedInstance.isVisible,
                        })
                      }
                      className={
                        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors " +
                        (selectedInstance.isVisible
                          ? "bg-blue-500"
                          : "bg-slate-300")
                      }
                    >
                      <span
                        className={
                          "inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform " +
                          (selectedInstance.isVisible
                            ? "translate-x-3.5"
                            : "translate-x-0.5")
                        }
                      />
                    </button>
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-100" />

              <section>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Configuration
                </div>
                <WidgetConfigForm
                  configSchema={selectedInstance.widget?.configSchema || {}}
                  config={{
                    ...selectedInstance.widget?.defaultConfig,
                    ...selectedInstance.config,
                  }}
                  onSave={(newConfig) =>
                    handleUpdateWidget(selectedInstance.id, {
                      config: newConfig,
                    })
                  }
                />
              </section>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateLayoutModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleLayoutCreated}
        />
      )}
    </>
  );
}
