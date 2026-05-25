"use client";

import type { ComponentConfig } from "@puckeditor/core";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Globe,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { DynamicIcon } from "@/components/admin/icons";
import { LOCALE_LABELS, LOCALES, type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";

type NavbarSubItem = {
  label: LocalizedString;
  url: string;
};

type NavbarMenuChild = {
  label: LocalizedString;
  url: string;
  subChildren: NavbarSubItem[];
};

type NavbarMenuItem = {
  label: LocalizedString;
  url: string;
  children: NavbarMenuChild[];
};

type NavbarSuggestion = { label: LocalizedString; url: string };

function NavbarMenuButton({
  item,
  locale,
  textColor,
  hoverLineColor,
  hoverTextColor,
  isEditing,
}: {
  item: NavbarMenuItem;
  locale: string;
  textColor: string;
  hoverLineColor: string;
  hoverTextColor: string;
  isEditing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = (item.children || []).length > 0;
  const lineColor = hoverLineColor || "#2563eb";
  const onTextHover = hoverTextColor || textColor || "#1e293b";

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={isEditing ? "#" : item.url || "#"}
        tabIndex={isEditing ? -1 : undefined}
        onClick={(e) => {
          if (isEditing) e.preventDefault();
        }}
        className="navbar-menu-link relative px-3 py-2 text-sm font-medium inline-block transition-colors"
        style={
          {
            color: textColor || "#1e293b",
            ["--nav-hover" as string]: onTextHover,
            ["--nav-line" as string]: lineColor,
          } as React.CSSProperties
        }
      >
        <span className="relative">
          {t(item.label, locale)}
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 -bottom-1 h-[2px]"
            style={{
              backgroundColor: lineColor,
              transform: open ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transition: "transform 300ms ease-out",
            }}
          />
        </span>
      </a>
      {hasChildren && open && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div className="min-w-[220px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-visible">
            <ul role="menu" className="py-1">
              {item.children.map((child, j) => (
                <NavbarChildItem
                  key={j}
                  child={child}
                  locale={locale}
                  hoverLineColor={lineColor}
                  hoverTextColor={onTextHover}
                  isEditing={isEditing}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
      <style>{`
        .navbar-menu-link:hover {
          color: var(--nav-hover);
        }
      `}</style>
    </div>
  );
}

function NavbarChildItem({
  child,
  locale,
  hoverLineColor,
  hoverTextColor,
  isEditing,
}: {
  child: NavbarMenuChild;
  locale: string;
  hoverLineColor: string;
  hoverTextColor: string;
  isEditing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasSubs = (child.subChildren || []).length > 0;

  return (
    <li
      role="none"
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        role="menuitem"
        href={isEditing ? "#" : child.url || "#"}
        tabIndex={isEditing ? -1 : undefined}
        onClick={(e) => {
          if (isEditing) e.preventDefault();
        }}
        className="navbar-child-link flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50"
        style={
          {
            color: "#1e293b",
            ["--nav-hover" as string]: hoverTextColor,
          } as React.CSSProperties
        }
      >
        <span>{t(child.label, locale)}</span>
        {hasSubs && <ChevronRight className="w-4 h-4 opacity-50" />}
      </a>
      {hasSubs && open && (
        <div className="absolute left-full top-0 pl-1 z-50">
          <div className="min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-lg">
            <ul role="menu" className="py-1">
              {child.subChildren.map((sub, k) => (
                <li key={k} role="none">
                  <a
                    role="menuitem"
                    href={isEditing ? "#" : sub.url || "#"}
                    tabIndex={isEditing ? -1 : undefined}
                    onClick={(e) => {
                      if (isEditing) e.preventDefault();
                    }}
                    className="navbar-child-link block px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    style={
                      {
                        color: "#1e293b",
                        ["--nav-hover" as string]: hoverTextColor,
                      } as React.CSSProperties
                    }
                  >
                    {t(sub.label, locale)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <style>{`
        .navbar-child-link:hover {
          color: var(--nav-hover);
        }
      `}</style>
    </li>
  );
}

function NavbarClient({
  logoSrc,
  logoAlt,
  menuItems,
  bgColor,
  textColor,
  hoverLineColor,
  hoverTextColor,
  showSearch,
  searchPlaceholder,
  searchSuggestions,
  showLanguageSwitcher,
  isEditing,
}: {
  logoSrc: string;
  logoAlt: string;
  menuItems: NavbarMenuItem[];
  bgColor: string;
  textColor: string;
  hoverLineColor: string;
  hoverTextColor: string;
  showSearch: boolean;
  searchPlaceholder: LocalizedString;
  searchSuggestions: NavbarSuggestion[];
  showLanguageSwitcher: boolean;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [langOpen, setLangOpen] = useState(false);

  const swapLocale = (next: string) => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0 && LOCALES.includes(parts[0] as never))
      parts[0] = next;
    else parts.unshift(next);
    window.location.href = `/${parts.join("/")}${window.location.search}`;
  };

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
              loading="lazy"
            decoding="async"
            />
          ) : (
            <div className="h-10 w-10 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(menuItems || []).map((item: NavbarMenuItem, i: number) => (
            <NavbarMenuButton
              key={i}
              item={item}
              locale={locale}
              textColor={textColor}
              hoverLineColor={hoverLineColor}
              hoverTextColor={hoverTextColor}
              isEditing={isEditing}
            />
          ))}
          {showSearch && (
            <button
              type="button"
              onClick={() => !isEditing && setSearchOpen(true)}
              className="ml-2 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              style={{ color: textColor || "#1e293b" }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          {showLanguageSwitcher && (
            <div className="relative">
              <button
                type="button"
                onClick={() => !isEditing && setLangOpen((p) => !p)}
                className="ml-1 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{ color: textColor || "#1e293b" }}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                aria-label="Language"
              >
                <Globe className="w-5 h-5" />
              </button>
              {langOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setLangOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close language menu"
                  />
                  <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <ul role="menu">
                      {LOCALES.map((code) => {
                        const isActive = code === locale;
                        const itemClass = isActive
                          ? "w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-blue-50 text-blue-700 font-semibold"
                          : "w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50";
                        return (
                          <li key={code} role="none">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setLangOpen(false);
                                if (!isEditing && code !== locale)
                                  swapLocale(code);
                              }}
                              className={itemClass}
                            >
                              <span className="font-mono text-[10px] uppercase opacity-60 w-6 shrink-0">
                                {code}
                              </span>
                              <span>{LOCALE_LABELS[code] || code}</span>
                              {isActive && (
                                <Check className="w-4 h-4 ml-auto" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[9999] animate-[fadeIn_0.25s_ease]"
          style={{ backgroundColor: "#0c2340f2" }}
        >
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="flex flex-col items-center justify-start pt-[18vh] px-6 animate-[slideUp_0.35s_ease]">
            <p className="text-white/50 text-xs uppercase tracking-[0.25em] mb-6">
              Tìm kiếm
            </p>
            <div className="w-full max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(searchPlaceholder, locale) || "Nhập từ khóa..."}
                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white text-2xl md:text-3xl pb-4 outline-none placeholder:text-white/30 transition-colors"
              />
              <Search className="absolute right-0 top-1 w-8 h-8 text-white/50" />
            </div>
            {searchSuggestions?.length > 0 && (
              <div className="mt-10 w-full max-w-2xl">
                <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-4">
                  Gợi ý
                </p>
                <div className="flex flex-wrap gap-3">
                  {searchSuggestions.map((s: NavbarSuggestion, i: number) => (
                    <a
                      key={i}
                      href={s.url}
                      className="px-5 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all text-sm"
                    >
                      {t(s.label, locale)}
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
  menuItems: NavbarMenuItem[];
  bgColor: string;
  textColor: string;
  hoverLineColor: string;
  hoverTextColor: string;
  showSearch: boolean;
  searchPlaceholder: LocalizedString;
  searchSuggestions: NavbarSuggestion[];
  showLanguageSwitcher: boolean;
}> = {
  label: "Navbar",
  defaultProps: {
    logoSrc: "",
    logoAlt: "Logo",
    showLanguageSwitcher: true,
    menuItems: [
      {
        label: { vi: "Giới thiệu", en: "About" },
        url: "/gioi-thieu",
        children: [],
      },
      {
        label: { vi: "Đào tạo", en: "Programs" },
        url: "/dao-tao",
        children: [
          {
            label: { vi: "Đại học", en: "Undergraduate" },
            url: "/dao-tao/dai-hoc",
            subChildren: [],
          },
          {
            label: { vi: "Sau đại học", en: "Graduate" },
            url: "/dao-tao/sau-dai-hoc",
            subChildren: [],
          },
          {
            label: { vi: "Quy chế", en: "Regulations" },
            url: "/dao-tao/quy-che",
            subChildren: [],
          },
        ],
      },
      {
        label: { vi: "Nghiên cứu", en: "Research" },
        url: "/nghien-cuu",
        children: [],
      },
      {
        label: { vi: "Liên hệ", en: "Contact" },
        url: "/lien-he",
        children: [],
      },
    ],
    bgColor: "#ffffff",
    textColor: "#1e293b",
    hoverLineColor: "#2563eb",
    hoverTextColor: "#2563eb",
    showSearch: true,
    searchPlaceholder: { vi: "Nhập từ khóa...", en: "Enter keyword..." },
    searchSuggestions: [
      {
        label: { vi: "Tuyển sinh", en: "Admissions" },
        url: "/tuyen-sinh",
      },
      {
        label: { vi: "Chương trình đào tạo", en: "Programs" },
        url: "/dao-tao",
      },
      { label: { vi: "Nghiên cứu", en: "Research" }, url: "/nghien-cuu" },
      { label: { vi: "Liên hệ", en: "Contact" }, url: "/lien-he" },
    ],
  },
  fields: {
    logoSrc: mediaPickerField("Logo"),
    logoAlt: { type: "text", label: "Logo Alt" },
    menuItems: {
      type: "array",
      label: "Menu Items",
      arrayFields: {
        label: localizedTextField("Label"),
        url: { type: "text", label: "URL" },
        children: {
          type: "array",
          label: "Dropdown (level 2)",
          arrayFields: {
            label: localizedTextField("Label"),
            url: { type: "text", label: "URL" },
            subChildren: {
              type: "array",
              label: "Sub-dropdown (level 3)",
              arrayFields: {
                label: localizedTextField("Label"),
                url: { type: "text", label: "URL" },
              },
            },
          },
        },
      },
    },
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
    hoverLineColor: colorField("Hover Line Color"),
    hoverTextColor: colorField("Hover Text Color"),
    showSearch: {
      type: "radio",
      label: "Show Search",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    searchPlaceholder: localizedTextField("Search Placeholder"),
    searchSuggestions: {
      type: "array",
      label: "Search Suggestions",
      arrayFields: {
        label: localizedTextField("Label"),
        url: { type: "text", label: "URL" },
      },
    },
    showLanguageSwitcher: {
      type: "radio",
      label: "Show Language Switcher",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: ({
    logoSrc,
    logoAlt,
    menuItems,
    bgColor,
    textColor,
    hoverLineColor,
    hoverTextColor,
    showSearch,
    searchPlaceholder,
    searchSuggestions,
    showLanguageSwitcher,
    puck,
  }) => (
    <NavbarClient
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      menuItems={menuItems}
      bgColor={bgColor}
      textColor={textColor}
      hoverLineColor={hoverLineColor}
      hoverTextColor={hoverTextColor}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      searchSuggestions={searchSuggestions}
      showLanguageSwitcher={showLanguageSwitcher}
      isEditing={!!puck?.isEditing}
    />
  ),
};

export const NavLinks: ComponentConfig<{
  links: { label: LocalizedString; url: string }[];
  direction: string;
  showArrow: boolean;
  fontSize: string;
  color: string;
  hoverColor: string;
}> = {
  label: "Nav Links",
  defaultProps: {
    links: [
      { label: { vi: "Liên kết 1", en: "Link 1" }, url: "#" },
      { label: { vi: "Liên kết 2", en: "Link 2" }, url: "#" },
      { label: { vi: "Liên kết 3", en: "Link 3" }, url: "#" },
    ],
    direction: "vertical",
    showArrow: true,
    fontSize: "base",
    color: "#374151",
    hoverColor: "#2563eb",
  },
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        label: localizedTextField("Label"),
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
    color: colorField("Text Color"),
    hoverColor: colorField("Hover Text Color"),
  },
  render: ({
    links,
    direction,
    showArrow,
    fontSize,
    color,
    hoverColor,
    puck,
  }) => (
    <NavLinksRender
      links={links || []}
      direction={direction}
      showArrow={showArrow}
      fontSize={fontSize}
      color={color}
      hoverColor={hoverColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function NavLinksRender({
  links,
  direction,
  showArrow,
  fontSize,
  color,
  hoverColor,
  isEditing,
}: {
  links: { label: LocalizedString; url: string }[];
  direction: string;
  showArrow: boolean;
  fontSize: string;
  color: string;
  hoverColor: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const isVertical = direction !== "horizontal";
  const sizes: Record<string, string> = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };
  return (
    <div className={isVertical ? "space-y-1" : "flex flex-wrap gap-4"}>
      {links.map((link, i) => (
        <a
          key={i}
          href={isEditing ? "#" : link.url}
          tabIndex={isEditing ? -1 : undefined}
          className={`navlink-row flex items-center justify-between py-2 ${sizes[fontSize] || "text-base"} font-medium transition-colors`}
          style={
            {
              color: color || "#374151",
              ["--navlink-hover" as string]: hoverColor || "#2563eb",
            } as React.CSSProperties
          }
        >
          <span>{t(link.label, locale)}</span>
          {showArrow !== false && (
            <span className="text-slate-400 ml-2">&raquo;</span>
          )}
        </a>
      ))}
      <style>{`
        .navlink-row:hover {
          color: var(--navlink-hover);
        }
      `}</style>
    </div>
  );
}

export const QuickLinks: ComponentConfig<{
  links: {
    icon: string;
    label: LocalizedString;
    url: string;
    color: string;
  }[];
  columns: string;
}> = {
  label: "Quick Links",
  defaultProps: {
    links: [
      {
        icon: "language",
        label: { vi: "Cổng thông tin", en: "Portal" },
        url: "#",
        color: "#2563eb",
      },
      {
        icon: "local_library",
        label: { vi: "Thư viện", en: "Library" },
        url: "#",
        color: "#7c3aed",
      },
      {
        icon: "mail",
        label: { vi: "Email", en: "Email" },
        url: "#",
        color: "#dc2626",
      },
      {
        icon: "school",
        label: { vi: "E-Learning", en: "E-Learning" },
        url: "#",
        color: "#059669",
      },
      {
        icon: "event",
        label: { vi: "Lịch học", en: "Schedule" },
        url: "#",
        color: "#d97706",
      },
      {
        icon: "support_agent",
        label: { vi: "Hỗ trợ", en: "Support" },
        url: "#",
        color: "#0891b2",
      },
    ],
    columns: "6",
  },
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        icon: { type: "text", label: "Icon (Material Symbol)" },
        label: localizedTextField("Label"),
        url: { type: "text", label: "URL" },
        color: colorField("Color"),
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
  render: ({ links, columns, puck }) => (
    <QuickLinksRender
      links={links || []}
      columns={columns}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function QuickLinksRender({
  links,
  columns,
  isEditing,
}: {
  links: {
    icon: string;
    label: LocalizedString;
    url: string;
    color: string;
  }[];
  columns: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const cols = parseInt(columns, 10) || 6;
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {links.map((link, i) => (
        <a
          key={i}
          href={isEditing ? "#" : link.url || "#"}
          tabIndex={isEditing ? -1 : undefined}
          className="flex flex-col items-center gap-2 py-4 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: link.color || "#3b82f6" }}
          >
            <DynamicIcon name={link.icon || "link"} className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-600 text-center">
            {t(link.label, locale)}
          </span>
        </a>
      ))}
    </div>
  );
}

export const SocialIcons: ComponentConfig<{
  icons: { icon: string; url: string; color: string }[];
  size: string;
  gap: string;
  alignment: string;
  variant: string;
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
    variant: "filled",
  },
  fields: {
    icons: {
      type: "array",
      label: "Icons",
      arrayFields: {
        icon: { type: "text", label: "Icon (Material Symbol)" },
        url: { type: "text", label: "URL" },
        color: colorField("Color"),
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
    variant: {
      type: "select",
      label: "Variant",
      options: [
        { label: "Filled (color bg)", value: "filled" },
        { label: "Flat (icon only)", value: "flat" },
      ],
    },
  },
  render: ({ icons, size, gap, alignment, variant, puck }) => {
    const sizes: Record<string, { btn: string; icon: string; px: number }> = {
      sm: { btn: "w-8 h-8", icon: "text-base", px: 20 },
      md: { btn: "w-11 h-11", icon: "text-xl", px: 24 },
      lg: { btn: "w-12 h-12", icon: "text-2xl", px: 28 },
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
    const isFlat = variant === "flat";

    const renderIcon = (icon: string, fillColor: string) => {
      const svgProps = {
        "aria-hidden": true as const,
        viewBox: "0 0 30 30",
        fill: fillColor,
        width: s.px,
        height: s.px,
      };
      if (icon === "facebook") {
        return (
          <svg {...svgProps} role="img" aria-label="Facebook">
            <title>Facebook</title>
            <path d="M25.81.5H3.689A3.7 3.7 0 0 0 0 4.183v22.125a3.7 3.7 0 0 0 3.688 3.688h11.187V19.42h-3.531v-4.608h3.531v-2.31c0-3.56 2.629-6.346 5.982-6.346h3.257v5.203H21.2c-.762 0-.99.435-.99 1.04v2.413h3.903v4.608h-3.902v10.575h5.599a3.7 3.7 0 0 0 3.687-3.688V4.183A3.699 3.699 0 0 0 25.81.5" />
          </svg>
        );
      }
      if (icon === "youtube") {
        return (
          <svg
            {...svgProps}
            viewBox="0 0 24 24"
            role="img"
            aria-label="YouTube"
          >
            <title>YouTube</title>
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      }
      if (icon === "twitter") {
        return (
          <svg
            {...svgProps}
            viewBox="0 0 24 24"
            role="img"
            aria-label="Twitter"
          >
            <title>Twitter</title>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      }
      return (
        <DynamicIcon
          name={icon || "link"}
          style={{ width: s.px, height: s.px, color: fillColor }}
        />
      );
    };

    return (
      <div
        className={`flex items-center ${gaps[gap] || "gap-3"} ${aligns[alignment] || "justify-start"}`}
      >
        {(icons || []).map(
          (item: { icon: string; url: string; color: string }, i: number) =>
            isFlat ? (
              <a
                key={i}
                href={puck?.isEditing ? "#" : item.url || "#"}
                tabIndex={puck?.isEditing ? -1 : undefined}
                className="hover:opacity-70 transition-opacity"
              >
                {renderIcon(item.icon, item.color || "#ffffff")}
              </a>
            ) : (
              <a
                key={i}
                href={puck?.isEditing ? "#" : item.url || "#"}
                tabIndex={puck?.isEditing ? -1 : undefined}
                className={`${s.btn} rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
                style={{ backgroundColor: item.color || "#3b82f6" }}
              >
                {renderIcon(item.icon, "#ffffff")}
              </a>
            ),
        )}
      </div>
    );
  },
};

export const LanguageSwitcher: ComponentConfig<{
  variant: string;
  textColor: string;
}> = {
  label: "Language Switcher",
  defaultProps: {
    variant: "globe",
    textColor: "#0c2340",
  },
  fields: {
    variant: {
      type: "select",
      label: "Variant",
      options: [
        { label: "Globe + label", value: "globe" },
        { label: "Compact code", value: "compact" },
      ],
    },
    textColor: colorField("Text Color"),
  },
  render: ({ variant, textColor, puck }) => (
    <LanguageSwitcherClient
      variant={variant}
      textColor={textColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function LanguageSwitcherClient({
  variant,
  textColor,
  isEditing,
}: {
  variant: string;
  textColor: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  const swapLocale = (next: string) => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0) parts[0] = next;
    else parts.push(next);
    const search = window.location.search;
    window.location.href = `/${parts.join("/")}${search}`;
  };

  const localeLabel =
    variant === "compact"
      ? locale.toUpperCase()
      : LOCALE_LABELS[locale] || locale.toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !isEditing && setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors"
        style={{ color: textColor || "#0c2340" }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="w-[18px] h-[18px]" />
        {variant !== "compact" && <span>{localeLabel}</span>}
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 opacity-60" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
          />
          <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
            <ul role="menu">
              {LOCALE_OPTIONS.map((opt) => (
                <li key={opt.code} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      if (opt.code !== locale) swapLocale(opt.code);
                    }}
                    className={
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors " +
                      (opt.code === locale
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50")
                    }
                  >
                    <span className="font-mono text-[10px] uppercase opacity-60 w-6 shrink-0">
                      {opt.code}
                    </span>
                    <span>{opt.label}</span>
                    {opt.code === locale && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

const LOCALE_OPTIONS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];
