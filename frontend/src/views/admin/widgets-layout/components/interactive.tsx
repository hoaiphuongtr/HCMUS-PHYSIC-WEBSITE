"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { subscriptionApi, visitorApi } from "@/lib/api";
import {
  getOrCreateVisitorId,
  getSubscriberEmail,
  setSubscriberEmail,
} from "@/lib/visitor";

const BUTTON_FONT_CLASS: Record<string, string> = {
  default: "",
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  heading: "font-heading",
  "heading-italic": "font-heading italic",
};

export const ButtonBlock: ComponentConfig<{
  label: string;
  url: string;
  variant: string;
  size: string;
  alignment: string;
  fullWidth: boolean;
  labelFont: string;
  labelColor: string;
  labelClassName: string;
}> = {
  label: "Button",
  defaultProps: {
    label: "Click me",
    url: "#",
    variant: "primary",
    size: "md",
    alignment: "left",
    fullWidth: false,
    labelFont: "default",
    labelColor: "",
    labelClassName: "",
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
    labelFont: {
      type: "select",
      label: "Label Font",
      options: [
        { label: "Default", value: "default" },
        { label: "Sans", value: "sans" },
        { label: "Serif", value: "serif" },
        { label: "Mono", value: "mono" },
        { label: "Heading", value: "heading" },
        { label: "Heading italic", value: "heading-italic" },
      ],
    },
    labelColor: { type: "text", label: "Label Color (override)" },
    labelClassName: { type: "text", label: "Label class (advanced)" },
  },
  render: ({
    label,
    url,
    variant,
    size,
    alignment,
    fullWidth,
    labelFont,
    labelColor,
    labelClassName,
    puck,
    ...rest
  }: any) => {
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
      xl: "px-10 py-4 text-xl",
    };
    const aligns: Record<string, string> = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };
    const style: Record<string, string> = labelColor
      ? { color: labelColor }
      : {};
    return (
      <div className={`flex ${aligns[alignment] || "justify-start"}`}>
        <a
          href={puck?.isEditing ? "#" : url}
          tabIndex={puck?.isEditing ? -1 : undefined}
          className={`inline-block rounded-md font-medium transition-colors ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${BUTTON_FONT_CLASS[labelFont] || ""} ${labelClassName || ""} ${fullWidth ? "w-full text-center" : ""}`}
          style={{ ...style, ...(rest.labelStyle || {}) }}
        >
          {label || "Button"}
        </a>
      </div>
    );
  },
};

export const Banner: ComponentConfig<{
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
  }) => (
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
  ),
};

export const AnnouncementBar: ComponentConfig<{
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

type SearchLink = { label: string; url: string };
type RecentItem = { label: string; url: string; ts: number };

function readRecent(key: string): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) => x && typeof x.url === "string" && typeof x.label === "string",
      )
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function pushRecent(key: string, item: Omit<RecentItem, "ts">) {
  if (typeof window === "undefined") return;
  const current = readRecent(key).filter((x) => x.url !== item.url);
  const next = [{ ...item, ts: Date.now() }, ...current].slice(0, 8);
  window.localStorage.setItem(key, JSON.stringify(next));
}

export const SearchOverlay: ComponentConfig<{
  placeholder: string;
  bgColor: string;
  suggestedLinks: SearchLink[];
  hotLinks: SearchLink[];
  showRecent: boolean;
  recentStorageKey: string;
  autoPersonalize: boolean;
}> = {
  label: "Search Overlay",
  defaultProps: {
    placeholder: "Tìm kiếm...",
    bgColor: "#0c2340",
    suggestedLinks: [
      { label: "Tuyển sinh", url: "/tuyen-sinh" },
      { label: "Chương trình đào tạo", url: "/dao-tao" },
      { label: "Nghiên cứu", url: "/nghien-cuu" },
      { label: "Liên hệ", url: "/lien-he" },
    ],
    hotLinks: [
      { label: "Học bổng 2026", url: "/hoc-bong" },
      { label: "Bán dẫn", url: "/ban-dan" },
    ],
    showRecent: true,
    recentStorageKey: "search.recent",
    autoPersonalize: false,
  },
  fields: {
    placeholder: { type: "text", label: "Placeholder" },
    bgColor: { type: "text", label: "Background Color" },
    suggestedLinks: {
      type: "array",
      label: "Suggested Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
      },
    },
    hotLinks: {
      type: "array",
      label: "Hot Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL" },
      },
    },
    showRecent: {
      type: "radio",
      label: "Show recent searches",
      options: [
        { label: "On", value: true },
        { label: "Off", value: false },
      ],
    },
    recentStorageKey: { type: "text", label: "Recent storage key" },
    autoPersonalize: {
      type: "radio",
      label: "Auto-personalize (based on visitor behavior)",
      options: [
        { label: "On", value: true },
        { label: "Off", value: false },
      ],
    },
  },
  render: ({
    placeholder,
    bgColor,
    suggestedLinks,
    hotLinks,
    showRecent,
    recentStorageKey,
    autoPersonalize,
    puck,
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [recent, setRecent] = useState<RecentItem[]>([]);
    const [personalSuggested, setPersonalSuggested] = useState<SearchLink[]>(
      [],
    );
    const [personalHot, setPersonalHot] = useState<SearchLink[]>([]);

    useEffect(() => {
      if (open && showRecent) {
        setRecent(readRecent(recentStorageKey || "search.recent"));
      }
    }, [open, showRecent, recentStorageKey]);

    useEffect(() => {
      if (!open || !autoPersonalize || puck?.isEditing) return;
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;
      visitorApi
        .getSuggestions(visitorId, 6)
        .then((res) => {
          if (res.suggestedLinks?.length)
            setPersonalSuggested(res.suggestedLinks);
          if (res.hotTags?.length) {
            setPersonalHot(
              res.hotTags.map((t) => ({
                label: t.label,
                url: `/${t.slug}`,
              })),
            );
          }
        })
        .catch(() => {});
    }, [open, autoPersonalize, puck?.isEditing]);

    const effectiveSuggested =
      autoPersonalize && personalSuggested.length > 0
        ? personalSuggested
        : suggestedLinks;
    const effectiveHot =
      autoPersonalize && personalHot.length > 0 ? personalHot : hotLinks;

    const submitQuery = () => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const url = `/search?q=${encodeURIComponent(trimmed)}`;
      pushRecent(recentStorageKey || "search.recent", { label: trimmed, url });
      window.location.href = url;
    };

    const clearRecent = () => {
      window.localStorage.removeItem(recentStorageKey || "search.recent");
      setRecent([]);
    };

    return (
      <>
        <button
          type="button"
          onClick={() => !puck?.isEditing && setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition-all text-sm backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          <span className="hidden sm:inline">{placeholder}</span>
        </button>
        {open && (
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-[12vh] overflow-y-auto animate-[fadeIn_0.3s_ease]"
            style={{ backgroundColor: bgColor || "#0c2340" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <div className="w-full max-w-2xl px-6 pb-16 animate-[slideUp_0.4s_ease]">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitQuery();
                  }}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-b-2 border-white/40 focus:border-white text-white text-2xl md:text-3xl pb-4 outline-none placeholder:text-white/40 transition-colors"
                />
                <span className="material-symbols-outlined absolute right-0 top-1 text-white/60 text-3xl">
                  search
                </span>
              </div>

              {effectiveHot && effectiveHot.length > 0 && (
                <div className="mt-8">
                  <p className="text-orange-300/80 text-xs uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      local_fire_department
                    </span>
                    Xu hướng
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {effectiveHot.map((link, i) => (
                      <a
                        key={`hot-${i}`}
                        href={link.url}
                        className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-400/40 text-white hover:bg-orange-500/30 transition-all text-sm"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {effectiveSuggested && effectiveSuggested.length > 0 && (
                <div className="mt-8">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
                    {autoPersonalize && personalSuggested.length > 0
                      ? "Dành cho bạn"
                      : "Gợi ý tìm kiếm"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {effectiveSuggested.map((link, i) => (
                      <a
                        key={`sug-${i}`}
                        href={link.url}
                        className="px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/60 transition-all text-sm"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {showRecent && recent.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-xs uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        history
                      </span>
                      Gần đây
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-white/50 hover:text-white text-xs underline"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {recent.map((item, i) => (
                      <a
                        key={`rec-${i}`}
                        href={item.url}
                        className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          schedule
                        </span>
                        {item.label}
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
  },
};

export const PersonaSelector: ComponentConfig<{
  personas: {
    label: string;
    icon: string;
    description: string;
    linkUrl: string;
  }[];
  bgColor: string;
}> = {
  label: "Persona Selector",
  defaultProps: {
    personas: [
      {
        label: "Sinh viên",
        icon: "school",
        description: "Thông tin học vụ, lịch thi, biểu mẫu",
        linkUrl: "/sinh-vien",
      },
      {
        label: "Giảng viên",
        icon: "person",
        description: "Nghiên cứu, giảng dạy, quản lý",
        linkUrl: "/giang-vien",
      },
      {
        label: "Tuyển sinh",
        icon: "campaign",
        description: "Chương trình, xét tuyển, học bổng",
        linkUrl: "/tuyen-sinh",
      },
      {
        label: "Cựu sinh viên",
        icon: "groups",
        description: "Kết nối, sự kiện, đóng góp",
        linkUrl: "/cuu-sinh-vien",
      },
    ],
    bgColor: "#ffffff",
  },
  fields: {
    personas: {
      type: "array",
      label: "Personas",
      arrayFields: {
        label: { type: "text", label: "Label" },
        icon: { type: "text", label: "Material Icon" },
        description: { type: "text", label: "Description" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    bgColor: { type: "text", label: "Background Color" },
  },
  render: ({ personas, bgColor, puck }) => (
    <div
      className="py-16 px-6"
      style={{ backgroundColor: bgColor || "#ffffff" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(personas || []).map(
            (
              p: {
                label: string;
                icon: string;
                description: string;
                linkUrl: string;
              },
              i: number,
            ) => (
              <a
                key={i}
                href={puck?.isEditing ? "#" : p.linkUrl || "#"}
                tabIndex={puck?.isEditing ? -1 : undefined}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                  <span className="material-symbols-outlined text-2xl text-blue-700">
                    {p.icon}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{p.label}</h3>
                <p className="text-xs text-slate-500">{p.description}</p>
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  ),
};

type ChatMessage = { role: "user" | "assistant"; content: string };

function ChatButtonClient({
  tooltipText,
  bgColor,
  iconColor,
  title,
  subtitle,
  welcomeMessage,
  placeholder,
  isEditing,
}: {
  tooltipText: string;
  bgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  placeholder: string;
  isEditing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Cảm ơn câu hỏi của bạn! Tính năng Q&A với AI đang được phát triển. Trong thời gian chờ, vui lòng liên hệ văn phòng Khoa qua email phys@hcmus.edu.vn hoặc số điện thoại +84 28 38355272.",
        },
      ]);
      setIsThinking(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9998] group">
        <button
          type="button"
          onClick={() => {
            if (isEditing) return;
            setOpen((p) => !p);
          }}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-200 hover:shadow-xl"
          style={{ backgroundColor: bgColor || "#1d4ed8" }}
          aria-label={tooltipText || "Hỏi đáp với AI"}
        >
          <svg
            aria-hidden="true"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor || "#ffffff"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 13.5H16M8 9.5H12" />
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" />
          </svg>
        </button>
        {!open && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
            {tooltipText || "Hỏi đáp"}
            <div className="absolute top-full right-5 -mt-1 w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        )}
      </div>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9998] w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          role="dialog"
          aria-label="Chat hỏi đáp với AI"
        >
          <div
            className="px-4 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: bgColor || "#1d4ed8" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
                  <path d="M20 12v1a8 8 0 0 1-16 0v-1" />
                  <path d="M12 21v-3" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {title || "Trợ lý AI"}
                </div>
                <div className="text-[11px] text-white/80 truncate">
                  {subtitle || "Hỏi đáp về Khoa Vật lý"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center shrink-0"
              aria-label="Đóng"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => {
              const bubbleClass =
                msg.role === "user"
                  ? "ml-auto bg-blue-600 text-white rounded-2xl rounded-br-sm"
                  : "mr-auto bg-white text-slate-800 rounded-2xl rounded-bl-sm border border-slate-200";
              return (
                <div
                  key={i}
                  className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${bubbleClass}`}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: bgColor || "#1d4ed8" }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              );
            })}
            {isThinking && (
              <div className="mr-auto bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Nhập câu hỏi của bạn..."}
                disabled={isThinking}
                className="flex-1 px-3 py-2 text-sm rounded-full border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                style={{ backgroundColor: bgColor || "#1d4ed8" }}
                aria-label="Gửi"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Đang phát triển · Trả lời tự động
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export const ChatButton: ComponentConfig<{
  tooltipText: string;
  bgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  placeholder: string;
}> = {
  label: "AI Chat Button",
  defaultProps: {
    tooltipText: "Hỏi đáp với AI",
    bgColor: "#1d4ed8",
    iconColor: "#ffffff",
    title: "Trợ lý AI",
    subtitle: "Hỏi đáp về Khoa Vật lý",
    welcomeMessage:
      "Xin chào! Tôi là trợ lý ảo của Khoa Vật lý - Vật lý Kỹ thuật. Bạn cần hỗ trợ thông tin gì?",
    placeholder: "Nhập câu hỏi của bạn...",
  },
  fields: {
    tooltipText: { type: "text", label: "Tooltip Text" },
    bgColor: { type: "text", label: "Background Color" },
    iconColor: { type: "text", label: "Icon Color" },
    title: { type: "text", label: "Panel Title" },
    subtitle: { type: "text", label: "Panel Subtitle" },
    welcomeMessage: { type: "textarea", label: "Welcome Message" },
    placeholder: { type: "text", label: "Input Placeholder" },
  },
  render: ({
    tooltipText,
    bgColor,
    iconColor,
    title,
    subtitle,
    welcomeMessage,
    placeholder,
    puck,
  }) => (
    <ChatButtonClient
      tooltipText={tooltipText}
      bgColor={bgColor}
      iconColor={iconColor}
      title={title}
      subtitle={subtitle}
      welcomeMessage={welcomeMessage}
      placeholder={placeholder}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function SubscribeBannerClient({
  title,
  subtitle,
  bgColor,
  textColor,
  tagOptions,
  successMessage,
  isEditing,
}: {
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  tagOptions: { label: string; value: string }[];
  successMessage: string;
  isEditing: boolean;
}) {
  const [email, setEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) return;
    setAlreadySubscribed(!!getSubscriberEmail());
  }, [isEditing]);

  const toggleTag = (value: string) => {
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const submit = async () => {
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const visitorId = getOrCreateVisitorId();
      await subscriptionApi.create({
        email: email.trim(),
        tagSlugs: selectedTags,
        visitorId,
      });
      setSubscriberEmail(email.trim());
      setStatus("done");
      setAlreadySubscribed(true);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại";
      setError(msg);
    }
  };

  return (
    <section
      id="subscribe"
      className="rounded-xl px-6 py-10 md:px-12 md:py-14 grid md:grid-cols-2 gap-8 items-center"
      style={{
        backgroundColor: bgColor || "#0c2340",
        color: textColor || "#ffffff",
      }}
    >
      <div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
        <p className="text-sm md:text-base opacity-80">{subtitle}</p>
      </div>
      {alreadySubscribed && !isEditing ? (
        <div
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-6 text-center"
          style={{ color: textColor || "#ffffff" }}
        >
          <p className="text-sm font-medium">
            {successMessage || "Cảm ơn bạn đã đăng ký!"}
          </p>
          <p className="text-xs mt-1 opacity-70">
            Bạn đã nằm trong danh sách nhận thông báo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            disabled={isEditing || status === "saving"}
            className="w-full px-4 py-3 rounded-md text-slate-900 bg-white/95 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400"
          />
          {tagOptions && tagOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((opt) => {
                const active = selectedTags.includes(opt.value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => !isEditing && toggleTag(opt.value)}
                    className={
                      active
                        ? "px-3 py-1.5 rounded-full text-xs bg-white text-slate-900 border border-white"
                        : "px-3 py-1.5 rounded-full text-xs bg-white/10 border border-white/30 hover:bg-white/20"
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => !isEditing && submit()}
            disabled={isEditing || status === "saving"}
            className="w-full md:w-auto px-6 py-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Đăng ký"}
          </button>
          {error && <p className="text-xs text-red-200">{error}</p>}
        </div>
      )}
    </section>
  );
}

export const SubscribeBanner: ComponentConfig<{
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  tagOptions: { label: string; value: string }[];
  successMessage: string;
}> = {
  label: "Subscribe Banner",
  defaultProps: {
    title: "Nhận thông báo qua email",
    subtitle:
      "Học bổng, tuyển sinh, sự kiện... được gửi tới bạn khi có thông tin mới.",
    bgColor: "#0c2340",
    textColor: "#ffffff",
    tagOptions: [
      { label: "Học bổng", value: "hoc-bong" },
      { label: "Tuyển sinh", value: "tuyen-sinh" },
      { label: "Bán dẫn", value: "ban-dan" },
      { label: "Nghiên cứu", value: "nghien-cuu" },
    ],
    successMessage: "Cảm ơn bạn đã đăng ký!",
  },
  fields: {
    title: { type: "text", label: "Title" },
    subtitle: { type: "textarea", label: "Subtitle" },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
    tagOptions: {
      type: "array",
      label: "Tag Options",
      arrayFields: {
        label: { type: "text", label: "Label" },
        value: { type: "text", label: "Value (tag slug)" },
      },
    },
    successMessage: { type: "text", label: "Success Message" },
  },
  render: ({
    title,
    subtitle,
    bgColor,
    textColor,
    tagOptions,
    successMessage,
    puck,
  }) => (
    <SubscribeBannerClient
      title={title}
      subtitle={subtitle}
      bgColor={bgColor}
      textColor={textColor}
      tagOptions={tagOptions}
      successMessage={successMessage}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function TagNotificationBarClient({
  tagSlug,
  message,
  linkLabel,
  linkUrl,
  bgColor,
  textColor,
  minWeight,
  dismissible,
  isEditing,
}: {
  tagSlug: string;
  message: string;
  linkLabel: string;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  minWeight: number;
  dismissible: boolean;
  isEditing: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setShouldShow(true);
      setReady(true);
      return;
    }
    const visitorId = getOrCreateVisitorId();
    if (!visitorId || !tagSlug) {
      setReady(true);
      return;
    }
    const dismissKey = `dismissed:${tagSlug}`;
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(dismissKey)
    ) {
      setReady(true);
      return;
    }
    visitorApi
      .getProfile(visitorId)
      .then((profile) => {
        const weight = profile.tagWeights?.[tagSlug] || 0;
        const alreadySubscribed = profile.subscribedTagSlugs?.includes(tagSlug);
        setShouldShow(weight >= minWeight && !alreadySubscribed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [tagSlug, minWeight, isEditing]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`dismissed:${tagSlug}`, "1");
    }
    setDismissed(true);
  };

  if (!ready || !shouldShow || dismissed) return null;

  return (
    <div
      className="px-4 py-2.5 flex items-center gap-3"
      style={{
        backgroundColor: bgColor || "#0c2340",
        color: textColor || "#ffffff",
      }}
    >
      <span className="material-symbols-outlined text-lg shrink-0">
        notifications_active
      </span>
      <span className="text-sm font-medium flex-1">{message}</span>
      {linkLabel && (
        <a
          href={isEditing ? "#" : linkUrl || "#"}
          tabIndex={isEditing ? -1 : undefined}
          className="px-3 py-1 text-xs font-semibold rounded-md bg-white/15 hover:bg-white/25"
        >
          {linkLabel}
        </a>
      )}
      {dismissible && !isEditing && (
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

export const TagNotificationBar: ComponentConfig<{
  tagSlug: string;
  message: string;
  linkLabel: string;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  minWeight: number;
  dismissible: boolean;
}> = {
  label: "Tag Notification Bar",
  defaultProps: {
    tagSlug: "hoc-bong",
    message: "Bạn quan tâm học bổng? Đăng ký để không bỏ lỡ tin mới.",
    linkLabel: "Đăng ký",
    linkUrl: "#subscribe",
    bgColor: "#0c2340",
    textColor: "#ffffff",
    minWeight: 3,
    dismissible: true,
  },
  fields: {
    tagSlug: { type: "text", label: "Tag slug" },
    message: { type: "text", label: "Message" },
    linkLabel: { type: "text", label: "Link label" },
    linkUrl: { type: "text", label: "Link URL" },
    bgColor: { type: "text", label: "Background Color" },
    textColor: { type: "text", label: "Text Color" },
    minWeight: { type: "number", label: "Min visitor weight" },
    dismissible: {
      type: "radio",
      label: "Dismissible",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: ({
    tagSlug,
    message,
    linkLabel,
    linkUrl,
    bgColor,
    textColor,
    minWeight,
    dismissible,
    puck,
  }) => (
    <TagNotificationBarClient
      tagSlug={tagSlug}
      message={message}
      linkLabel={linkLabel}
      linkUrl={linkUrl}
      bgColor={bgColor}
      textColor={textColor}
      minWeight={minWeight}
      dismissible={dismissible}
      isEditing={!!puck?.isEditing}
    />
  ),
};
