"use client";

import { createUsePuck, Puck } from "@puckeditor/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "@puckeditor/core/puck.css";
import {
  ChevronDownIcon,
  ClockIcon,
  ExternalLinkIcon,
  EyeOffIcon,
  UploadIcon,
  XIcon,
} from "@/components/admin/icons";
import { type PageLayout, pageLayoutApi } from "@/lib/api";
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from "@/lib/i18n";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import { ModalPortal, PortalMenu } from "./portal-menu";
import { puckConfig } from "./puck-config";

const usePuck = createUsePuck();

const SLOT_TYPES: Record<string, string[]> = {
  Container: ["content"],
  Card: ["content"],
  Columns: ["col0", "col1", "col2", "col3"],
  Grid: Array.from({ length: 24 }, (_, i) => `cell${i}`),
  FooterBlock: ["content"],
};

type SlotTarget = {
  zoneCompound: string;
  label: string;
  contentLength: number;
};

function walkForSlotTargets(
  data: any,
  selectedId: string | undefined,
): SlotTarget[] {
  const out: SlotTarget[] = [
    {
      zoneCompound: "root:default-zone",
      label: "Root (page)",
      contentLength: Array.isArray(data?.content) ? data.content.length : 0,
    },
  ];
  const visit = (item: any) => {
    if (!item || item.props?.id === selectedId) return;
    const type = item.type as string | undefined;
    const slots = type ? SLOT_TYPES[type] : undefined;
    if (slots && item.props) {
      const name = item.props?.id || type;
      for (const slot of slots) {
        const slotValue = item.props[slot];
        if (Array.isArray(slotValue)) {
          out.push({
            zoneCompound: `${item.props.id}:${slot}`,
            label: `${type} (${name}) › ${slot}`,
            contentLength: slotValue.length,
          });
          for (const child of slotValue) visit(child);
        }
      }
    } else if (item.props) {
      for (const key of Object.keys(item.props)) {
        const value = item.props[key];
        if (Array.isArray(value)) {
          for (const child of value) visit(child);
        }
      }
    }
  };
  if (Array.isArray(data?.content)) {
    for (const item of data.content) visit(item);
  }
  return out;
}

function MoveToPicker() {
  const selectedItem = usePuck((s) => s.selectedItem);
  const appState = usePuck((s) => s.appState);
  const dispatch = usePuck((s) => s.dispatch);

  const currentZone = appState.ui?.itemSelector?.zone;
  const currentIndex = appState.ui?.itemSelector?.index;
  const selectedId = selectedItem?.props?.id;

  const targets = useMemo(() => {
    if (!selectedItem) return [];
    return walkForSlotTargets(appState.data, selectedId).filter(
      (t) => t.zoneCompound !== currentZone,
    );
  }, [selectedItem, appState.data, currentZone, selectedId]);

  if (
    !selectedItem ||
    currentZone === undefined ||
    currentIndex === undefined
  ) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121a2b]">
      <label
        htmlFor="move-to-zone"
        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
      >
        Move to container
      </label>
      <select
        id="move-to-zone"
        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1.5 bg-white dark:bg-[#1a2436]"
        value=""
        onChange={(e) => {
          const destZone = e.target.value;
          if (!destZone) return;
          const target = targets.find((t) => t.zoneCompound === destZone);
          const destIndex = target?.contentLength ?? 0;
          dispatch({
            type: "move",
            sourceZone: currentZone,
            sourceIndex: currentIndex,
            destinationZone: destZone,
            destinationIndex: destIndex,
          });
          dispatch({
            type: "setUi",
            ui: {
              itemSelector: { zone: destZone, index: destIndex },
            },
          });
        }}
      >
        <option value="" disabled>
          Choose target…
        </option>
        {targets.map((t) => (
          <option key={t.zoneCompound} value={t.zoneCompound}>
            {t.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        Tip: you can also drag the component by its border in the canvas.
      </p>
    </div>
  );
}

function EditJsonButton() {
  const appState = usePuck((s) => s.appState);
  const dispatch = usePuck((s) => s.dispatch);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setValue(JSON.stringify(appState.data, null, 2));
    setError(null);
    setOpen(true);
  };

  const apply = () => {
    try {
      const parsed = JSON.parse(value);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray(parsed.content)
      ) {
        setError("Expected shape: { root: {}, content: [] }");
        return;
      }
      dispatch({ type: "setData", data: parsed });
      toast.success("JSON applied — remember to Save draft");
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      setError(message);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title="Edit raw JSON"
        aria-label="Edit raw JSON"
        className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] hover:bg-slate-50 dark:hover:bg-[#202c44] text-slate-600 dark:text-slate-300 max-w-[48px] w-full"
      >
        {"{ }"}
      </button>
      {open && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-4"
            style={{ zIndex: 10001 }}
          >
            <div className="bg-white dark:bg-[#1a2436] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Edit raw JSON
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Advanced — changes apply in-memory. Click Save draft after.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 flex-1 overflow-hidden flex flex-col gap-2">
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  spellCheck={false}
                  className="flex-1 min-h-[60vh] w-full font-mono text-xs border border-slate-200 dark:border-slate-800 rounded-md p-3 bg-slate-50 dark:bg-[#121a2b] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-xs text-red-600 font-mono whitespace-pre-wrap">
                    {error}
                  </p>
                )}
              </div>
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202c44]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

function PuckDispatchCapture({
  dispatchRef,
  children,
}: {
  dispatchRef: React.MutableRefObject<((action: any) => void) | null>;
  children: React.ReactNode;
}) {
  const dispatch = usePuck((s) => s.dispatch);
  dispatchRef.current = dispatch;
  return <>{children}</>;
}

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
  const statusLabel = layout.scheduledAt
    ? layout.isPublished
      ? `Published — update scheduled ${new Date(layout.scheduledAt).toLocaleString()}`
      : `Scheduled ${new Date(layout.scheduledAt).toLocaleString()}`
    : layout.isPublished
      ? "Published"
      : "Draft";
  const publicSiteUrl =
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "http://localhost:3002";
  const publicLayoutUrl = `${publicSiteUrl}/${layout.slug}`;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
        {statusLabel}
      </span>
      {layout.isPublished && (
        <a
          href={publicLayoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-1"
        >
          <ExternalLinkIcon className="w-3.5 h-3.5" />
          View live
        </a>
      )}
      <button
        type="button"
        onClick={handleSaveOnly}
        disabled={disabled}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] hover:bg-slate-50 dark:hover:bg-[#202c44] disabled:opacity-50"
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
          <ChevronDownIcon className="w-4 h-4 align-middle" />
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
          className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-2"
        >
          <UploadIcon className="w-4 h-4 text-blue-600" />
          Publish now
        </button>
        <button
          type="button"
          onClick={() => {
            setShowScheduleModal(true);
            setOpen(false);
          }}
          disabled={disabled}
          className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] inline-flex items-center gap-2"
        >
          <ClockIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Schedule publish...
        </button>
        {layout.isPublished || layout.scheduledAt ? (
          <>
            <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
            <button
              type="button"
              onClick={unpublish}
              disabled={disabled}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
            >
              <EyeOffIcon className="w-4 h-4" />
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
            <div className="bg-white dark:bg-[#1a2436] rounded-lg shadow-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Schedule publish
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                The selected layouts will be automatically published at the
                chosen time.
              </p>
              <label
                htmlFor="schedule-publish-at"
                className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1"
              >
                Publish at
              </label>
              <input
                id="schedule-publish-at"
                type="datetime-local"
                value={scheduleValue}
                onChange={(e) => setScheduleValue(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-sm"
              />

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Also publish together (optional)
                </p>
                <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {otherLayouts.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2">
                      No other layouts available.
                    </p>
                  ) : (
                    otherLayouts.map((l) => (
                      <label
                        key={l.id}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={alsoScheduleIds.includes(l.id)}
                          onChange={() => toggleAlsoSchedule(l.id)}
                          className="rounded border-slate-300 dark:border-slate-700"
                        />
                        <span className="flex-1 truncate">
                          <span className="font-semibold">{l.name}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-1">/{l.slug}</span>
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
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202c44]"
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

  const dispatchRef = useRef<((action: any) => void) | null>(null);

  const handleAction = useCallback(
    (action: any, appState: any, prevAppState: any) => {
      if (
        action.type === "setUi" &&
        appState.ui?.itemSelector &&
        !appState.ui?.rightSideBarVisible
      ) {
        setTimeout(() => {
          dispatchRef.current?.({
            type: "setUi",
            ui: { rightSideBarVisible: true },
          });
        }, 0);
      }
    },
    [],
  );

  const overrides = useMemo(
    () => ({
      headerActions: () => (
        <div className="inline-flex items-center gap-2">
          <PuckLocaleTabs />
          <EditJsonButton />
          <PublishMenu
            layout={layout}
            onSavePuck={handlePublish}
            onLayoutChanged={onLayoutChanged}
            isSaving={isSaving}
          />
        </div>
      ),
      fields: ({ children }: { children: React.ReactNode }) => (
        <>
          <MoveToPicker />
          {children}
        </>
      ),
      puck: (props: { children: React.ReactNode }) => (
        <PuckDispatchCapture dispatchRef={dispatchRef}>
          {props.children}
        </PuckDispatchCapture>
      ),
    }),
    [layout, handlePublish, onLayoutChanged, isSaving],
  );

  return (
    <LocaleProvider initialLocale={DEFAULT_LOCALE}>
      <div className="puck-editor-wrapper h-full">
        <Puck
          config={puckConfig}
          data={initialData}
          onPublish={handlePublish}
          onAction={handleAction}
          overrides={overrides}
          headerTitle={layout.name}
          headerPath={`/${layout.slug}`}
        />
      </div>
    </LocaleProvider>
  );
}

function PuckLocaleTabs() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="inline-flex items-center gap-1 mr-2 px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121a2b]">
      {LOCALES.map((code) => {
        const isActive = code === locale;
        const className = isActive
          ? "px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-600 text-white"
          : "px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900";
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={className}
            title={LOCALE_LABELS[code] || code}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
