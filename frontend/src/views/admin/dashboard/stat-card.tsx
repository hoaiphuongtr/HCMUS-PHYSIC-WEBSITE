"use client";

import Link from "next/link";

type Tone = "slate" | "emerald" | "amber" | "rose";

const TONE_CLASS: Record<Tone, string> = {
  slate: "bg-slate-700/60 text-slate-200",
  emerald: "bg-emerald-700/40 text-emerald-300",
  amber: "bg-amber-700/40 text-amber-300",
  rose: "bg-rose-700/40 text-rose-300",
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
    <div className="flex items-start justify-between rounded-xl border border-slate-800 bg-[#1a2436] p-5 hover:border-slate-700 hover:bg-[#202c44] transition-colors">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
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
