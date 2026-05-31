"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/admin/icons";
import { type PageLayoutVersion, pageLayoutApi } from "@/lib/api";
import { VersionCompareModal } from "./version-compare-modal";

type VersionHistoryViewProps = {
  layoutId: string;
};

const PAGE_SIZE = 5;

const formatLongDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today, ${time}`;
  if (wasYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const initialsOf = (v: PageLayoutVersion) => {
  const u = v.publishedByUser;
  if (!u) return "?";
  const a = u.firstName?.[0] ?? "";
  const b = u.lastName?.[0] ?? "";
  const combined = (a + b).trim();
  return combined || u.email[0]?.toUpperCase() || "?";
};

const displayName = (v: PageLayoutVersion) => {
  const u = v.publishedByUser;
  if (!u) return "—";
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.email;
};

const displayRole = (v: PageLayoutVersion) =>
  v.publishedByUser?.position ?? "Editor";

export function VersionHistoryView({ layoutId }: VersionHistoryViewProps) {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [compareTarget, setCompareTarget] = useState<PageLayoutVersion | null>(
    null,
  );

  const { data: layout } = useQuery({
    queryKey: ["PAGE_LAYOUTS", layoutId],
    queryFn: () => pageLayoutApi.getById(layoutId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["PAGE_LAYOUTS", layoutId, "VERSIONS"],
    queryFn: () => pageLayoutApi.listVersions(layoutId),
  });

  const rollback = useMutation({
    mutationKey: ["PAGE_LAYOUTS", layoutId, "ROLLBACK"],
    mutationFn: (params: { versionId: string; mode: "draft" | "republish" }) =>
      pageLayoutApi.rollbackVersion(layoutId, params.versionId, params.mode),
    onSuccess: (_, vars) => {
      toast.success(
        vars.mode === "republish"
          ? "Đã rollback và publish lại"
          : "Đã rollback vào draft",
      );
      queryClient.invalidateQueries({ queryKey: ["PAGE_LAYOUTS"] });
      queryClient.invalidateQueries({
        queryKey: ["PAGE_LAYOUTS", layoutId, "VERSIONS"],
      });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Rollback thất bại");
    },
    onSettled: () => setPendingId(null),
  });

  const versions = data?.versions ?? [];
  const currentVersion = versions.find((v) => v.status === "CURRENT");
  const totalVersions = versions.length;
  const totalPages = Math.max(1, Math.ceil(totalVersions / PAGE_SIZE));
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalVersions);
  const pageRows = useMemo(
    () => versions.slice(pageStart, pageEnd),
    [versions, pageStart, pageEnd],
  );

  const layoutName = layout?.name ?? "Layout";

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0B1120]">
      <header className="sticky top-0 z-10 bg-white dark:bg-[#101622] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm min-w-0"
          >
            <Link
              href="/admin/widgets-layout"
              className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 truncate"
            >
              Layouts
            </Link>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <Link
              href={`/admin/widgets-layout?edit=${layoutId}`}
              className="text-blue-600 dark:text-blue-300 hover:underline truncate"
            >
              {layoutName}
            </Link>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="text-slate-900 dark:text-slate-100 font-medium truncate">
              Version History
            </span>
          </nav>

          <Link
            href={`/admin/widgets-layout?edit=${layoutId}`}
            className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Back to Editor
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Version History
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Track changes, compare versions, and restore previous states of{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {layoutName}
              </span>
              .
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <StatCard
              label="CURRENT VERSION"
              value={currentVersion ? `v${currentVersion.versionNumber}.0` : "—"}
              accent="text-slate-900 dark:text-slate-100"
            />
            <StatCard
              label="TOTAL VERSIONS"
              value={String(totalVersions)}
              accent="text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0e1422] border-b border-slate-200 dark:border-slate-800">
            <div>Version &amp; Date</div>
            <div>Author</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {isLoading ? (
            <p className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
              Đang tải…
            </p>
          ) : totalVersions === 0 ? (
            <p className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
              Chưa có version nào — layout này chưa được publish.
            </p>
          ) : (
            <ul>
              {pageRows.map((v) => {
                const isCurrent = v.status === "CURRENT";
                const isPending =
                  rollback.isPending && pendingId === v.id;
                return (
                  <li
                    key={v.id}
                    className={
                      "relative grid grid-cols-[2fr_2fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b border-slate-100 dark:border-slate-800 last:border-b-0 " +
                      (isCurrent
                        ? "bg-blue-50/40 dark:bg-blue-500/5"
                        : "bg-white dark:bg-[#101622]")
                    }
                  >
                    {isCurrent && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-500"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={
                            "px-2 py-0.5 rounded-md text-xs font-semibold " +
                            (isCurrent
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              : "text-slate-800 dark:text-slate-100")
                          }
                        >
                          v{v.versionNumber}.0
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatLongDate(v.publishedAt)}
                      </p>
                    </div>

                    <div className="min-w-0 flex items-center gap-3">
                      <Avatar
                        url={v.publishedByUser?.avatarUrl ?? null}
                        initials={initialsOf(v)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {displayName(v)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {displayRole(v)}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-slate-700/50 dark:border-slate-700">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCompareTarget(v)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202c44]"
                      >
                        Compare
                      </button>
                      <button
                        type="button"
                        disabled={isCurrent || isPending}
                        onClick={() => {
                          setPendingId(v.id);
                          rollback.mutate({
                            versionId: v.id,
                            mode: "republish",
                          });
                        }}
                        className={
                          "px-3 py-1.5 text-xs font-semibold rounded-md " +
                          (isCurrent
                            ? "text-slate-400 border border-slate-200 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed"
                            : "text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 border border-transparent")
                        }
                      >
                        {isPending ? "Restoring…" : "Restore"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {totalVersions > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101622]">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {pageStart + 1} to {pageEnd} of {totalVersions} versions
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#202c44] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  aria-label="Next page"
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#202c44] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {compareTarget && (
        <VersionCompareModal
          target={compareTarget}
          baseline={currentVersion ?? null}
          onClose={() => setCompareTarget(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101622] px-5 py-4">
      <p className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={"mt-2 text-2xl font-bold " + accent}>{value}</p>
    </div>
  );
}

function Avatar({
  url,
  initials,
}: {
  url: string | null;
  initials: string;
}) {
  if (url) {
    return (
      // biome-ignore lint/performance/noImgElement: avatar from arbitrary backend host, intentionally bypassing next/image
      <img
        src={url}
        alt=""
        className="w-9 h-9 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}
