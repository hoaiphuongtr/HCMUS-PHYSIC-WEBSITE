"use client";

import type { ComponentConfig, Slot } from "@puckeditor/core";

export const Spacer: ComponentConfig<{ height: string }> = {
  label: "Spacer",
  defaultProps: { height: "md" },
  fields: {
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "XS (8px)", value: "xs" },
        { label: "SM (16px)", value: "sm" },
        { label: "MD (32px)", value: "md" },
        { label: "LG (48px)", value: "lg" },
        { label: "XL (64px)", value: "xl" },
      ],
    },
  },
  render: ({ height }) => {
    const heights: Record<string, string> = {
      xs: "8px",
      sm: "16px",
      md: "32px",
      lg: "48px",
      xl: "64px",
    };
    return <div style={{ height: heights[height] || "32px" }} />;
  },
};

export const Divider: ComponentConfig<{
  style: string;
  color: string;
  thickness: string;
}> = {
  label: "Divider",
  defaultProps: { style: "solid", color: "#e2e8f0", thickness: "normal" },
  fields: {
    style: {
      type: "select",
      label: "Style",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Dashed", value: "dashed" },
        { label: "Dotted", value: "dotted" },
      ],
    },
    color: { type: "text", label: "Color" },
    thickness: {
      type: "select",
      label: "Thickness",
      options: [
        { label: "Thin (1px)", value: "thin" },
        { label: "Normal (2px)", value: "normal" },
        { label: "Thick (4px)", value: "thick" },
      ],
    },
  },
  render: ({ style, color, thickness }) => {
    const widths: Record<string, string> = {
      thin: "1px",
      normal: "2px",
      thick: "4px",
    };
    return (
      <hr
        style={{
          borderStyle: style || "solid",
          borderColor: color || "#e2e8f0",
          borderWidth: 0,
          borderTopWidth: widths[thickness] || "2px",
        }}
      />
    );
  },
};

export const Card: ComponentConfig<{
  padding: string;
  bgColor: string;
  borderRadius: string;
  showBorder: boolean;
  showShadow: boolean;
  content: Slot;
}> = {
  label: "Card",
  defaultProps: {
    padding: "md",
    bgColor: "#ffffff",
    borderRadius: "lg",
    showBorder: true,
    showShadow: true,
  } as any,
  fields: {
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    bgColor: { type: "text", label: "Background Color" },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "XL", value: "xl" },
      ],
    },
    showBorder: {
      type: "radio",
      label: "Show Border",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showShadow: {
      type: "radio",
      label: "Show Shadow",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    content: { type: "slot" },
  },
  render: ({
    padding,
    bgColor,
    borderRadius,
    showBorder,
    showShadow,
    content: Content,
  }: any) => {
    const paddings: Record<string, string> = {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    };
    const radii: Record<string, string> = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
    };
    return (
      <div
        className={`${paddings[padding] || "p-5"} ${radii[borderRadius] || "rounded-lg"} ${showBorder ? "border border-slate-200" : ""} ${showShadow ? "shadow-sm" : ""}`}
        style={{ backgroundColor: bgColor || "#ffffff" }}
      >
        <Content />
      </div>
    );
  },
};

export const Columns: ComponentConfig<{
  columns: string;
  gap: string;
  verticalAlign: string;
  col0: Slot;
  col1: Slot;
  col2: Slot;
  col3: Slot;
}> = {
  label: "Columns",
  defaultProps: { columns: "2", gap: "md", verticalAlign: "top" } as any,
  fields: {
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    verticalAlign: {
      type: "select",
      label: "Vertical Align",
      options: [
        { label: "Top", value: "top" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "bottom" },
        { label: "Stretch", value: "stretch" },
      ],
    },
    col0: { type: "slot", label: "Column 1" },
    col1: { type: "slot", label: "Column 2" },
    col2: { type: "slot", label: "Column 3" },
    col3: { type: "slot", label: "Column 4" },
  },
  render: (props: any) => {
    const { columns, gap, verticalAlign } = props;
    const cols = parseInt(columns, 10) || 2;
    const gaps: Record<string, string> = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-8",
    };
    const aligns: Record<string, string> = {
      top: "items-start",
      center: "items-center",
      bottom: "items-end",
      stretch: "items-stretch",
    };
    const slotComps = [props.col0, props.col1, props.col2, props.col3];
    return (
      <div
        className={`grid ${gaps[gap] || "gap-4"} ${aligns[verticalAlign] || "items-start"}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {slotComps.slice(0, cols).map((SlotComp, i) => (
          <div key={i}>
            <SlotComp />
          </div>
        ))}
      </div>
    );
  },
};

export const Container: ComponentConfig<{
  maxWidth: string;
  padding: string;
  bgColor: string;
  centered: boolean;
  content: Slot;
}> = {
  label: "Container",
  defaultProps: {
    maxWidth: "full",
    padding: "md",
    bgColor: "",
    centered: true,
  } as any,
  fields: {
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small (640px)", value: "sm" },
        { label: "Medium (768px)", value: "md" },
        { label: "Large (1024px)", value: "lg" },
        { label: "XL (1280px)", value: "xl" },
        { label: "Full", value: "full" },
      ],
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    bgColor: { type: "text", label: "Background Color" },
    centered: {
      type: "radio",
      label: "Centered",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    content: { type: "slot" },
  },
  render: ({ maxWidth, padding, bgColor, centered, content: Content }: any) => {
    const maxWidths: Record<string, string> = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      full: "max-w-full",
    };
    const paddings: Record<string, string> = {
      none: "p-0",
      sm: "p-3",
      md: "p-6",
      lg: "p-10",
    };
    return (
      <div
        className={`w-full ${maxWidths[maxWidth] || "max-w-full"} ${centered ? "mx-auto" : ""} ${paddings[padding] || "p-6"}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <Content />
      </div>
    );
  },
};

const GRID_SLOT_KEYS = [
  "cell0",
  "cell1",
  "cell2",
  "cell3",
  "cell4",
  "cell5",
  "cell6",
  "cell7",
  "cell8",
  "cell9",
  "cell10",
  "cell11",
  "cell12",
  "cell13",
  "cell14",
  "cell15",
  "cell16",
  "cell17",
  "cell18",
  "cell19",
  "cell20",
  "cell21",
  "cell22",
  "cell23",
] as const;

export const Grid: ComponentConfig<any> = {
  label: "Grid",
  defaultProps: { columns: "3", rows: "1", gap: "md" },
  fields: {
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
      ],
    },
    rows: {
      type: "select",
      label: "Rows",
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    ...Object.fromEntries(
      GRID_SLOT_KEYS.map((k, i) => [
        k,
        { type: "slot" as const, label: `Cell ${i + 1}` },
      ]),
    ),
  } as any,
  render: (props) => {
    const { columns, rows, gap } = props;
    const cols = parseInt(columns, 10) || 3;
    const rowCount = parseInt(rows, 10) || 1;
    const total = cols * rowCount;
    const gaps: Record<string, string> = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-8",
    };
    return (
      <div
        className={`grid ${gaps[gap] || "gap-4"}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {GRID_SLOT_KEYS.slice(0, total).map((key) => {
          const CellSlot = (props as any)[key];
          return (
            <div key={key}>
              <CellSlot />
            </div>
          );
        })}
      </div>
    );
  },
};

export const FooterBlock: ComponentConfig<{
  bgColor: string;
  textColor: string;
  content: Slot;
}> = {
  label: "Footer",
  defaultProps: {
    bgColor: "#0c2340",
    textColor: "#94a3b8",
  } as any,
  fields: {
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
    content: { type: "slot" },
  },
  render: ({ bgColor, textColor, content: Content }: any) => (
    <footer
      className="px-8 py-10"
      style={{
        backgroundColor: bgColor || "#0c2340",
        color: textColor || "#94a3b8",
      }}
    >
      <Content />
    </footer>
  ),
};
