"use client";

import type { ComponentConfig } from "@puckeditor/core";

export const Heading: ComponentConfig<{
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

export const TextBlock: ComponentConfig<{
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

export const IconText: ComponentConfig<{
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

export const SectionHeader: ComponentConfig<{
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

export const ContactInfo: ComponentConfig<{
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
  render: ({ address, phone, email, showIcons, color, layout, alignment, puck }) => {
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

export const NewsCard: ComponentConfig<{
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
            <img src={imageUrl} alt={title} className="w-full aspect-video object-cover rounded-md mb-2" />
          ) : (
            <div className="w-full aspect-video bg-slate-100 rounded-md mb-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-slate-300">image</span>
            </div>
          )}
          <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h4>
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
          <img src={imageUrl} alt={title} className="w-20 h-14 object-cover rounded shrink-0" />
        ) : (
          <div className="w-20 h-14 bg-slate-100 rounded shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-slate-300">image</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h4>
          <p className="text-xs text-slate-400 mt-1">{date}</p>
        </div>
      </a>
    );
  },
};

export const ProfileCard: ComponentConfig<{
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
          <img src={imageUrl} alt={name} className="w-full aspect-[3/4] object-cover" />
        ) : (
          <div className="w-full aspect-[3/4] bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">person</span>
          </div>
        )}
      </div>
      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide group-hover:text-blue-600 transition-colors">{name}</h4>
      <p className="text-xs text-slate-500 mt-1">{role}</p>
      {description && <p className="text-xs text-slate-400 mt-2 line-clamp-3">{description}</p>}
    </a>
  ),
};

export const DepartmentCard: ComponentConfig<{
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
        <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
        <span className="text-white text-sm font-semibold drop-shadow-lg">{title}</span>
      </div>
    </a>
  ),
};
