"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";

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
            {months[parseInt(month, 10)] || month}
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

function buildGoogleCalendarUrl(event: {
  title: string;
  date: string;
  time: string;
  location: string;
}) {
  const [day, month, year] = (event.date || "").split("/");
  if (!day || !month || !year) return "";
  const dateStr = `${year}${month}${day}`;
  const [startTime] = (event.time || "08:00").split(" - ");
  const [h, m] = (startTime || "08:00").split(":");
  const timeStr = `${(h || "08").padStart(2, "0")}${(m || "00").padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${dateStr}T${timeStr}/${dateStr}T${timeStr}`,
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function UpcomingEventsClient({
  events,
  isEditing,
}: {
  events: {
    imageUrl: string;
    title: string;
    date: string;
    time: string;
    location: string;
    linkUrl: string;
    featured: boolean;
  }[];
  isEditing: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isEditing]);

  const featured = events.filter((e) => e.featured);
  const upcoming = events.filter((e) => !e.featured);

  return (
    <div ref={ref}>
      {featured.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {featured.map((event, i) => (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden group"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`,
              }}
            >
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-blue-800 to-blue-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-xs text-white/60 uppercase tracking-wider">
                  {event.date}
                  {event.time ? ` · ${event.time}` : ""}
                </span>
                <h3 className="text-white font-bold text-lg mt-1 line-clamp-2 group-hover:underline">
                  <a
                    href={isEditing ? "#" : event.linkUrl || "#"}
                    tabIndex={isEditing ? -1 : undefined}
                  >
                    {event.title}
                  </a>
                </h3>
                {event.location && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    {event.location}
                  </p>
                )}
                <a
                  href={isEditing ? "#" : buildGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isEditing ? -1 : undefined}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-md transition-colors backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    calendar_month
                  </span>
                  Thêm vào lịch
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          {upcoming.map((event, i) => {
            const parts = (event.date || "").split("/");
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
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all group bg-white"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.5s ease ${(featured.length + i) * 0.1}s, transform 0.5s ease ${(featured.length + i) * 0.1}s`,
                }}
              >
                <div className="shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white bg-blue-800">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-xs uppercase">
                    {months[parseInt(month, 10)] || month}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={isEditing ? "#" : event.linkUrl || "#"}
                    tabIndex={isEditing ? -1 : undefined}
                    className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2"
                  >
                    {event.title}
                  </a>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        {event.time}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={isEditing ? "#" : buildGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isEditing ? -1 : undefined}
                  className="shrink-0 self-center w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Thêm vào Google Calendar"
                >
                  <span className="material-symbols-outlined text-xl">
                    calendar_month
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const UpcomingEvents: ComponentConfig<{
  events: {
    imageUrl: string;
    title: string;
    date: string;
    time: string;
    location: string;
    linkUrl: string;
    featured: boolean;
  }[];
}> = {
  label: "Upcoming Events",
  defaultProps: {
    events: [
      {
        imageUrl: "",
        title: "Sự kiện nổi bật",
        date: "15/04/2026",
        time: "08:00 - 17:00",
        location: "Hội trường Khoa Vật lý",
        linkUrl: "#",
        featured: true,
      },
    ],
  },
  fields: {
    events: {
      type: "array",
      label: "Events",
      arrayFields: {
        imageUrl: { type: "text", label: "Image URL" },
        title: { type: "text", label: "Title" },
        date: { type: "text", label: "Date (DD/MM/YYYY)" },
        time: { type: "text", label: "Time" },
        location: { type: "text", label: "Location" },
        linkUrl: { type: "text", label: "Link URL" },
        featured: {
          type: "radio",
          label: "Featured (thumbnail card)",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
      },
    },
  },
  render: ({ events, puck }) => (
    <UpcomingEventsClient
      events={events || []}
      isEditing={!!puck?.isEditing}
    />
  ),
};
