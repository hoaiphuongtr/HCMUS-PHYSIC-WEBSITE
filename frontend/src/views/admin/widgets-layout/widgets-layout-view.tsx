"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CopyIcon,
  DynamicIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/admin/icons";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(
    editParam,
  );
  const lastSyncedEditParam = useRef<string | null>(editParam);

  useEffect(() => {
    if (editParam !== lastSyncedEditParam.current) {
      lastSyncedEditParam.current = editParam;
      setSelectedLayoutId(editParam);
    }
  }, [editParam]);

  const selectLayout = useCallback(
    (layoutId: string | null) => {
      setSelectedLayoutId(layoutId);
      lastSyncedEditParam.current = layoutId;
      const params = new URLSearchParams(searchParams.toString());
      if (layoutId) params.set("edit", layoutId);
      else params.delete("edit");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [layoutMenuId, setLayoutMenuId] = useState<string | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const { data: layouts = [] } = useQuery({
    queryKey: ["PAGE_LAYOUTS"],
    queryFn: () => pageLayoutApi.list(),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const list = query.state.data ?? [];
      const now = Date.now();
      const hasPending = list.some((l) => l.scheduledAt);
      if (!hasPending) return false;
      const hasDueSoon = list.some((l) => {
        if (!l.scheduledAt) return false;
        const t = new Date(l.scheduledAt).getTime();
        return t - now < 120_000;
      });
      return hasDueSoon ? 10_000 : 60_000;
    },
  });

  const { data: selectedLayout } = useQuery({
    queryKey: ["PAGE_LAYOUTS", selectedLayoutId],
    queryFn: () => pageLayoutApi.getById(selectedLayoutId!),
    enabled: !!selectedLayoutId,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const l = query.state.data;
      if (!l?.scheduledAt) return false;
      const t = new Date(l.scheduledAt).getTime();
      return t - Date.now() < 120_000 ? 10_000 : 60_000;
    },
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
      toast.success("Đã lưu layout");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Không lưu được layout");
    },
  });

  const deleteLayoutMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DELETE"],
    mutationFn: (layoutId: string) => pageLayoutApi.remove(layoutId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      if (selectedLayoutId === deleteLayoutMutation.variables) {
        selectLayout(null);
      }
      toast.success("Đã xoá layout");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Không xoá được layout");
    },
  });

  const duplicateLayoutMutation = useMutation({
    mutationKey: ["PAGE_LAYOUTS", "DUPLICATE"],
    mutationFn: (layoutId: string) => pageLayoutApi.duplicate(layoutId),
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      selectLayout(data.id);
      toast.success("Đã nhân bản layout");
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Không nhân bản được layout");
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
    selectLayout(layout.id);
    setShowCreateModal(false);
  };

  const deleteTargetLayout = layouts.find((l) => l.id === deleteTargetId);
  const editTargetLayout = layouts.find((l) => l.id === editTargetId);
  const openMenuLayout = layouts.find((l) => l.id === layoutMenuId);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#1a2436] flex justify-between items-center gap-2 shrink-0">
        <LayoutPicker
          layouts={layouts}
          selectedLayoutId={selectedLayoutId}
          onSelect={(id) => selectLayout(id)}
          onOpenItemMenu={(layoutId, target) => {
            menuTriggerRef.current = target;
            setLayoutMenuId(layoutId);
          }}
          openMenuId={layoutMenuId}
        />
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
              className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-2"
            >
              <PencilIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Edit name & slug
            </button>
            <button
              type="button"
              onClick={() => {
                duplicateLayoutMutation.mutate(openMenuLayout.id);
                setLayoutMenuId(null);
              }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-2"
            >
              <CopyIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                const targetId = openMenuLayout.id;
                setLayoutMenuId(null);
                router.push(
                  `/admin/widgets-layout/${targetId}/version-history`,
                );
              }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-2"
            >
              <ClockIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Version history
            </button>
            <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
            <button
              type="button"
              onClick={() => {
                setDeleteTargetId(openMenuLayout.id);
                setLayoutMenuId(null);
              }}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Delete
            </button>
          </PortalMenu>
        )}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 px-3 py-1.5 rounded-md border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-1.5 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">New</span>
        </button>
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
            <div className="text-center text-slate-400 dark:text-slate-500">
              <DynamicIcon
                name="dashboard_customize"
                className="w-12 h-12 mb-3 mx-auto block"
              />
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

type LayoutStatus = "published" | "scheduled" | "draft";

const computeStatus = (layout: PageLayout): LayoutStatus => {
  if (layout.scheduledAt) return "scheduled";
  if (layout.isPublished) return "published";
  return "draft";
};

const STATUS_META: Record<
  LayoutStatus,
  { label: string; chip: string; dot: string }
> = {
  published: {
    label: "Published",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  scheduled: {
    label: "Scheduled",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  draft: {
    label: "Draft",
    chip: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
};

function LayoutPicker({
  layouts,
  selectedLayoutId,
  onSelect,
  onOpenItemMenu,
  openMenuId,
}: {
  layouts: PageLayout[];
  selectedLayoutId: string | null;
  onSelect: (id: string) => void;
  onOpenItemMenu: (layoutId: string, target: HTMLButtonElement) => void;
  openMenuId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<LayoutStatus>("published");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Keep dropdown open when interacting with the per-item PortalMenu
      // (it renders outside containerRef via React portal).
      if (target.closest("[data-portal-menu]")) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!selectedLayoutId) return;
    const layout = layouts.find((l) => l.id === selectedLayoutId);
    if (layout) setGroupFilter(computeStatus(layout));
  }, [selectedLayoutId, layouts]);

  const counts: Record<LayoutStatus, number> = {
    published: 0,
    scheduled: 0,
    draft: 0,
  };
  for (const l of layouts) counts[computeStatus(l)]++;

  const filtered = layouts
    .filter((l) => computeStatus(l) === groupFilter)
    .filter((l) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const selected = layouts.find((l) => l.id === selectedLayoutId);
  const selectedStatus = selected ? computeStatus(selected) : null;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0 max-w-[480px]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-[#1a2436] text-left transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <DynamicIcon
          name="dashboard_customize"
          className="w-[18px] h-[18px] text-slate-400 dark:text-slate-500 shrink-0"
        />
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
                {selected.name}
                {selectedStatus && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded border ${STATUS_META[selectedStatus].chip}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_META[selectedStatus].dot}`}
                    />
                    {STATUS_META[selectedStatus].label}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                /{selected.slug}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-slate-500 dark:text-slate-400">
              Chọn layout để bắt đầu chỉnh sửa
            </div>
          )}
        </div>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1a2436] border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc slug..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
              <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {(["published", "scheduled", "draft"] as LayoutStatus[]).map(
                (status) => {
                  const meta = STATUS_META[status];
                  const isActive = status === groupFilter;
                  const cls = isActive
                    ? "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded border " +
                      meta.chip
                    : "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50";
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setGroupFilter(status)}
                      className={cls}
                    >
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                        />
                        {meta.label} ({counts[status]})
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <ul role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                {search.trim() ? "Không có layout phù hợp" : "Không có layout"}
              </li>
            ) : (
              filtered.map((l) => {
                const isActive = selectedLayoutId === l.id;
                const status = computeStatus(l);
                const meta = STATUS_META[status];
                const itemClass = isActive
                  ? "flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors"
                  : "flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#202c44] transition-colors";
                return (
                  <li key={l.id} role="option" aria-selected={isActive}>
                    <div className={itemClass}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(l.id);
                          setOpen(false);
                        }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`}
                          />
                          <span className="truncate">{l.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate ml-3">
                          /{l.slug}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenItemMenu(l.id, e.currentTarget);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-slate-200/60 text-slate-400 dark:text-slate-500"
                        aria-label="Layout options"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === l.id}
                      >
                        <MoreVerticalIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
