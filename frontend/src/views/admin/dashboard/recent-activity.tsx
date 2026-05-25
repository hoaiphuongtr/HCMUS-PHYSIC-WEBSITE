"use client";

import Link from "next/link";

type ActivityItem = {
  kind: "post" | "layout";
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  href: string;
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-slate-500",
  PENDING: "bg-blue-500",
  SCHEDULED: "bg-amber-500",
  PUBLISHED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Recent Activity
        </h2>
      </header>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có hoạt động nào.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`}>
              <Link
                href={item.href}
                className="flex items-start gap-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-md transition-colors"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ STATUS_DOT[item.status] ?? "bg-slate-500" }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    <span className="uppercase tracking-wider">
                      {item.kind === "post" ? "Post" : "Layout"}
                    </span>
                    {" · "}
                    {item.status}
                    {" · "}
                    {relativeTime(item.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
