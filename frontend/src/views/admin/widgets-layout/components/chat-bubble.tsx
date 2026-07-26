"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { DynamicIcon } from "@/components/admin/icons";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import { localizedSummary } from "../fields/item-summary";
import { localizedTextField } from "../fields/localized-text-field";

type ChatChannel = {
  icon: string;
  label: LocalizedString;
  url: string;
  color: string;
};

function ChatBubbleRender({
  greeting,
  buttonColor,
  side,
  channels,
  isEditing,
}: {
  greeting: LocalizedString;
  buttonColor: string;
  side: string;
  channels: ChatChannel[];
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const list = channels || [];
  const greet = t(greeting, locale);
  const sideClass = side === "left" ? "left-5" : "right-5";
  const originClass = side === "left" ? "items-start" : "items-end";
  const accent = buttonColor || "#2563eb";

  return (
    <div
      className={`fixed bottom-5 ${sideClass} z-[9998] flex flex-col ${originClass} gap-3`}
    >
      {/* Channels — revealed when open */}
      {open && list.length > 0 ? (
        <ul
          className={`flex flex-col ${originClass} gap-3 animate-[fadeIn_0.2s_ease]`}
        >
          {list.map((c, i) => (
            <li key={i}>
              <a
                href={isEditing ? "#" : c.url || "#"}
                target={isEditing ? undefined : "_blank"}
                rel="noopener noreferrer"
                tabIndex={isEditing ? -1 : undefined}
                onClick={(e) => {
                  if (isEditing) e.preventDefault();
                }}
                className={`group flex items-center gap-2 ${
                  side === "left" ? "flex-row" : "flex-row-reverse"
                }`}
                title={t(c.label, locale)}
              >
                <span
                  className="whitespace-nowrap rounded-full bg-white dark:bg-[#1a2436] px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-md border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {t(c.label, locale)}
                </span>
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                  style={{ backgroundColor: c.color || accent }}
                >
                  <DynamicIcon name={c.icon || "chat"} className="w-6 h-6" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Greeting tooltip */}
      {!open && greet ? (
        <span className="mb-1 max-w-[220px] rounded-2xl bg-white dark:bg-[#1a2436] px-4 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-lg border border-slate-100 dark:border-slate-800">
          {greet}
        </span>
      ) : null}

      {/* Main toggle button */}
      <button
        type="button"
        onClick={() => !isEditing && setOpen((p) => !p)}
        aria-label={open ? "Đóng" : "Liên hệ"}
        aria-expanded={open}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-black/10"
        style={{ backgroundColor: accent }}
      >
        <span className="relative w-7 h-7 block">
          <MessageCircle
            className={`absolute inset-0 w-7 h-7 transition-all duration-300 ${
              open ? "opacity-0 rotate-90 scale-50" : "opacity-100"
            }`}
          />
          <X
            className={`absolute inset-0 w-7 h-7 transition-all duration-300 ${
              open ? "opacity-100" : "opacity-0 -rotate-90 scale-50"
            }`}
          />
        </span>
        {!open && list.length > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        ) : null}
      </button>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export const ChatBubble: ComponentConfig<{
  greeting: LocalizedString;
  buttonColor: string;
  side: string;
  channels: ChatChannel[];
}> = {
  label: "Chat Bubble",
  defaultProps: {
    greeting: { vi: "Chào bạn! Cần hỗ trợ gì không?", en: "Hi! How can we help?" },
    buttonColor: "#2563eb",
    side: "right",
    channels: [
      {
        icon: "chat",
        label: { vi: "Nhắn tin Facebook", en: "Facebook Messenger" },
        url: "https://m.me/",
        color: "#0084ff",
      },
      {
        icon: "call",
        label: { vi: "Gọi điện", en: "Call us" },
        url: "tel:+842838355272",
        color: "#22c55e",
      },
      {
        icon: "mail",
        label: { vi: "Email", en: "Email" },
        url: "mailto:phys@hcmus.edu.vn",
        color: "#ef4444",
      },
    ],
  },
  fields: {
    greeting: localizedTextField("Greeting"),
    buttonColor: colorField("Button color"),
    side: {
      type: "select",
      label: "Position",
      options: [
        { label: "Bottom right", value: "right" },
        { label: "Bottom left", value: "left" },
      ],
    },
    channels: {
      type: "array",
      label: "Channels",
      getItemSummary: (item, i) =>
        localizedSummary(item.label, item.url || `Kênh ${(i ?? 0) + 1}`),
      arrayFields: {
        icon: { type: "text", label: "Icon (Material Symbol name)" },
        label: localizedTextField("Label"),
        url: { type: "text", label: "URL (https / tel: / mailto:)" },
        color: colorField("Color"),
      },
    },
  },
  render: ({ greeting, buttonColor, side, channels, puck }) => (
    <ChatBubbleRender
      greeting={greeting}
      buttonColor={buttonColor}
      side={side}
      channels={channels || []}
      isEditing={!!puck?.isEditing}
    />
  ),
};
