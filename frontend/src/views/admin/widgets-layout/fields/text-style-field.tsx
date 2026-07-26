import type { Field } from "@puckeditor/core";
import type { CSSProperties } from "react";

// Shared "Text style" control group for any component that renders text.
// Grouped in an object field so it adds one collapsible section, not a wall of
// flat fields. All values default to "" (= no override) so existing published
// layouts keep their current look until an editor changes them.
// Color intentionally excluded — components already expose their own colorField;
// this group only adds size / weight / italic on top of it.
export type TextStyle = {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
};

const sizeOpts = [
  { label: "Mặc định", value: "" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "30px", value: "30px" },
  { label: "36px", value: "36px" },
  { label: "48px", value: "48px" },
  { label: "60px", value: "60px" },
];

export const textStyleField = {
  type: "object",
  label: "Kiểu chữ (cỡ / đậm / nghiêng)",
  objectFields: {
    fontSize: { type: "select", label: "Cỡ chữ", options: sizeOpts },
    fontWeight: {
      type: "select",
      label: "Độ đậm",
      options: [
        { label: "Mặc định", value: "" },
        { label: "Thường", value: "400" },
        { label: "Vừa", value: "500" },
        { label: "Đậm vừa", value: "600" },
        { label: "Đậm", value: "700" },
      ],
    },
    fontStyle: {
      type: "select",
      label: "Nghiêng",
      options: [
        { label: "Mặc định", value: "" },
        { label: "Thẳng", value: "normal" },
        { label: "Nghiêng", value: "italic" },
      ],
    },
  },
} as unknown as Field<TextStyle | undefined>;

export const resolveTextStyle = (ts?: TextStyle): CSSProperties => {
  if (!ts) return {};
  const s: CSSProperties = {};
  if (ts.fontSize) s.fontSize = ts.fontSize;
  if (ts.fontWeight) s.fontWeight = Number(ts.fontWeight);
  if (ts.fontStyle) s.fontStyle = ts.fontStyle as CSSProperties["fontStyle"];
  return s;
};
