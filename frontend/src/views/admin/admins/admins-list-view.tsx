"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Users as UsersIcon,
  WifiIcon,
} from "@/components/admin/icons";
import { type AdminListItem, adminApi, authApi } from "@/lib/api";

const PAGE_SIZE = 10;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

const initialsOf = (a: AdminListItem) => {
  const f = a.firstName?.[0] ?? "";
  const l = a.lastName?.[0] ?? "";
  const combined = (f + l).trim();
  return combined || a.email[0]?.toUpperCase() || "?";
};

const displayName = (a: AdminListItem) => {
  const full = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
  return full || a.email;
};

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
};

const computeStatus = (a: AdminListItem) => {
  if (!a.isActive) return { label: "Disabled", tone: "rose" } as const;
  if (a.lastLoginAt) {
    const diff = Date.now() - new Date(a.lastLoginAt).getTime();
    if (diff < ACTIVE_WINDOW_MS) {
      return { label: "Active", tone: "emerald" } as const;
    }
  }
  return { label: "Offline", tone: "slate" } as const;
};

export function AdminsListView() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: profile } = useQuery({
    queryKey: ["AUTH", "PROFILE"],
    queryFn: authApi.getProfile,
  });

  useEffect(() => {
    if (profile && profile.role !== "SUPER_ADMIN") {
      router.replace("/admin");
    }
  }, [profile, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["ADMINS", { page, pageSize: PAGE_SIZE }],
    queryFn: () => adminApi.list({ page, pageSize: PAGE_SIZE }),
    enabled: profile?.role === "SUPER_ADMIN",
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeNow = data?.activeNow ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = (page - 1) * PAGE_SIZE + items.length;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0B1120]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Staff Accounts
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage access levels, roles, and account status for faculty
              members and departmental staff.
            </p>
          </div>
          <Link
            href="/admin/admins/new"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-semibold"
          >
            <PlusIcon className="w-4 h-4" />
            Create Admin
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <StatCard
            label="TOTAL ADMINS"
            value={String(total)}
            icon={
              <UsersIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            }
          />
          <StatCard
            label="ACTIVE NOW"
            value={String(activeNow)}
            icon={
              <WifiIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            }
            valueAccent={
              activeNow > 0
                ? "text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 after:content-[''] after:w-2 after:h-2 after:rounded-full after:bg-emerald-500"
                : "text-slate-900 dark:text-slate-100"
            }
          />
        </div>

        <div className="mt-6 bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[3fr_2fr_1fr_1.5fr_0.5fr] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0e1422] border-b border-slate-200 dark:border-slate-800">
            <div>User</div>
            <div>Department</div>
            <div>Status</div>
            <div>Last login</div>
            <div className="text-right">Actions</div>
          </div>

          {isLoading ? (
            <p className="text-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
              Đang tải…
            </p>
          ) : items.length === 0 ? (
            <p className="text-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
              Chưa có admin nào. Bấm "Create Admin" để thêm.
            </p>
          ) : (
            <ul>
              {items.map((a) => {
                const status = computeStatus(a);
                const toneClass =
                  status.tone === "emerald"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                    : status.tone === "rose"
                      ? "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30"
                      : "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-700/50 dark:border-slate-700";
                return (
                  <li
                    key={a.id}
                    className="grid grid-cols-[3fr_2fr_1fr_1.5fr_0.5fr] gap-4 px-6 py-4 items-center border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <Avatar url={a.avatarUrl} initials={initialsOf(a)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {displayName(a)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {a.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {a.department?.name ?? "—"}
                    </div>
                    <div>
                      <span
                        className={
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border " +
                          toneClass
                        }
                      >
                        <span
                          className={
                            "w-1.5 h-1.5 rounded-full " +
                            (status.tone === "emerald"
                              ? "bg-emerald-500"
                              : status.tone === "rose"
                                ? "bg-rose-500"
                                : "bg-slate-400")
                          }
                        />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRelative(a.lastLoginAt)}
                    </div>
                    <div className="text-right text-slate-400 dark:text-slate-500 text-xs">
                      —
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {total > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101622]">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing{" "}
                <strong>
                  {pageStart}-{pageEnd}
                </strong>{" "}
                of <strong>{total}</strong> admins
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#202c44] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueAccent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueAccent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101622] px-5 py-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p
        className={
          "mt-2 text-3xl font-bold " +
          (valueAccent ?? "text-slate-900 dark:text-slate-100")
        }
      >
        {value}
      </p>
    </div>
  );
}

function Avatar({ url, initials }: { url: string | null; initials: string }) {
  if (url) {
    return (
      // biome-ignore lint/performance/noImgElement: avatar from arbitrary backend host
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
