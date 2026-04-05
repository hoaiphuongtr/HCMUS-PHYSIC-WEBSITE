"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { pageLayoutApi, type PageLayout } from "@/lib/api";
import { CreateLayoutModal } from "./create-layout-modal";
import { PuckEditor } from "./puck-editor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function WidgetsLayoutView() {
  const queryClient = useQueryClient();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
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

  const { data: layouts = [] } = useQuery({
    queryKey: ["PAGE_LAYOUTS"],
    queryFn: () => pageLayoutApi.list(),
  });

  const { data: selectedLayout } = useQuery({
    queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
    queryFn: () => pageLayoutApi.getById(selectedLayoutId!),
    enabled: !!selectedLayoutId,
  });

  const savePuckDataMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "SAVE_PUCK_DATA"],
    mutationFn: (params: { layoutId: string; puckData: any }) =>
      pageLayoutApi.savePuckData(params.layoutId, params.puckData),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
      });
      toast.success("Layout saved");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to save layout");
    },
  });

  const deleteLayoutMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DELETE"],
    mutationFn: (layoutId: string) => pageLayoutApi.remove(layoutId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      if (selectedLayoutId === deleteLayoutMutation.variables) {
        setSelectedLayoutId(null);
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
      toast.success("Layout duplicated");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to duplicate layout");
    },
  });

  const handleSavePuckData = (puckData: any) => {
    if (!selectedLayoutId) return;
    savePuckDataMutation.mutate({ layoutId: selectedLayoutId, puckData });
  };

  const handleLayoutCreated = (layout: PageLayout) => {
    queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
    setSelectedLayoutId(layout.id);
    setShowCreateModal(false);
  };

  const deleteTargetLayout = layouts.find((l) => l.id === deleteTargetId);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200/60 bg-white flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
          {layouts.map((l) => (
            <div key={l.id} className="relative shrink-0">
              <button
                onClick={() => setSelectedLayoutId(l.id)}
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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLayoutMenuId(layoutMenuId === l.id ? null : l.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setLayoutMenuId(layoutMenuId === l.id ? null : l.id);
                    }
                  }}
                  className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    more_vert
                  </span>
                </div>
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
                      setDeleteTargetId(l.id);
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
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span className="text-[11px] font-medium">New</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedLayoutId && selectedLayout ? (
          <PuckEditor
            key={selectedLayoutId}
            layout={selectedLayout}
            onSave={handleSavePuckData}
            isSaving={savePuckDataMutation.isPending}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
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

      {showCreateModal && (
        <CreateLayoutModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleLayoutCreated}
        />
      )}

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Layout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTargetLayout?.name}</strong>? All widget
              configurations in this layout will be permanently removed. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteLayoutMutation.isPending}
              onClick={() => {
                if (deleteTargetId) {
                  deleteLayoutMutation.mutate(deleteTargetId, {
                    onSettled: () => setDeleteTargetId(null),
                  });
                }
              }}
            >
              {deleteLayoutMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
