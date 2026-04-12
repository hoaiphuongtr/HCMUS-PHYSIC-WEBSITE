"use client";

import { createUsePuck, Puck } from "@puckeditor/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "@puckeditor/core/puck.css";
import { type PageLayout, pageLayoutApi } from "@/lib/api";
import { ModalPortal, PortalMenu } from "./portal-menu";
import { puckConfig } from "./puck-config";

const usePuck = createUsePuck();

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function PublishMenu({
  layout,
  onSavePuck,
  onLayoutChanged,
  isSaving,
}: {
  layout: PageLayout;
  onSavePuck: (data: any) => Promise<void> | void;
  onLayoutChanged: (updated: PageLayout) => void;
  isSaving: boolean;
}) {
  const appState = usePuck((s) => s.appState);
  const [open, setOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleValue, setScheduleValue] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return formatDateTimeLocal(d);
  });
  const [alsoScheduleIds, setAlsoScheduleIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { data: allLayouts = [] } = useQuery({
    queryKey: ["PAGE_LAYOUTS"],
    queryFn: () => pageLayoutApi.list(),
    enabled: showScheduleModal,
  });
  const otherLayouts = allLayouts.filter((l) => l.id !== layout.id);

  const toggleAlsoSchedule = (id: string) => {
    setAlsoScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const publishNow = async () => {
    setBusy(true);
    try {
      await onSavePuck(appState.data);
      const updated = await pageLayoutApi.publish(layout.id);
      onLayoutChanged(updated);
      toast.success("Layout published");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const scheduleSubmit = async () => {
    const scheduledAt = new Date(scheduleValue);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error("Invalid date");
      return;
    }
    if (scheduledAt.getTime() <= Date.now()) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    setBusy(true);
    try {
      await onSavePuck(appState.data);
      const updated = await pageLayoutApi.schedulePublish(
        layout.id,
        scheduledAt.toISOString(),
        alsoScheduleIds,
      );
      onLayoutChanged(updated);
      const extra = alsoScheduleIds.length;
      toast.success(
        extra > 0
          ? `Scheduled ${extra + 1} layouts for ${scheduledAt.toLocaleString()}`
          : `Scheduled for ${scheduledAt.toLocaleString()}`,
      );
      setShowScheduleModal(false);
      setAlsoScheduleIds([]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      const updated = await pageLayoutApi.unpublish(layout.id);
      onLayoutChanged(updated);
      toast.success("Layout unpublished");
    } catch (err: any) {
      toast.error(err?.message || "Failed to unpublish");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const handleSaveOnly = async () => {
    setBusy(true);
    try {
      await onSavePuck(appState.data);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || isSaving;
  const statusLabel = layout.isPublished
    ? "Published"
    : layout.scheduledAt
      ? `Scheduled ${new Date(layout.scheduledAt).toLocaleString()}`
      : "Draft";
  const publicSiteUrl =
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "http://localhost:3002";
  const publicLayoutUrl = `${publicSiteUrl}/${layout.slug}`;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-[11px] text-slate-500 hidden md:inline">
        {statusLabel}
      </span>
      {layout.isPublished && (
        <a
          href={publicLayoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">
            open_in_new
          </span>
          View live
        </a>
      )}
      <button
        type="button"
        onClick={handleSaveOnly}
        disabled={disabled}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
      >
        Save draft
      </button>
      <div className="inline-flex">
        <button
          type="button"
          onClick={publishNow}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-l-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Publish now
        </button>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((p) => !p)}
          disabled={disabled}
          aria-label="More publish options"
          aria-haspopup="menu"
          aria-expanded={open}
          className="px-2 py-1.5 rounded-r-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 border-l border-blue-500"
        >
          <span className="material-symbols-outlined text-[16px] align-middle">
            arrow_drop_down
          </span>
        </button>
      </div>
      <PortalMenu
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        widthPx={240}
      >
        <button
          type="button"
          onClick={publishNow}
          disabled={disabled}
          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px] text-blue-600">
            publish
          </span>
          Publish now
        </button>
        <button
          type="button"
          onClick={() => {
            setShowScheduleModal(true);
            setOpen(false);
          }}
          disabled={disabled}
          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            schedule
          </span>
          Schedule publish...
        </button>
        {layout.isPublished || layout.scheduledAt ? (
          <>
            <div className="border-t border-slate-100 my-0.5" />
            <button
              type="button"
              onClick={unpublish}
              disabled={disabled}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                unpublished
              </span>
              Unpublish
            </button>
          </>
        ) : null}
      </PortalMenu>

      {showScheduleModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-4"
            style={{ zIndex: 10001 }}
          >
            <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Schedule publish
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                The selected layouts will be automatically published at the
                chosen time.
              </p>
              <label
                htmlFor="schedule-publish-at"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Publish at
              </label>
              <input
                id="schedule-publish-at"
                type="datetime-local"
                value={scheduleValue}
                onChange={(e) => setScheduleValue(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Also publish together (optional)
                </p>
                <div className="border border-slate-200 rounded-md divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {otherLayouts.length === 0 ? (
                    <p className="text-xs text-slate-400 px-3 py-2">
                      No other layouts available.
                    </p>
                  ) : (
                    otherLayouts.map((l) => (
                      <label
                        key={l.id}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={alsoScheduleIds.includes(l.id)}
                          onChange={() => toggleAlsoSchedule(l.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="flex-1 truncate">
                          <span className="font-semibold">{l.name}</span>
                          <span className="text-slate-400 ml-1">/{l.slug}</span>
                        </span>
                        {l.isPublished ? (
                          <span className="text-[10px] text-green-600">
                            published
                          </span>
                        ) : l.scheduledAt ? (
                          <span className="text-[10px] text-amber-600">
                            scheduled
                          </span>
                        ) : null}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={scheduleSubmit}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export function PuckEditor({
  layout,
  onSave,
  onLayoutChanged,
  isSaving,
}: {
  layout: PageLayout;
  onSave: (data: any) => Promise<void> | void;
  onLayoutChanged: (updated: PageLayout) => void;
  isSaving: boolean;
}) {
  const initialData = useMemo(() => {
    if (layout.puckData) return layout.puckData;
    return { root: {}, content: [] };
  }, [layout.puckData]);

  const handlePublish = useCallback(
    (data: any) => {
      return onSave(data);
    },
    [onSave],
  );

  const overrides = useMemo(
    () => ({
      headerActions: () => (
        <PublishMenu
          layout={layout}
          onSavePuck={handlePublish}
          onLayoutChanged={onLayoutChanged}
          isSaving={isSaving}
        />
      ),
    }),
    [layout, handlePublish, onLayoutChanged, isSaving],
  );

  return (
    <div className="puck-editor-wrapper h-full">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        overrides={overrides}
        headerTitle={layout.name}
        headerPath={`/${layout.slug}`}
      />
    </div>
  );
}
