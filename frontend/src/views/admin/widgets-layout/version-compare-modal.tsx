"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PageLayoutVersion } from "@/lib/api";

type VersionCompareModalProps = {
  target: PageLayoutVersion;
  baseline: PageLayoutVersion | null;
  onClose: () => void;
};

type DiffOp = "equal" | "add" | "del";

type DiffRow = {
  op: DiffOp;
  leftNo: number | null;
  rightNo: number | null;
  leftText: string | null;
  rightText: string | null;
};

const CONTEXT = 2;

function toJsonLines(value: unknown): string[] {
  if (value === null || value === undefined) return [""];
  return JSON.stringify(value, null, 2).split("\n");
}

// LCS diff producing aligned side-by-side rows with line numbers.
function alignDiff(left: string[], right: string[]): DiffRow[] {
  const n = left.length;
  const m = right.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        left[i] === right[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      rows.push({
        op: "equal",
        leftNo: i + 1,
        rightNo: j + 1,
        leftText: left[i],
        rightText: right[j],
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        op: "del",
        leftNo: i + 1,
        rightNo: null,
        leftText: left[i],
        rightText: null,
      });
      i++;
    } else {
      rows.push({
        op: "add",
        leftNo: null,
        rightNo: j + 1,
        leftText: null,
        rightText: right[j],
      });
      j++;
    }
  }
  while (i < n) {
    rows.push({
      op: "del",
      leftNo: i + 1,
      rightNo: null,
      leftText: left[i],
      rightText: null,
    });
    i++;
  }
  while (j < m) {
    rows.push({
      op: "add",
      leftNo: null,
      rightNo: j + 1,
      leftText: null,
      rightText: right[j],
    });
    j++;
  }
  return rows;
}

type Segment =
  | { kind: "rows"; rows: DiffRow[] }
  | { kind: "skip"; count: number };

function collapseEqualRuns(rows: DiffRow[]): Segment[] {
  const out: Segment[] = [];
  const isChange = (r: DiffRow) => r.op !== "equal";
  // Mark visible-context flags first.
  const visible = new Array(rows.length).fill(false);
  for (let k = 0; k < rows.length; k++) {
    if (isChange(rows[k])) {
      for (let d = -CONTEXT; d <= CONTEXT; d++) {
        const idx = k + d;
        if (idx >= 0 && idx < rows.length) visible[idx] = true;
      }
    }
  }
  let buffer: DiffRow[] = [];
  let skipCount = 0;
  const flushBuffer = () => {
    if (buffer.length > 0) {
      out.push({ kind: "rows", rows: buffer });
      buffer = [];
    }
  };
  const flushSkip = () => {
    if (skipCount > 0) {
      out.push({ kind: "skip", count: skipCount });
      skipCount = 0;
    }
  };
  for (let k = 0; k < rows.length; k++) {
    if (visible[k]) {
      flushSkip();
      buffer.push(rows[k]);
    } else {
      flushBuffer();
      skipCount++;
    }
  }
  flushBuffer();
  flushSkip();
  return out;
}

export function VersionCompareModal({
  target,
  baseline,
  onClose,
}: VersionCompareModalProps) {
  const [fullDiff, setFullDiff] = useState(false);

  const { rows, segments, added, removed } = useMemo(() => {
    const leftLines = toJsonLines(target.puckData);
    const rightLines = baseline ? toJsonLines(baseline.puckData) : [""];
    const r = alignDiff(leftLines, rightLines);
    const segs = collapseEqualRuns(r);
    let a = 0;
    let d = 0;
    for (const row of r) {
      if (row.op === "add") a++;
      else if (row.op === "del") d++;
    }
    return { rows: r, segments: segs, added: a, removed: d };
  }, [target.puckData, baseline]);

  const targetLabel = `v${target.versionNumber}.0`;
  const baselineLabel = baseline
    ? `v${baseline.versionNumber}.0 (Current)`
    : "—";

  const visibleSegments = fullDiff
    ? [{ kind: "rows", rows } as Segment]
    : segments;

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="!max-w-6xl w-[95vw] sm:!max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-10">
            <DialogTitle className="min-w-0 truncate">
              Comparison Preview ({targetLabel} vs {baselineLabel})
            </DialogTitle>
            <button
              type="button"
              onClick={() => setFullDiff((v) => !v)}
              className="text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline shrink-0"
            >
              {fullDiff ? "Show Changes Only" : "View Full Diff"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{added}
            </span>{" "}
            added,{" "}
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              −{removed}
            </span>{" "}
            removed.
          </p>
        </DialogHeader>

        <div className="mt-3 flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 sticky top-0 bg-white dark:bg-[#101622] border-b border-slate-200 dark:border-slate-800 z-10">
            <div className="px-4 py-2 text-center text-sm font-semibold text-rose-600 dark:text-rose-400 border-r border-slate-200 dark:border-slate-800">
              {targetLabel} (Previous)
            </div>
            <div className="px-4 py-2 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {baselineLabel}
            </div>
          </div>

          <div className="font-mono text-xs leading-5">
            {visibleSegments.map((seg, idx) =>
              seg.kind === "skip" ? (
                <SkipRow
                  // biome-ignore lint/suspicious/noArrayIndexKey: segment order is stable
                  key={`skip-${idx}`}
                  count={seg.count}
                />
              ) : (
                seg.rows.map((row, rIdx) => (
                  <DiffRowView
                    // biome-ignore lint/suspicious/noArrayIndexKey: row order is stable within a segment
                    key={`r-${idx}-${rIdx}`}
                    row={row}
                  />
                ))
              ),
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const leftCellTone =
    row.op === "del"
      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "text-slate-500 dark:text-slate-400";
  const rightCellTone =
    row.op === "add"
      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
      : "text-slate-500 dark:text-slate-400";
  const leftSign = row.op === "del" ? "−" : " ";
  const rightSign = row.op === "add" ? "+" : " ";
  const leftStrike = row.op === "del" ? " line-through opacity-80" : "";

  return (
    <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-900 last:border-b-0">
      <div
        className={
          "flex gap-2 px-3 py-0.5 border-r border-slate-200 dark:border-slate-800 " +
          leftCellTone
        }
      >
        <span className="select-none w-6 text-right text-slate-300 dark:text-slate-600 shrink-0">
          {row.leftNo ?? ""}
        </span>
        <span className="select-none w-3 shrink-0">{leftSign}</span>
        <span className={"whitespace-pre-wrap break-all" + leftStrike}>
          {row.leftText ?? " "}
        </span>
      </div>
      <div className={"flex gap-2 px-3 py-0.5 " + rightCellTone}>
        <span className="select-none w-6 text-right text-slate-300 dark:text-slate-600 shrink-0">
          {row.rightNo ?? ""}
        </span>
        <span className="select-none w-3 shrink-0">{rightSign}</span>
        <span className="whitespace-pre-wrap break-all">
          {row.rightText ?? " "}
        </span>
      </div>
    </div>
  );
}

function SkipRow({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-900">
      <div className="px-3 py-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#0e1422] border-r border-slate-200 dark:border-slate-800">
        … {count} unchanged line{count === 1 ? "" : "s"} …
      </div>
      <div className="px-3 py-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#0e1422]">
        … {count} unchanged line{count === 1 ? "" : "s"} …
      </div>
    </div>
  );
}
