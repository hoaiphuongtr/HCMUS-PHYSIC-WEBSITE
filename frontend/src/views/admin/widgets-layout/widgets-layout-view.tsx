"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type PageLayout, pageLayoutApi } from "@/lib/api";
import { CreateLayoutModal } from "./create-layout-modal";
import { EditLayoutModal } from "./edit-layout-modal";
import { PortalMenu } from "./portal-menu";
import { PuckEditor } from "./puck-editor";

export function WidgetsLayoutView() {
  const queryClient = useQueryClient();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [layoutMenuId, setLayoutMenuId] = useState<string | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
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

  const handleSavePuckData = async (puckData: any) => {
    if (!selectedLayoutId) return;
    await savePuckDataMutation.mutateAsync({
      layoutId: selectedLayoutId,
      puckData,
    });
  };

  const handleLayoutChanged = (_updated: PageLayout) => {
    queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
    queryClient.invalidateQueries({
      queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
    });
  };

  const handleLayoutCreated = (layout: PageLayout) => {
    queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
    setSelectedLayoutId(layout.id);
    setShowCreateModal(false);
  };

  const deleteTargetLayout = layouts.find((l) => l.id === deleteTargetId);
  const editTargetLayout = layouts.find((l) => l.id === editTargetId);
  const openMenuLayout = layouts.find((l) => l.id === layoutMenuId);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200/60 bg-white flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
          {(() => {
            const published = layouts.filter((l) => l.isPublished);
            const pending = layouts.filter(
              (l) => !l.isPublished && l.scheduledAt,
            );
            const drafts = layouts.filter(
              (l) => !l.isPublished && !l.scheduledAt,
            );
            const groups = [
              {
                label: "Published",
                items: published,
                dot: "bg-green-500",
              },
              {
                label: "Pending",
                items: pending,
                dot: "bg-amber-500",
              },
              {
                label: "Draft",
                items: drafts,
                dot: "bg-slate-400",
              },
            ];
            return groups.map(
              (group) =>
                group.items.length > 0 && (
                  <div
                    key={group.label}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium px-1">
                      {group.label}
                    </span>
                    {group.items.map((l) => {
                      const isActive = selectedLayoutId === l.id;
                      const tabClassName = isActive
                        ? "shrink-0 px-3 py-1.5 rounded-md border text-left transition-all inline-flex items-center gap-2 border-blue-300 bg-blue-50"
                        : "shrink-0 px-3 py-1.5 rounded-md border text-left transition-all inline-flex items-center gap-2 border-slate-200 bg-white hover:border-slate-300";
                      return (
                        <div key={l.id} className={tabClassName}>
                          <button
                            type="button"
                            onClick={() => setSelectedLayoutId(l.id)}
                            className="text-left"
                          >
                            <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                              {l.name}
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${group.dot}`}
                              />
                            </div>
                            <div className="text-[9px] text-slate-400">
                              /{l.slug}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              menuTriggerRef.current = e.currentTarget;
                              setLayoutMenuId(
                                layoutMenuId === l.id ? null : l.id,
                              );
                            }}
                            className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400"
                            aria-label="Layout options"
                            aria-haspopup="menu"
                            aria-expanded={layoutMenuId === l.id}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    <div className="w-px h-5 bg-slate-200 mx-1" />
                  </div>
                ),
            );
          })()}
          {openMenuLayout && (
            <PortalMenu
              anchorRef={menuTriggerRef}
              open={true}
              onClose={() => setLayoutMenuId(null)}
              widthPx={180}
            >
              <button
                type="button"
                onClick={() => {
                  setEditTargetId(openMenuLayout.id);
                  setLayoutMenuId(null);
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[14px] text-slate-400">
                  edit
                </span>
                Edit name & slug
              </button>
              <button
                type="button"
                onClick={() => {
                  duplicateLayoutMutation.mutate(openMenuLayout.id);
                  setLayoutMenuId(null);
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[14px] text-slate-400">
                  content_copy
                </span>
                Duplicate
              </button>
              <div className="border-t border-slate-100 my-0.5" />
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetId(openMenuLayout.id);
                  setLayoutMenuId(null);
                }}
                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[14px]">
                  delete
                </span>
                Delete
              </button>
            </PortalMenu>
          )}
          <button
            type="button"
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
            onLayoutChanged={handleLayoutChanged}
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

      {editTargetLayout && (
        <EditLayoutModal
          layout={editTargetLayout}
          onClose={() => setEditTargetId(null)}
          onUpdated={() => setEditTargetId(null)}
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
