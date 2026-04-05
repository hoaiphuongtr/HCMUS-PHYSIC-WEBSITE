"use client";

import { useState } from "react";
import type { ComponentConfig } from "@puckeditor/core";

function NavbarClient({
  logoSrc,
  logoAlt,
  menuItems,
  bgColor,
  textColor,
  showSearch,
  searchPlaceholder,
  searchSuggestions,
  isEditing,
}: {
  logoSrc: string;
  logoAlt: string;
  menuItems: { label: string; url: string; children: string }[];
  bgColor: string;
  textColor: string;
  showSearch: boolean;
  searchPlaceholder: string;
  searchSuggestions: { label: string; url: string }[];
  isEditing: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <nav
        className="flex items-center justify-between px-6 py-3 shadow-sm sticky top-0 z-50"
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
                    href={isEditing ? "#" : item.url || "#"}
                    tabIndex={isEditing ? -1 : undefined}
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
                  {hasChildren && !isEditing && (
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
          {showSearch && (
            <button
              onClick={() => !isEditing && setSearchOpen(true)}
              className="ml-2 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              style={{ color: textColor || "#1e293b" }}
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          )}
        </div>
      </nav>

      {searchOpen && (
        <div className="fixed inset-0 z-[9999] animate-[fadeIn_0.25s_ease]" style={{ backgroundColor: "#0c2340f2" }}>
          <button
            onClick={() => { setSearchOpen(false); setQuery(""); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div className="flex flex-col items-center justify-start pt-[18vh] px-6 animate-[slideUp_0.35s_ease]">
            <p className="text-white/50 text-xs uppercase tracking-[0.25em] mb-6">Tìm kiếm</p>
            <div className="w-full max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder || "Nhập từ khóa..."}
                autoFocus
                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white text-2xl md:text-3xl pb-4 outline-none placeholder:text-white/30 transition-colors"
              />
              <span className="material-symbols-outlined absolute right-0 top-1 text-white/50 text-3xl">search</span>
            </div>
            {searchSuggestions?.length > 0 && (
              <div className="mt-10 w-full max-w-2xl">
                <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-4">Gợi ý</p>
                <div className="flex flex-wrap gap-3">
                  {searchSuggestions.map((s: { label: string; url: string }, i: number) => (
                    <a
                      key={i}
                      href={s.url}
                      className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all text-sm"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export const Navbar: ComponentConfig<{
  logoSrc: string;
  logoAlt: string;
  menuItems: { label: string; url: string; children: string }[];
  bgColor: string;
  textColor: string;
  showSearch: boolean;
  searchPlaceholder: string;
  searchSuggestions: { label: string; url: string }[];
}> = {
  label: "Navbar",
  defaultProps: {
    logoSrc: "",
    logoAlt: "Logo",
    menuItems: [
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
    showSearch: true,
    searchPlaceholder: "Nhập từ khóa...",
    searchSuggestions: [
      { label: "Tuyển sinh", url: "/tuyen-sinh" },
      { label: "Chương trình đào tạo", url: "/dao-tao" },
      { label: "Nghiên cứu", url: "/nghien-cuu" },
      { label: "Liên hệ", url: "/lien-he" },
    ],
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
    showSearch: {
      type: "radio",
      label: "Show Search",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    searchPlaceholder: { type: "text", label: "Search Placeholder" },
    searchSuggestions: {
      type: "array",
      label: "Search Suggestions",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
      },
    },
  },
  render: ({ logoSrc, logoAlt, menuItems, bgColor, textColor, showSearch, searchPlaceholder, searchSuggestions, puck }) => (
    <NavbarClient
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      menuItems={menuItems}
      bgColor={bgColor}
      textColor={textColor}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      searchSuggestions={searchSuggestions}
      isEditing={!!puck?.isEditing}
    />
  ),
};

export const NavLinks: ComponentConfig<{
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

export const QuickLinks: ComponentConfig<{
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

export const SocialIcons: ComponentConfig<{
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
                <svg viewBox="0 0 24 24" fill="currentColor" className={s.icon} style={{ width: "1em", height: "1em" }}>
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              ) : item.icon === "youtube" ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className={s.icon} style={{ width: "1em", height: "1em" }}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              ) : item.icon === "twitter" ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className={s.icon} style={{ width: "1em", height: "1em" }}>
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
