"use client";

import { useState } from "react";
import type { PageLayout, WidgetInstance } from "@/lib/api";
import { WidgetInstanceCard } from "./widget-instance-card";

type RowGroup = { row: number; instances: WidgetInstance[] };

function groupByRow(instances: WidgetInstance[]): RowGroup[] {
  const sorted = [...instances].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.order - b.order;
  });
  const groups: RowGroup[] = [];
  for (const inst of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.row === inst.row) {
      last.instances.push(inst);
    } else {
      groups.push({ row: inst.row, instances: [inst] });
    }
  }
  return groups;
}

type DropTarget =
  | { type: "new-row"; afterRow: number }
  | { type: "same-row"; row: number; afterInstanceId: string | null };

export function PageCanvas({
  layout,
  selectedInstanceId,
  onSelectInstance,
  onUpdateWidget,
  onRemoveWidget,
  onReorder,
  onAddWidgetAt,
}: {
  layout: PageLayout;
  selectedInstanceId: string | null;
  onSelectInstance: (id: string | null) => void;
  onUpdateWidget: (
    instanceId: string,
    body: {
      config?: Record<string, any>;
      order?: number;
      row?: number;
      colSpan?: number;
      isVisible?: boolean;
    },
  ) => void;
  onRemoveWidget: (instanceId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddWidgetAt: (widgetId: string, row: number, colSpan: number) => void;
}) {
  const [_dragRowIdx, setDragRowIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const instances = layout.widgets || [];
  const rows = groupByRow(instances);

  const getNextRow = (afterRow: number) => {
    const allRows = rows.map((r) => r.row);
    if (allRows.length === 0) return 0;
    const idx = allRows.indexOf(afterRow);
    if (idx === -1) return Math.max(...allRows) + 1;
    const current = allRows[idx];
    const next = allRows[idx + 1];
    if (next === undefined) return current + 1;
    return current + 1;
  };

  const getRowColUsed = (row: number) => {
    const group = rows.find((r) => r.row === row);
    if (!group) return 0;
    return group.instances.reduce((sum, i) => sum + (i.colSpan || 12), 0);
  };

  const handleRowDragStart = (rowIdx: number) => (e: React.DragEvent) => {
    setDragRowIdx(rowIdx);
    e.dataTransfer.setData("rowIdx", String(rowIdx));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRowDrop = (toRowIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const widgetId = e.dataTransfer.getData("widgetId");
    if (widgetId) {
      const targetRow = rows[toRowIdx];
      if (targetRow) {
        const colUsed = getRowColUsed(targetRow.row);
        const remaining = 12 - colUsed;
        if (remaining >= 3) {
          onAddWidgetAt(widgetId, targetRow.row, remaining);
        } else {
          onAddWidgetAt(widgetId, getNextRow(targetRow.row), 12);
        }
      }
      resetDrag();
      return;
    }

    const fromRowIdx = parseInt(e.dataTransfer.getData("rowIdx"), 10);
    if (Number.isNaN(fromRowIdx) || fromRowIdx === toRowIdx) {
      resetDrag();
      return;
    }

    const reordered = [...rows];
    const [moved] = reordered.splice(fromRowIdx, 1);
    reordered.splice(toRowIdx, 0, moved);
    const flatIds = reordered.flatMap((r) => r.instances.map((i) => i.id));
    onReorder(flatIds);
    resetDrag();
  };

  const handleBetweenRowDrop =
    (afterRowIdx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const widgetId = e.dataTransfer.getData("widgetId");
      if (!widgetId) {
        resetDrag();
        return;
      }
      const afterRow = afterRowIdx >= 0 ? (rows[afterRowIdx]?.row ?? -1) : -1;
      const newRow = getNextRow(afterRow);
      onAddWidgetAt(widgetId, newRow, 12);
      resetDrag();
    };

  const resetDrag = () => {
    setDragRowIdx(null);
    setDropTarget(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData("widgetId");
    if (widgetId) {
      const maxRow = rows.length > 0 ? Math.max(...rows.map((r) => r.row)) : -1;
      onAddWidgetAt(widgetId, maxRow + 1, 12);
    }
    resetDrag();
  };

  const colSpanClass = (span: number) => {
    const map: Record<number, string> = {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
      5: "col-span-5",
      6: "col-span-6",
      7: "col-span-7",
      8: "col-span-8",
      9: "col-span-9",
      10: "col-span-10",
      11: "col-span-11",
      12: "col-span-12",
    };
    return map[span] || "col-span-12";
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
    >
      <div className="w-full max-w-4xl mx-auto py-6 px-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white rounded-md border border-slate-200 px-3 py-1 text-[11px] text-slate-400 text-center">
                phys.hcmus.edu.vn/{layout.slug}
              </div>
            </div>
          </div>

          <div className="p-4 min-h-[400px]">
            {rows.length === 0 && (
              <DropZonePlaceholder
                onDrop={handleCanvasDrop}
                label="Drop widgets here to start building"
                sublabel="or click a widget from the component library"
              />
            )}

            <DropZoneLine
              active={
                dropTarget?.type === "new-row" && dropTarget.afterRow === -1
              }
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropTarget({ type: "new-row", afterRow: -1 });
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={handleBetweenRowDrop(-1)}
            />

            {rows.map((rowGroup, rowIdx) => {
              const colUsed = rowGroup.instances.reduce(
                (s, i) => s + (i.colSpan || 12),
                0,
              );
              const hasSpace = colUsed < 12;

              return (
                <div key={rowGroup.row}>
                  <div
                    className="relative group/row"
                    draggable
                    onDragStart={handleRowDragStart(rowIdx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleRowDrop(rowIdx)}
                    onDragEnd={resetDrag}
                  >
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                      <span className="material-symbols-outlined text-[14px] text-slate-300 bg-white rounded shadow-sm p-0.5 border border-slate-200">
                        drag_indicator
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      {rowGroup.instances.map((inst) => (
                        <div
                          key={inst.id}
                          className={colSpanClass(inst.colSpan || 12)}
                        >
                          <WidgetInstanceCard
                            instance={inst}
                            isSelected={selectedInstanceId === inst.id}
                            onSelect={() =>
                              onSelectInstance(
                                selectedInstanceId === inst.id ? null : inst.id,
                              )
                            }
                            onUpdateWidget={onUpdateWidget}
                            onRemoveWidget={onRemoveWidget}
                          />
                        </div>
                      ))}

                      {hasSpace && (
                        <div
                          className={`${colSpanClass(12 - colUsed)} min-h-[60px]`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget({
                              type: "same-row",
                              row: rowGroup.row,
                              afterInstanceId: null,
                            });
                          }}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const widgetId = e.dataTransfer.getData("widgetId");
                            if (widgetId) {
                              const remaining = 12 - colUsed;
                              onAddWidgetAt(widgetId, rowGroup.row, remaining);
                            }
                            resetDrag();
                          }}
                        >
                          <div
                            className={
                              "h-full rounded-xl border-2 border-dashed transition-all flex items-center justify-center " +
                              (dropTarget?.type === "same-row" &&
                              dropTarget.row === rowGroup.row
                                ? "border-blue-400 bg-blue-50/50"
                                : "border-transparent hover:border-slate-200")
                            }
                          >
                            <div
                              className={
                                "text-center transition-opacity " +
                                (dropTarget?.type === "same-row" &&
                                dropTarget.row === rowGroup.row
                                  ? "opacity-100"
                                  : "opacity-0 group-hover/row:opacity-40")
                              }
                            >
                              <span className="material-symbols-outlined text-[20px] text-slate-400 block">
                                add
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                Drop here ({12 - colUsed}/12)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="absolute -left-6 top-0 bottom-0 flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <span className="text-[9px] text-slate-300 font-mono">
                        R{rowGroup.row}
                      </span>
                    </div>
                  </div>

                  <DropZoneLine
                    active={
                      dropTarget?.type === "new-row" &&
                      dropTarget.afterRow === rowGroup.row
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropTarget({
                        type: "new-row",
                        afterRow: rowGroup.row,
                      });
                    }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={handleBetweenRowDrop(rowIdx)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZoneLine({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className="relative py-1.5"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={
          "h-0.5 rounded-full transition-all " +
          (active ? "bg-blue-500 scale-y-150" : "bg-transparent")
        }
      />
      {active && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-500 text-white text-[9px] font-semibold rounded-full whitespace-nowrap shadow-sm">
          Drop to add new row
        </div>
      )}
    </div>
  );
}

function DropZonePlaceholder({
  onDrop,
  label,
  sublabel,
}: {
  onDrop: (e: React.DragEvent) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(e);
      }}
    >
      <span className="material-symbols-outlined text-4xl mb-2">
        add_circle_outline
      </span>
      <p className="text-sm font-medium">{label}</p>
      {sublabel && <p className="text-xs mt-1">{sublabel}</p>}
    </div>
  );
}
