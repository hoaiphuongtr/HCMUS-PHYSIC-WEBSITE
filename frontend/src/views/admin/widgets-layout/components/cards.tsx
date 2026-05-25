"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";

export const NewsOverlayCard: ComponentConfig<{
  imageUrl: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  date: LocalizedString;
  linkUrl: string;
  size: string;
}> = {
  label: "News Overlay Card",
  defaultProps: {
    imageUrl: "",
    title: { vi: "Tiêu đề bài viết", en: "Article title" },
    excerpt: { vi: "", en: "" },
    date: { vi: "", en: "" },
    linkUrl: "#",
    size: "md",
  },
  fields: {
    imageUrl: mediaPickerField("Image"),
    title: localizedTextField("Title"),
    excerpt: localizedTextareaField("Excerpt"),
    date: localizedTextField("Date"),
    linkUrl: { type: "text", label: "Link URL" },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  render: ({ imageUrl, title, excerpt, date, linkUrl, size, puck }) => (
    <NewsOverlayCardRender
      imageUrl={imageUrl}
      title={title}
      excerpt={excerpt}
      date={date}
      linkUrl={linkUrl}
      size={size}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function NewsOverlayCardRender({
  imageUrl,
  title,
  excerpt,
  date,
  linkUrl,
  size,
  isEditing,
}: {
  imageUrl: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  date: LocalizedString;
  linkUrl: string;
  size: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const heights: Record<string, string> = {
    sm: "h-48",
    md: "h-64",
    lg: "h-80",
  };
  const titleText = t(title, locale);
  const excerptText = t(excerpt, locale);
  const dateText = t(date, locale);
  return (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className={`block relative ${heights[size] || "h-64"} rounded-xl overflow-hidden group`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={titleText}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        decoding="async"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {dateText && (
          <span className="text-xs text-white/60 uppercase tracking-wider">
            {dateText}
          </span>
        )}
        <h3 className="text-white font-bold text-lg mt-1 line-clamp-2 group-hover:underline">
          {titleText}
        </h3>
        {excerptText && (
          <p className="text-white/70 text-sm mt-1 line-clamp-2">
            {excerptText}
          </p>
        )}
      </div>
    </a>
  );
}

export const EventCard: ComponentConfig<{
  title: LocalizedString;
  date: LocalizedString;
  time: string;
  location: LocalizedString;
  linkUrl: string;
  accentColor: string;
}> = {
  label: "Event Card",
  defaultProps: {
    title: { vi: "Tên sự kiện", en: "Event name" },
    date: { vi: "15/04", en: "15/04" },
    time: "08:00 - 17:00",
    location: {
      vi: "Hội trường Khoa Vật lý",
      en: "Faculty of Physics Auditorium",
    },
    linkUrl: "#",
    accentColor: "#1e40af",
  },
  fields: {
    title: localizedTextField("Title"),
    date: localizedTextField("Date (DD/MM)"),
    time: { type: "text", label: "Time" },
    location: localizedTextField("Location"),
    linkUrl: { type: "text", label: "Link URL" },
    accentColor: colorField("Accent Color"),
  },
  render: ({ title, date, time, location, linkUrl, accentColor, puck }) => (
    <EventCardRender
      title={title}
      date={date}
      time={time}
      location={location}
      linkUrl={linkUrl}
      accentColor={accentColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};

const MONTH_LABELS = [
  "",
  "Th1",
  "Th2",
  "Th3",
  "Th4",
  "Th5",
  "Th6",
  "Th7",
  "Th8",
  "Th9",
  "Th10",
  "Th11",
  "Th12",
];

function EventCardRender({
  title,
  date,
  time,
  location,
  linkUrl,
  accentColor,
  isEditing,
}: {
  title: LocalizedString;
  date: LocalizedString;
  time: string;
  location: LocalizedString;
  linkUrl: string;
  accentColor: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const dateText = t(date, locale);
  const titleText = t(title, locale);
  const locationText = t(location, locale);
  const parts = (dateText || "").split("/");
  const day = parts[0] || "";
  const month = parts[1] || "";
  return (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all group bg-white"
    >
      <div
        className="shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: accentColor || "#1e40af" }}
      >
        <span className="text-xl font-bold leading-none">{day}</span>
        <span className="text-xs uppercase">
          {MONTH_LABELS[parseInt(month, 10)] || month}
        </span>
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
          {titleText}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          {time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {time}
            </span>
          )}
          {locationText && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {locationText}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
