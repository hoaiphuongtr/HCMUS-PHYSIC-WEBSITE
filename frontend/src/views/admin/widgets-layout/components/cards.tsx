"use client";

import type { ComponentConfig } from "@puckeditor/core";

export const NewsOverlayCard: ComponentConfig<{
  imageUrl: string;
  title: string;
  excerpt: string;
  date: string;
  linkUrl: string;
  size: string;
}> = {
  label: "News Overlay Card",
  defaultProps: {
    imageUrl: "",
    title: "Tiêu đề bài viết",
    excerpt: "",
    date: "",
    linkUrl: "#",
    size: "md",
  },
  fields: {
    imageUrl: { type: "text", label: "Image URL" },
    title: { type: "text", label: "Title" },
    excerpt: { type: "textarea", label: "Excerpt" },
    date: { type: "text", label: "Date" },
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
  render: ({ imageUrl, title, excerpt, date, linkUrl, size, puck }) => {
    const heights: Record<string, string> = {
      sm: "h-48",
      md: "h-64",
      lg: "h-80",
    };
    return (
      <a
        href={puck?.isEditing ? "#" : linkUrl || "#"}
        tabIndex={puck?.isEditing ? -1 : undefined}
        className={`block relative ${heights[size] || "h-64"} rounded-xl overflow-hidden group`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {date && (
            <span className="text-xs text-white/60 uppercase tracking-wider">
              {date}
            </span>
          )}
          <h3 className="text-white font-bold text-lg mt-1 line-clamp-2 group-hover:underline">
            {title}
          </h3>
          {excerpt && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{excerpt}</p>
          )}
        </div>
      </a>
    );
  },
};

export const EventCard: ComponentConfig<{
  title: string;
  date: string;
  time: string;
  location: string;
  linkUrl: string;
  accentColor: string;
}> = {
  label: "Event Card",
  defaultProps: {
    title: "Tên sự kiện",
    date: "15/04",
    time: "08:00 - 17:00",
    location: "Hội trường Khoa Vật lý",
    linkUrl: "#",
    accentColor: "#1e40af",
  },
  fields: {
    title: { type: "text", label: "Title" },
    date: { type: "text", label: "Date (DD/MM)" },
    time: { type: "text", label: "Time" },
    location: { type: "text", label: "Location" },
    linkUrl: { type: "text", label: "Link URL" },
    accentColor: { type: "text", label: "Accent Color" },
  },
  render: ({ title, date, time, location, linkUrl, accentColor, puck }) => {
    const parts = (date || "").split("/");
    const day = parts[0] || "";
    const month = parts[1] || "";
    const months = [
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
    return (
      <a
        href={puck?.isEditing ? "#" : linkUrl || "#"}
        tabIndex={puck?.isEditing ? -1 : undefined}
        className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all group bg-white"
      >
        <div
          className="shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white"
          style={{ backgroundColor: accentColor || "#1e40af" }}
        >
          <span className="text-xl font-bold leading-none">{day}</span>
          <span className="text-xs uppercase">
            {months[parseInt(month)] || month}
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
            {title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {time && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
                {time}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {location}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  },
};
