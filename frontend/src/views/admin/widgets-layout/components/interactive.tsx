"use client";

import { useState } from "react";
import type { ComponentConfig } from "@puckeditor/core";

export const ButtonBlock: ComponentConfig<{
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
      outline: "border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50",
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
  render: ({ text, subtext, bgColor, textColor, alignment, buttonLabel, buttonUrl, puck }) => (
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
      style={{ backgroundColor: bgColor || "#dc2626", color: textColor || "#ffffff" }}
    >
      {icon && <span className="material-symbols-outlined text-lg shrink-0">{icon}</span>}
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

export const SearchOverlay: ComponentConfig<{
  placeholder: string;
  bgColor: string;
  suggestedLinks: { label: string; url: string }[];
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
  },
  render: ({ placeholder, bgColor, suggestedLinks, puck }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    return (
      <>
        <button
          onClick={() => !puck?.isEditing && setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition-all text-sm backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          <span className="hidden sm:inline">{placeholder}</span>
        </button>
        {open && (
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-[15vh] animate-[fadeIn_0.3s_ease]"
            style={{ backgroundColor: bgColor || "#0c2340" }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <div className="w-full max-w-2xl px-6 animate-[slideUp_0.4s_ease]">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-white/40 focus:border-white text-white text-2xl md:text-3xl pb-4 outline-none placeholder:text-white/40 transition-colors"
                />
                <span className="material-symbols-outlined absolute right-0 top-1 text-white/60 text-3xl">search</span>
              </div>
              {suggestedLinks?.length > 0 && (
                <div className="mt-8">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Gợi ý tìm kiếm</p>
                  <div className="flex flex-wrap gap-3">
                    {suggestedLinks.map((link: { label: string; url: string }, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        className="px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/60 transition-all text-sm"
                      >
                        {link.label}
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
  personas: { label: string; icon: string; description: string; linkUrl: string }[];
  bgColor: string;
}> = {
  label: "Persona Selector",
  defaultProps: {
    personas: [
      { label: "Sinh viên", icon: "school", description: "Thông tin học vụ, lịch thi, biểu mẫu", linkUrl: "/sinh-vien" },
      { label: "Giảng viên", icon: "person", description: "Nghiên cứu, giảng dạy, quản lý", linkUrl: "/giang-vien" },
      { label: "Tuyển sinh", icon: "campaign", description: "Chương trình, xét tuyển, học bổng", linkUrl: "/tuyen-sinh" },
      { label: "Cựu sinh viên", icon: "groups", description: "Kết nối, sự kiện, đóng góp", linkUrl: "/cuu-sinh-vien" },
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
    <div className="py-16 px-6" style={{ backgroundColor: bgColor || "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(personas || []).map((p: { label: string; icon: string; description: string; linkUrl: string }, i: number) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : p.linkUrl || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-2xl text-blue-700">{p.icon}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{p.label}</h3>
              <p className="text-xs text-slate-500">{p.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ChatButton: ComponentConfig<{
  tooltipText: string;
  bgColor: string;
  iconColor: string;
  url: string;
}> = {
  label: "Chat Button",
  defaultProps: {
    tooltipText: "Hỏi đáp",
    bgColor: "#1d4ed8",
    iconColor: "#ffffff",
    url: "/lien-he",
  },
  fields: {
    tooltipText: { type: "text", label: "Tooltip Text" },
    bgColor: { type: "text", label: "Background Color" },
    iconColor: { type: "text", label: "Icon Color" },
    url: { type: "text", label: "Link URL" },
  },
  render: ({ tooltipText, bgColor, iconColor, url, puck }) => (
    <div className="fixed bottom-6 right-6 z-[9998] group">
      <a
        href={puck?.isEditing ? "#" : url || "#"}
        tabIndex={puck?.isEditing ? -1 : undefined}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-200 hover:shadow-xl"
        style={{ backgroundColor: bgColor || "#1d4ed8" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={iconColor || "#ffffff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13.5H16M8 9.5H12" />
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" />
        </svg>
      </a>
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
        {tooltipText || "Hỏi đáp"}
        <div className="absolute top-full right-5 -mt-1 w-2 h-2 bg-slate-800 rotate-45" />
      </div>
    </div>
  ),
};
