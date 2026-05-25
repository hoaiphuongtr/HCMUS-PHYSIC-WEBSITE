"use client";

import Link from "next/link";

type Tone = "slate" | "emerald" | "amber" | "rose";

const TONE_CLASS: Record<Tone, string> = {
  slate: "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-700/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-700/40 dark:text-rose-300",
};

type StatCardProps = {
  label: string;
  value: number;
  tone?: Tone;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

export function StatCard({
  label,
  value,
  tone = "slate",
  icon,
  href,
  onClick,
}: StatCardProps) {
  const inner = (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#202c44] transition-colors">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${TONE_CLASS[tone]}`}
      >
        {icon ?? null}
      </div>
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left">
        {inner}
      </button>
    );
  }
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
