"use client";

import type { CustomField, Field } from "@puckeditor/core";
import type { CSSProperties } from "react";

// Shared "Size / resize" control group for image and card components. Width is a
// DRAG slider (resize by dragging, not typing), height/max-width optional px.
// Empty = no override (keeps the component's current responsive size).
export type SizeStyle = {
  width?: string;
  maxWidth?: string;
  height?: string;
};

// Drag-to-resize width: a range slider 0–100% (0 = auto). Dragging updates the
// stored width live, so the editor canvas resizes as you drag.
const widthSliderField: CustomField<string> = {
  type: "custom",
  label: "Chiều rộng (kéo để chỉnh)",
  render: ({ value, onChange }) => {
    // Empty / unset = full width, shown as 100% (no "auto"). Drag down to shrink.
    const pct =
      typeof value === "string" && value.endsWith("%")
        ? Number.parseInt(value, 10) || 100
        : 100;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200">
          <span>Chiều rộng (kéo để chỉnh)</span>
          <span className="text-blue-600">{pct}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(v >= 100 ? "" : `${v}%`);
          }}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>
    );
  },
};

export const sizeField = {
  type: "object",
  label: "Kích thước (resize)",
  objectFields: {
    width: widthSliderField,
    maxWidth: { type: "text", label: "Rộng tối đa (px, tuỳ chọn)" },
    height: { type: "text", label: "Chiều cao (px, tuỳ chọn)" },
  },
} as unknown as Field<SizeStyle | undefined>;

const px = (v: string): string => (/^\d+$/.test(v) ? `${v}px` : v);

export const resolveSizeStyle = (s?: SizeStyle): CSSProperties => {
  if (!s) return {};
  const out: CSSProperties = {};
  if (s.width) out.width = s.width;
  if (s.maxWidth) out.maxWidth = px(s.maxWidth);
  if (s.height) out.height = px(s.height);
  return out;
};
