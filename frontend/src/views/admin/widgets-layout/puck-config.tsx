"use client";

import { useState, useEffect } from "react";
import type { Config, ComponentConfig, Slot } from "@puckeditor/core";

const Heading: ComponentConfig<{
  text: string;
  level: string;
  alignment: string;
  color: string;
}> = {
  label: "Heading",
  defaultProps: {
    text: "Heading",
    level: "h2",
    alignment: "left",
    color: "#1e293b",
  },
  fields: {
    text: { type: "text", label: "Text" },
    level: {
      type: "select",
      label: "Level",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4", value: "h4" },
        { label: "H5", value: "h5" },
        { label: "H6", value: "h6" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    color: { type: "text", label: "Color" },
  },
  render: ({ text, level, alignment, color }) => {
    const Tag = (level || "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const sizes: Record<string, string> = {
      h1: "text-4xl font-bold",
      h2: "text-3xl font-bold",
      h3: "text-2xl font-semibold",
      h4: "text-xl font-semibold",
      h5: "text-lg font-semibold",
      h6: "text-base font-medium",
    };
    return (
      <Tag
        className={sizes[level] || sizes.h2}
        style={{ textAlign: alignment as any, color: color || "#1e293b" }}
      >
        {text || "Heading"}
      </Tag>
    );
  },
};

const TextBlock: ComponentConfig<{
  content: string;
  fontSize: string;
  alignment: string;
  color: string;
}> = {
  label: "Text",
  defaultProps: {
    content: "Enter your text here...",
    fontSize: "base",
    alignment: "left",
    color: "#475569",
  },
  fields: {
    content: { type: "textarea", label: "Content" },
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Base", value: "base" },
        { label: "Large", value: "lg" },
        { label: "XL", value: "xl" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
        { label: "Justify", value: "justify" },
      ],
    },
    color: { type: "text", label: "Color" },
  },
  render: ({ content, fontSize, alignment, color }) => {
    const sizes: Record<string, string> = {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };
    return (
      <p
        className={`${sizes[fontSize] || "text-base"} leading-relaxed`}
        style={{ textAlign: alignment as any, color: color || "#475569" }}
      >
        {content || "Enter your text here..."}
      </p>
    );
  },
};

const ImageBlock: ComponentConfig<{
  src: string;
  alt: string;
  caption: string;
  fit: string;
  borderRadius: string;
}> = {
  label: "Image",
  defaultProps: {
    src: "",
    alt: "",
    caption: "",
    fit: "cover",
    borderRadius: "md",
  },
  fields: {
    src: { type: "text", label: "Image URL" },
    alt: { type: "text", label: "Alt Text" },
    caption: { type: "text", label: "Caption" },
    fit: {
      type: "select",
      label: "Fit",
      options: [
        { label: "Cover", value: "cover" },
        { label: "Contain", value: "contain" },
        { label: "Fill", value: "fill" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Full", value: "full" },
      ],
    },
  },
  render: ({ src, alt, caption, fit, borderRadius }) => {
    const radii: Record<string, string> = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };
    return (
      <div>
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`w-full ${radii[borderRadius] || "rounded-md"}`}
            style={{ objectFit: (fit as any) || "cover" }}
          />
        ) : (
          <div
            className={`w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center ${radii[borderRadius] || "rounded-md"}`}
          >
            <span className="material-symbols-outlined text-4xl text-slate-300">
              image
            </span>
          </div>
        )}
        {caption && (
          <p className="text-sm text-slate-500 text-center mt-2">{caption}</p>
        )}
      </div>
    );
  },
};

const ButtonBlock: ComponentConfig<{
  label: string;
  url: string;
  variant: string;
  size: string;
  alignment: string;
  fullWidth: boolean;
}> = {
  label: "Button",
  defaultProps: {
    label: "Click me",
    url: "#",
    variant: "primary",
    size: "md",
    alignment: "left",
    fullWidth: false,
  },
  fields: {
    label: { type: "text", label: "Label" },
    url: { type: "text", label: "URL" },
    variant: {
      type: "select",
      label: "Variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    fullWidth: {
      type: "radio",
      label: "Full Width",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: ({ label, url, variant, size, alignment, fullWidth, puck }) => {
    const variants: Record<string, string> = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-slate-700 text-white hover:bg-slate-800",
      outline:
        "border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50",
      ghost: "text-blue-600 bg-transparent hover:bg-blue-50",
    };
    const sizes: Record<string, string> = {
      sm: "px-4 py-1.5 text-sm",
      md: "px-6 py-2 text-base",
      lg: "px-8 py-3 text-lg",
    };
    const aligns: Record<string, string> = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };
    return (
      <div className={`flex ${aligns[alignment] || "justify-start"}`}>
        <a
          href={puck?.isEditing ? "#" : url}
          tabIndex={puck?.isEditing ? -1 : undefined}
          className={`inline-block rounded-md font-medium transition-colors ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? "w-full text-center" : ""}`}
        >
          {label || "Button"}
        </a>
      </div>
    );
  },
};

const Spacer: ComponentConfig<{ height: string }> = {
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

const Divider: ComponentConfig<{
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

const Card: ComponentConfig<{
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

const IconText: ComponentConfig<{
  icon: string;
  title: string;
  description: string;
  iconColor: string;
  layout: string;
}> = {
  label: "Icon + Text",
  defaultProps: {
    icon: "info",
    title: "Feature",
    description: "Feature description",
    iconColor: "#3b82f6",
    layout: "horizontal",
  },
  fields: {
    icon: { type: "text", label: "Icon (Material Symbol)" },
    title: { type: "text", label: "Title" },
    description: { type: "textarea", label: "Description" },
    iconColor: { type: "text", label: "Icon Color" },
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
  },
  render: ({ icon, title, description, iconColor, layout }) => {
    const isVertical = layout === "vertical";
    return (
      <div
        className={`flex ${isVertical ? "flex-col items-center text-center" : "items-start"} gap-3 p-4`}
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ color: iconColor || "#3b82f6" }}
        >
          {icon || "info"}
        </span>
        <div>
          <div className="text-base font-semibold text-slate-800">
            {title || "Feature"}
          </div>
          {description && (
            <div className="text-sm text-slate-500 mt-1">{description}</div>
          )}
        </div>
      </div>
    );
  },
};

const Banner: ComponentConfig<{
  text: string;
  subtext: string;
  bgColor: string;
  textColor: string;
  alignment: string;
  buttonLabel: string;
  buttonUrl: string;
}> = {
  label: "Banner",
  defaultProps: {
    text: "Welcome",
    subtext: "",
    bgColor: "#1e40af",
    textColor: "#ffffff",
    alignment: "center",
    buttonLabel: "",
    buttonUrl: "",
  },
  fields: {
    text: { type: "text", label: "Text" },
    subtext: { type: "text", label: "Subtext" },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    buttonLabel: { type: "text", label: "Button Label" },
    buttonUrl: { type: "text", label: "Button URL" },
  },
  render: ({
    text,
    subtext,
    bgColor,
    textColor,
    alignment,
    buttonLabel,
    buttonUrl,
    puck,
  }) => {
    return (
      <div
        className="rounded-lg px-8 py-6"
        style={{
          backgroundColor: bgColor || "#1e40af",
          color: textColor || "#ffffff",
          textAlign: (alignment as any) || "center",
        }}
      >
        <div className="text-2xl font-bold">{text || "Welcome"}</div>
        {subtext && <div className="text-base opacity-80 mt-1">{subtext}</div>}
        {buttonLabel && (
          <div className="mt-4">
            <a
              href={puck?.isEditing ? "#" : buttonUrl || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className="inline-block px-6 py-2 text-sm font-medium rounded-md bg-white/20 border border-white/30 hover:bg-white/30 transition-colors"
            >
              {buttonLabel}
            </a>
          </div>
        )}
      </div>
    );
  },
};

const NavLinks: ComponentConfig<{
  links: { label: string; url: string }[];
  direction: string;
  showArrow: boolean;
  fontSize: string;
  color: string;
}> = {
  label: "Nav Links",
  defaultProps: {
    links: [
      { label: "Link 1", url: "#" },
      { label: "Link 2", url: "#" },
      { label: "Link 3", url: "#" },
    ],
    direction: "vertical",
    showArrow: true,
    fontSize: "base",
    color: "#374151",
  },
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
      },
    },
    direction: {
      type: "select",
      label: "Direction",
      options: [
        { label: "Vertical", value: "vertical" },
        { label: "Horizontal", value: "horizontal" },
      ],
    },
    showArrow: {
      type: "radio",
      label: "Show Arrow",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Base", value: "base" },
        { label: "Large", value: "lg" },
      ],
    },
    color: { type: "text", label: "Text Color" },
  },
  render: ({ links, direction, showArrow, fontSize, color, puck }) => {
    const isVertical = direction !== "horizontal";
    const sizes: Record<string, string> = {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    };
    return (
      <div className={isVertical ? "space-y-1" : "flex flex-wrap gap-4"}>
        {(links || []).map(
          (link: { label: string; url: string }, i: number) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : link.url}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className={`flex items-center justify-between py-2 ${isVertical && i < links.length - 1 ? "border-b border-slate-100" : ""} ${sizes[fontSize] || "text-base"} font-medium hover:opacity-70 transition-opacity`}
              style={{ color: color || "#374151" }}
            >
              <span>{link.label}</span>
              {showArrow !== false && (
                <span className="text-slate-400 ml-2">&raquo;</span>
              )}
            </a>
          ),
        )}
      </div>
    );
  },
};

const Columns: ComponentConfig<{
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
    const cols = parseInt(columns) || 2;
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

const Container: ComponentConfig<{
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

const Grid: ComponentConfig<any> = {
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
    const cols = parseInt(columns) || 3;
    const rowCount = parseInt(rows) || 1;
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

const ImageGallery: ComponentConfig<{
  images: { src: string; alt: string }[];
  columns: string;
  gap: string;
}> = {
  label: "Image Gallery",
  defaultProps: { images: [], columns: "3", gap: "md" },
  fields: {
    images: {
      type: "array",
      label: "Images",
      arrayFields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  render: ({ images, columns, gap }) => {
    const cols = parseInt(columns) || 3;
    const gaps: Record<string, string> = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };
    if (!images || images.length === 0) {
      return (
        <div
          className={`grid ${gaps[gap] || "gap-4"}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl text-slate-300">
                image
              </span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div
        className={`grid ${gaps[gap] || "gap-4"}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {images.map((img: { src: string; alt: string }, i: number) => (
          <div key={i}>
            {img.src ? (
              <img
                src={img.src}
                alt={img.alt || ""}
                className="w-full aspect-square object-cover rounded-md"
              />
            ) : (
              <div className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-slate-300">
                  image
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  },
};

const VideoEmbed: ComponentConfig<{
  videoUrl: string;
  title: string;
  aspectRatio: string;
}> = {
  label: "Video",
  defaultProps: { videoUrl: "", title: "", aspectRatio: "16:9" },
  fields: {
    videoUrl: { type: "text", label: "Video URL (YouTube/Vimeo)" },
    title: { type: "text", label: "Title" },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
      ],
    },
  },
  render: ({ videoUrl, title, aspectRatio }) => {
    const ratio = aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-video";
    return (
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
        )}
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className={`w-full ${ratio} rounded-lg`}
            allowFullScreen
          />
        ) : (
          <div
            className={`w-full ${ratio} rounded-lg bg-slate-900 flex items-center justify-center`}
          >
            <span className="material-symbols-outlined text-5xl text-white/30">
              play_circle
            </span>
          </div>
        )}
      </div>
    );
  },
};

const ImageSlider: ComponentConfig<{
  slides: { src: string; alt: string; caption: string; linkUrl: string }[];
  autoplay: boolean;
  intervalMs: number;
  height: string;
  showDots: boolean;
  showArrows: boolean;
  borderRadius: string;
}> = {
  label: "Image Slider",
  defaultProps: {
    slides: [
      { src: "", alt: "Slide 1", caption: "Slide 1", linkUrl: "" },
      { src: "", alt: "Slide 2", caption: "Slide 2", linkUrl: "" },
      { src: "", alt: "Slide 3", caption: "Slide 3", linkUrl: "" },
    ],
    autoplay: true,
    intervalMs: 5000,
    height: "lg",
    showDots: true,
    showArrows: true,
    borderRadius: "none",
  },
  fields: {
    slides: {
      type: "array",
      label: "Slides",
      arrayFields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        caption: { type: "text", label: "Caption" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    autoplay: {
      type: "radio",
      label: "Autoplay",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    intervalMs: {
      type: "number",
      label: "Interval (ms)",
      min: 1000,
      max: 15000,
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Small (200px)", value: "sm" },
        { label: "Medium (320px)", value: "md" },
        { label: "Large (450px)", value: "lg" },
        { label: "XL (600px)", value: "xl" },
      ],
    },
    showDots: {
      type: "radio",
      label: "Show Dots",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showArrows: {
      type: "radio",
      label: "Show Arrows",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  render: (props) => {
    const {
      slides,
      autoplay,
      intervalMs,
      height,
      showDots,
      showArrows,
      borderRadius,
      puck,
    } = props;
    const heights: Record<string, string> = {
      sm: "200px",
      md: "320px",
      lg: "450px",
      xl: "600px",
    };
    const radii: Record<string, string> = {
      none: "",
      md: "rounded-md",
      lg: "rounded-lg",
    };
    const h = heights[height] || "450px";
    const r = radii[borderRadius] || "";
    return (
      <ImageSliderClient
        slides={slides || []}
        autoplay={!!autoplay}
        intervalMs={intervalMs || 5000}
        h={h}
        r={r}
        showDots={showDots !== false}
        showArrows={showArrows !== false}
        isEditing={!!puck?.isEditing}
      />
    );
  },
};

function ImageSliderClient({
  slides,
  autoplay,
  intervalMs,
  h,
  r,
  showDots,
  showArrows,
  isEditing,
}: {
  slides: { src: string; alt: string; caption: string; linkUrl: string }[];
  autoplay: boolean;
  intervalMs: number;
  h: string;
  r: string;
  showDots: boolean;
  showArrows: boolean;
  isEditing: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const count = slides.length || 1;

  useEffect(() => {
    if (!autoplay || isEditing || count <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, intervalMs, count, isEditing]);

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  if (count === 0) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-200 flex items-center justify-center ${r}`}
        style={{ height: h }}
      >
        <span className="material-symbols-outlined text-5xl text-slate-400">
          photo_library
        </span>
      </div>
    );
  }

  const slide = slides[current] || slides[0];

  return (
    <div className={`relative overflow-hidden ${r}`} style={{ height: h }}>
      {slide?.src ? (
        <img
          src={slide.src}
          alt={slide.alt || ""}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-800 flex items-center justify-center">
          <div className="text-center text-white">
            <span className="material-symbols-outlined text-5xl mb-2 block opacity-50">
              photo_library
            </span>
            <p className="text-lg font-semibold opacity-80">
              {slide?.caption || `Slide ${current + 1}`}
            </p>
          </div>
        </div>
      )}
      {slide?.caption && slide?.src && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <p className="text-white text-xl font-bold drop-shadow-lg">
            {slide.caption}
          </p>
          {slide.linkUrl && (
            <a
              href={isEditing ? "#" : slide.linkUrl}
              tabIndex={isEditing ? -1 : undefined}
              className="inline-block mt-2 px-4 py-1.5 text-sm text-white bg-white/20 rounded-md border border-white/30 hover:bg-white/30 transition-colors"
            >
              Chi tiết
            </a>
          )}
        </div>
      )}
      {showArrows && count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_left
            </span>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
          </button>
        </>
      )}
      {showDots && count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SectionHeader: ComponentConfig<{
  title: string;
  linkText: string;
  linkUrl: string;
  bgColor: string;
  textColor: string;
}> = {
  label: "Section Header",
  defaultProps: {
    title: "Section Title",
    linkText: "Xem thêm",
    linkUrl: "#",
    bgColor: "#1e40af",
    textColor: "#ffffff",
  },
  fields: {
    title: { type: "text", label: "Title" },
    linkText: { type: "text", label: "Link Text" },
    linkUrl: { type: "text", label: "Link URL" },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
  },
  render: ({ title, linkText, linkUrl, bgColor, textColor, puck }) => (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-t-md"
      style={{ backgroundColor: bgColor || "#1e40af" }}
    >
      <h3
        className="text-sm font-bold uppercase tracking-wide"
        style={{ color: textColor || "#ffffff" }}
      >
        {title}
      </h3>
      {linkText && (
        <a
          href={puck?.isEditing ? "#" : linkUrl || "#"}
          tabIndex={puck?.isEditing ? -1 : undefined}
          className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: textColor || "#ffffff" }}
        >
          {linkText} &raquo;
        </a>
      )}
    </div>
  ),
};

const NewsCard: ComponentConfig<{
  imageUrl: string;
  title: string;
  date: string;
  linkUrl: string;
  layout: string;
}> = {
  label: "News Card",
  defaultProps: {
    imageUrl: "",
    title: "Tiêu đề bài viết",
    date: "25/03/2026",
    linkUrl: "#",
    layout: "horizontal",
  },
  fields: {
    imageUrl: { type: "text", label: "Image URL" },
    title: { type: "text", label: "Title" },
    date: { type: "text", label: "Date" },
    linkUrl: { type: "text", label: "Link URL" },
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Horizontal (thumbnail left)", value: "horizontal" },
        { label: "Vertical (image top)", value: "vertical" },
      ],
    },
  },
  render: ({ imageUrl, title, date, linkUrl, layout, puck }) => {
    const isVertical = layout === "vertical";
    if (isVertical) {
      return (
        <a
          href={puck?.isEditing ? "#" : linkUrl || "#"}
          tabIndex={puck?.isEditing ? -1 : undefined}
          className="block group"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full aspect-video object-cover rounded-md mb-2"
            />
          ) : (
            <div className="w-full aspect-video bg-slate-100 rounded-md mb-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-slate-300">
                image
              </span>
            </div>
          )}
          <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{date}</p>
        </a>
      );
    }
    return (
      <a
        href={puck?.isEditing ? "#" : linkUrl || "#"}
        tabIndex={puck?.isEditing ? -1 : undefined}
        className="flex gap-3 group py-2 border-b border-slate-100 last:border-0"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-20 h-14 object-cover rounded shrink-0"
          />
        ) : (
          <div className="w-20 h-14 bg-slate-100 rounded shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-slate-300">
              image
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{date}</p>
        </div>
      </a>
    );
  },
};

const ProfileCard: ComponentConfig<{
  imageUrl: string;
  name: string;
  role: string;
  description: string;
  linkUrl: string;
}> = {
  label: "Profile Card",
  defaultProps: {
    imageUrl: "",
    name: "Họ và Tên",
    role: "Chức vụ",
    description: "",
    linkUrl: "#",
  },
  fields: {
    imageUrl: { type: "text", label: "Photo URL" },
    name: { type: "text", label: "Name" },
    role: { type: "text", label: "Role/Title" },
    description: { type: "textarea", label: "Description" },
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ imageUrl, name, role, description, linkUrl, puck }) => (
    <a
      href={puck?.isEditing ? "#" : linkUrl || "#"}
      tabIndex={puck?.isEditing ? -1 : undefined}
      className="block text-center group"
    >
      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full aspect-[3/4] object-cover"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              person
            </span>
          </div>
        )}
      </div>
      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
        {name}
      </h4>
      <p className="text-xs text-slate-500 mt-1">{role}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-3">
          {description}
        </p>
      )}
    </a>
  ),
};

const LogoGrid: ComponentConfig<{
  logos: { src: string; alt: string; linkUrl: string }[];
  columns: string;
  height: string;
}> = {
  label: "Logo Grid",
  defaultProps: {
    logos: [
      { src: "", alt: "Partner 1", linkUrl: "#" },
      { src: "", alt: "Partner 2", linkUrl: "#" },
      { src: "", alt: "Partner 3", linkUrl: "#" },
    ],
    columns: "6",
    height: "60",
  },
  fields: {
    logos: {
      type: "array",
      label: "Logos",
      arrayFields: {
        src: { type: "text", label: "Logo URL" },
        alt: { type: "text", label: "Name" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
      ],
    },
    height: {
      type: "select",
      label: "Logo Height",
      options: [
        { label: "40px", value: "40" },
        { label: "60px", value: "60" },
        { label: "80px", value: "80" },
      ],
    },
  },
  render: ({ logos, columns, height, puck }) => {
    const cols = parseInt(columns) || 6;
    const h = parseInt(height) || 60;
    return (
      <div
        className="grid gap-6 items-center justify-items-center"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {(logos || []).map(
          (logo: { src: string; alt: string; linkUrl: string }, i: number) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : logo.linkUrl || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className="block hover:opacity-70 transition-opacity"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.alt || ""}
                  style={{ height: `${h}px` }}
                  className="object-contain"
                />
              ) : (
                <div
                  className="bg-slate-100 rounded-md flex items-center justify-center px-4"
                  style={{ height: `${h}px`, minWidth: `${h * 1.5}px` }}
                >
                  <span className="text-xs text-slate-400 text-center">
                    {logo.alt || "Logo"}
                  </span>
                </div>
              )}
            </a>
          ),
        )}
      </div>
    );
  },
};

const FooterBlock: ComponentConfig<{
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

const SocialIcons: ComponentConfig<{
  icons: { icon: string; url: string; color: string }[];
  size: string;
  gap: string;
  alignment: string;
}> = {
  label: "Social Icons",
  defaultProps: {
    icons: [
      { icon: "facebook", url: "#", color: "#1877f2" },
      { icon: "mail", url: "#", color: "#ea4335" },
      { icon: "phone", url: "#", color: "#34a853" },
    ],
    size: "md",
    gap: "sm",
    alignment: "left",
  },
  fields: {
    icons: {
      type: "array",
      label: "Icons",
      arrayFields: {
        icon: { type: "text", label: "Icon (Material Symbol)" },
        url: { type: "text", label: "URL" },
        color: { type: "text", label: "Color" },
      },
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  render: ({ icons, size, gap, alignment, puck }) => {
    const sizes: Record<string, { btn: string; icon: string }> = {
      sm: { btn: "w-8 h-8", icon: "text-base" },
      md: { btn: "w-10 h-10", icon: "text-xl" },
      lg: { btn: "w-12 h-12", icon: "text-2xl" },
    };
    const gaps: Record<string, string> = {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    };
    const aligns: Record<string, string> = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };
    const s = sizes[size] || sizes.md;
    return (
      <div
        className={`flex items-center ${gaps[gap] || "gap-3"} ${aligns[alignment] || "justify-start"}`}
      >
        {(icons || []).map(
          (item: { icon: string; url: string; color: string }, i: number) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : item.url || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className={`${s.btn} rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
              style={{ backgroundColor: item.color || "#3b82f6" }}
            >
              {item.icon === "facebook" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={s.icon}
                  style={{ width: "1em", height: "1em" }}
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              ) : item.icon === "youtube" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={s.icon}
                  style={{ width: "1em", height: "1em" }}
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              ) : item.icon === "twitter" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={s.icon}
                  style={{ width: "1em", height: "1em" }}
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ) : (
                <span className={`material-symbols-outlined ${s.icon}`}>
                  {item.icon || "link"}
                </span>
              )}
            </a>
          ),
        )}
      </div>
    );
  },
};

const ContactInfo: ComponentConfig<{
  address: string;
  phone: string;
  email: string;
  showIcons: boolean;
  color: string;
  layout: string;
  alignment: string;
}> = {
  label: "Contact Info",
  defaultProps: {
    address: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM",
    phone: "+84 28 38355272",
    email: "phys@hcmus.edu.vn",
    showIcons: true,
    color: "#475569",
    layout: "vertical",
    alignment: "left",
  },
  fields: {
    address: { type: "text", label: "Address" },
    phone: { type: "text", label: "Phone" },
    email: { type: "text", label: "Email" },
    showIcons: {
      type: "radio",
      label: "Show Icons",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    color: { type: "text", label: "Text Color" },
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Vertical", value: "vertical" },
        { label: "Inline", value: "inline" },
      ],
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
      ],
    },
  },
  render: ({
    address,
    phone,
    email,
    showIcons,
    color,
    layout,
    alignment,
    puck,
  }) => {
    const items = [
      { icon: "location_on", text: address, href: "" },
      { icon: "phone", text: phone, href: `tel:${phone}` },
      { icon: "mail", text: email, href: `mailto:${email}` },
    ].filter((item) => item.text);
    const isInline = layout === "inline";
    const isCenter = alignment === "center";
    return (
      <div
        className={
          isInline
            ? "flex flex-wrap items-center gap-x-6 gap-y-2" +
              (isCenter ? " justify-center" : "")
            : "space-y-2" + (isCenter ? " flex flex-col items-center" : "")
        }
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {showIcons !== false && (
              <span
                className="material-symbols-outlined text-lg shrink-0"
                style={{ color: color || "#475569" }}
              >
                {item.icon}
              </span>
            )}
            {item.href ? (
              <a
                href={puck?.isEditing ? "#" : item.href}
                tabIndex={puck?.isEditing ? -1 : undefined}
                className="text-sm hover:underline"
                style={{ color: color || "#475569" }}
              >
                {item.text}
              </a>
            ) : (
              <span className="text-sm" style={{ color: color || "#475569" }}>
                {item.text}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  },
};

const AnnouncementBar: ComponentConfig<{
  text: string;
  bgColor: string;
  textColor: string;
  icon: string;
  linkUrl: string;
}> = {
  label: "Announcement Bar",
  defaultProps: {
    text: "Thông báo quan trọng",
    bgColor: "#dc2626",
    textColor: "#ffffff",
    icon: "campaign",
    linkUrl: "",
  },
  fields: {
    text: { type: "text", label: "Text" },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
    icon: { type: "text", label: "Icon (Material Symbol)" },
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ text, bgColor, textColor, icon, linkUrl, puck }) => (
    <div
      className="px-4 py-2.5 flex items-center gap-3"
      style={{
        backgroundColor: bgColor || "#dc2626",
        color: textColor || "#ffffff",
      }}
    >
      {icon && (
        <span className="material-symbols-outlined text-lg shrink-0">
          {icon}
        </span>
      )}
      {linkUrl ? (
        <a
          href={puck?.isEditing ? "#" : linkUrl}
          tabIndex={puck?.isEditing ? -1 : undefined}
          className="text-sm font-medium flex-1 hover:underline"
        >
          {text}
        </a>
      ) : (
        <span className="text-sm font-medium flex-1">{text}</span>
      )}
    </div>
  ),
};

const Navbar: ComponentConfig<{
  logoSrc: string;
  logoAlt: string;
  menuItems: { label: string; url: string; children: string }[];
  bgColor: string;
  textColor: string;
}> = {
  label: "Navbar",
  defaultProps: {
    logoSrc: "",
    logoAlt: "Logo",
    menuItems: [
      { label: "Trang chủ", url: "/", children: "" },
      { label: "Giới thiệu", url: "/gioi-thieu", children: "" },
      {
        label: "Đào tạo",
        url: "/dao-tao",
        children: "Đại học,Sau đại học,Quy chế",
      },
      { label: "Nghiên cứu", url: "/nghien-cuu", children: "" },
      { label: "Liên hệ", url: "/lien-he", children: "" },
    ],
    bgColor: "#ffffff",
    textColor: "#1e293b",
  },
  fields: {
    logoSrc: { type: "text", label: "Logo URL" },
    logoAlt: { type: "text", label: "Logo Alt" },
    menuItems: {
      type: "array",
      label: "Menu Items",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
        children: { type: "text", label: "Dropdown items (comma-separated)" },
      },
    },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
  },
  render: ({ logoSrc, logoAlt, menuItems, bgColor, textColor, puck }) => (
    <nav
      className="flex items-center justify-between px-6 py-3 shadow-sm"
      style={{ backgroundColor: bgColor || "#ffffff" }}
    >
      <div className="flex items-center gap-3">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={logoAlt || "Logo"}
            className="h-10 object-contain"
          />
        ) : (
          <div className="h-10 w-10 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {(menuItems || []).map(
          (
            item: { label: string; url: string; children: string },
            i: number,
          ) => {
            const hasChildren =
              item.children && item.children.trim().length > 0;
            return (
              <div key={i} className="relative group">
                <a
                  href={puck?.isEditing ? "#" : item.url || "#"}
                  tabIndex={puck?.isEditing ? -1 : undefined}
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1"
                  style={{ color: textColor || "#1e293b" }}
                >
                  {item.label}
                  {hasChildren && (
                    <span className="material-symbols-outlined text-sm opacity-50">
                      expand_more
                    </span>
                  )}
                </a>
                {hasChildren && !puck?.isEditing && (
                  <div className="absolute top-full left-0 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {item.children.split(",").map((child, j) => (
                      <a
                        key={j}
                        href="#"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {child.trim()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </nav>
  ),
};

const QuickLinks: ComponentConfig<{
  links: { icon: string; label: string; url: string; color: string }[];
  columns: string;
}> = {
  label: "Quick Links",
  defaultProps: {
    links: [
      { icon: "language", label: "Cổng thông tin", url: "#", color: "#2563eb" },
      { icon: "local_library", label: "Thư viện", url: "#", color: "#7c3aed" },
      { icon: "mail", label: "Email", url: "#", color: "#dc2626" },
      { icon: "school", label: "E-Learning", url: "#", color: "#059669" },
      { icon: "event", label: "Lịch học", url: "#", color: "#d97706" },
      { icon: "support_agent", label: "Hỗ trợ", url: "#", color: "#0891b2" },
    ],
    columns: "6",
  },
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        icon: { type: "text", label: "Icon (Material Symbol)" },
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
        color: { type: "text", label: "Color" },
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
      ],
    },
  },
  render: ({ links, columns, puck }) => {
    const cols = parseInt(columns) || 6;
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {(links || []).map(
          (
            link: { icon: string; label: string; url: string; color: string },
            i: number,
          ) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : link.url || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className="flex flex-col items-center gap-2 py-4 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: link.color || "#3b82f6" }}
              >
                <span className="material-symbols-outlined text-xl">
                  {link.icon || "link"}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-600 text-center">
                {link.label}
              </span>
            </a>
          ),
        )}
      </div>
    );
  },
};

const DepartmentCard: ComponentConfig<{
  imageUrl: string;
  title: string;
  linkUrl: string;
}> = {
  label: "Department Card",
  defaultProps: {
    imageUrl: "",
    title: "Tên bộ môn",
    linkUrl: "#",
  },
  fields: {
    imageUrl: { type: "text", label: "Background Image URL" },
    title: { type: "text", label: "Title" },
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ imageUrl, title, linkUrl, puck }) => (
    <a
      href={puck?.isEditing ? "#" : linkUrl || "#"}
      tabIndex={puck?.isEditing ? -1 : undefined}
      className="block relative aspect-[16/10] rounded-lg overflow-hidden group"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
        <span className="text-white text-sm font-semibold drop-shadow-lg">
          {title}
        </span>
      </div>
    </a>
  ),
};

const LogoSlider: ComponentConfig<{
  logos: { src: string; alt: string; linkUrl: string }[];
  bgImageUrl: string;
  title: string;
  description: string;
  logoSize: string;
}> = {
  label: "Logo Slider",
  defaultProps: {
    logos: [
      { src: "", alt: "Đại học Quốc Gia", linkUrl: "#" },
      { src: "", alt: "Đại học Sài Gòn", linkUrl: "#" },
      { src: "", alt: "Đại học Cần Thơ", linkUrl: "#" },
      { src: "", alt: "Đại học Kinh tế - Luật", linkUrl: "#" },
      { src: "", alt: "Đại học Bách Khoa", linkUrl: "#" },
    ],
    bgImageUrl: "",
    title: "Liên kết",
    description: "",
    logoSize: "80",
  },
  fields: {
    logos: {
      type: "array",
      label: "Logos",
      arrayFields: {
        src: { type: "text", label: "Logo URL" },
        alt: { type: "text", label: "Name" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    bgImageUrl: { type: "text", label: "Background Image URL" },
    title: { type: "text", label: "Title" },
    description: { type: "textarea", label: "Description" },
    logoSize: {
      type: "select",
      label: "Logo Size",
      options: [
        { label: "60px", value: "60" },
        { label: "80px", value: "80" },
        { label: "100px", value: "100" },
      ],
    },
  },
  render: ({ logos, bgImageUrl, title, description, logoSize, puck }) => {
    const size = parseInt(logoSize) || 80;
    return (
      <div className="relative py-12 px-6 overflow-hidden">
        {bgImageUrl ? (
          <img
            src={bgImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center">
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-white/80 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          <div className="flex items-center justify-around flex-wrap gap-y-6">
            {(logos || []).map(
              (
                logo: { src: string; alt: string; linkUrl: string },
                i: number,
              ) => (
                <a
                  key={i}
                  href={puck?.isEditing ? "#" : logo.linkUrl || "#"}
                  tabIndex={puck?.isEditing ? -1 : undefined}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className="bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ width: `${size}px`, height: `${size}px` }}
                  >
                    {logo.src ? (
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className="object-contain rounded-full"
                        style={{
                          width: `${size * 0.7}px`,
                          height: `${size * 0.7}px`,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-slate-400 text-center px-1 leading-tight">
                        {logo.alt}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-white mt-1 group-hover:underline">
                    {logo.alt}
                  </span>
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    );
  },
};

export const puckConfig: Config = {
  categories: {
    layout: {
      title: "Layout",
      components: [
        "Container",
        "Columns",
        "Grid",
        "Card",
        "FooterBlock",
        "Spacer",
        "Divider",
      ],
    },
    navigation: {
      title: "Navigation",
      components: ["Navbar", "NavLinks", "QuickLinks", "SocialIcons"],
    },
    content: {
      title: "Content",
      components: [
        "SectionHeader",
        "NewsCard",
        "ProfileCard",
        "DepartmentCard",
        "Heading",
        "TextBlock",
        "IconText",
        "ContactInfo",
      ],
    },
    media: {
      title: "Media",
      components: [
        "ImageSlider",
        "ImageBlock",
        "ImageGallery",
        "LogoGrid",
        "LogoSlider",
        "VideoEmbed",
      ],
    },
    interactive: {
      title: "Interactive",
      components: ["ButtonBlock", "Banner", "AnnouncementBar"],
    },
  },
  components: {
    Heading,
    TextBlock,
    ImageBlock,
    ButtonBlock,
    Spacer,
    Divider,
    Card,
    IconText,
    Banner,
    NavLinks,
    Columns,
    Container,
    Grid,
    ImageGallery,
    VideoEmbed,
    ImageSlider,
    SectionHeader,
    NewsCard,
    ProfileCard,
    LogoGrid,
    LogoSlider,
    FooterBlock,
    SocialIcons,
    ContactInfo,
    AnnouncementBar,
    Navbar,
    QuickLinks,
    DepartmentCard,
  } as any,
};
