"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { Image as ImageIcon, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DynamicIcon } from "@/components/admin/icons";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";

export const Heading: ComponentConfig<{
  text: LocalizedString;
  level: string;
  alignment: string;
  color: string;
  anchorId: string;
}> = {
  label: "Heading",
  defaultProps: {
    text: { vi: "Tiêu đề", en: "Heading" },
    level: "h2",
    alignment: "left",
    color: "#1e293b",
    anchorId: "",
  },
  fields: {
    anchorId: { type: "text", label: "Anchor ID (for scroll target)" },
    text: localizedTextField("Text"),
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
    color: colorField("Color"),
  },
  render: ({ text, level, alignment, color, anchorId }) => (
    <HeadingRender
      text={text}
      level={level}
      alignment={alignment}
      color={color}
      anchorId={anchorId}
    />
  ),
};

function HeadingRender({
  text,
  level,
  alignment,
  color,
  anchorId,
}: {
  text: LocalizedString;
  level: string;
  alignment: string;
  color: string;
  anchorId: string;
}) {
  const { locale } = useLocale();
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
      id={anchorId || undefined}
      className={`${sizes[level] || sizes.h2} scroll-mt-20`}
      style={{ textAlign: alignment as any, color: color || "#1e293b" }}
    >
      {t(text, locale) || "Heading"}
    </Tag>
  );
}

export const TextBlock: ComponentConfig<{
  content: LocalizedString;
  fontSize: string;
  alignment: string;
  color: string;
}> = {
  label: "Text",
  defaultProps: {
    content: { vi: "Nhập nội dung tại đây...", en: "Enter your text here..." },
    fontSize: "base",
    alignment: "left",
    color: "#475569",
  },
  fields: {
    content: localizedTextareaField("Content"),
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
    color: colorField("Color"),
  },
  render: ({ content, fontSize, alignment, color }) => (
    <TextBlockRender
      content={content}
      fontSize={fontSize}
      alignment={alignment}
      color={color}
    />
  ),
};

function TextBlockRender({
  content,
  fontSize,
  alignment,
  color,
}: {
  content: LocalizedString;
  fontSize: string;
  alignment: string;
  color: string;
}) {
  const { locale } = useLocale();
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
      {t(content, locale) || "Enter your text here..."}
    </p>
  );
}

export const IconText: ComponentConfig<{
  icon: string;
  title: LocalizedString;
  description: LocalizedString;
  iconColor: string;
  layout: string;
}> = {
  label: "Icon + Text",
  defaultProps: {
    icon: "info",
    title: { vi: "Feature", en: "Feature" },
    description: {
      vi: "Mô tả tính năng",
      en: "Feature description",
    },
    iconColor: "#3b82f6",
    layout: "horizontal",
  },
  fields: {
    icon: { type: "text", label: "Icon (Material Symbol)" },
    title: localizedTextField("Title"),
    description: localizedTextareaField("Description"),
    iconColor: colorField("Icon Color"),
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
  },
  render: ({ icon, title, description, iconColor, layout }) => (
    <IconTextRender
      icon={icon}
      title={title}
      description={description}
      iconColor={iconColor}
      layout={layout}
    />
  ),
};

function IconTextRender({
  icon,
  title,
  description,
  iconColor,
  layout,
}: {
  icon: string;
  title: LocalizedString;
  description: LocalizedString;
  iconColor: string;
  layout: string;
}) {
  const { locale } = useLocale();
  const isVertical = layout === "vertical";
  const titleText = t(title, locale);
  const descriptionText = t(description, locale);
  return (
    <div
      className={`flex ${isVertical ? "flex-col items-center text-center" : "items-start"} gap-3 p-4`}
    >
      <DynamicIcon
        name={icon || "info"}
        className="w-8 h-8"
        style={{ color: iconColor || "#3b82f6" }}
      />
      <div>
        <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {titleText || "Feature"}
        </div>
        {descriptionText && (
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{descriptionText}</div>
        )}
      </div>
    </div>
  );
}

const SECTION_TITLE_SIZES: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const SECTION_TITLE_FONTS: Record<string, string> = {
  default: "",
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  heading: "font-heading",
  "heading-italic": "font-heading italic",
};

export const SectionHeader: ComponentConfig<{
  title: LocalizedString;
  linkText: LocalizedString;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  titleSize: string;
  titleFont: string;
  titleClassName: string;
}> = {
  label: "Section Header",
  defaultProps: {
    title: { vi: "Tiêu đề mục", en: "Section Title" },
    linkText: { vi: "Xem thêm", en: "View all" },
    linkUrl: "#",
    bgColor: "#1e40af",
    textColor: "#ffffff",
    titleSize: "sm",
    titleFont: "default",
    titleClassName: "",
  },
  fields: {
    title: localizedTextField("Title"),
    linkText: localizedTextField("Link Text"),
    linkUrl: { type: "text", label: "Link URL" },
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "XS", value: "xs" },
        { label: "S", value: "sm" },
        { label: "M", value: "md" },
        { label: "L", value: "lg" },
        { label: "XL", value: "xl" },
      ],
    },
    titleFont: {
      type: "select",
      label: "Title Font",
      options: [
        { label: "Default", value: "default" },
        { label: "Sans", value: "sans" },
        { label: "Serif", value: "serif" },
        { label: "Mono", value: "mono" },
        { label: "Heading", value: "heading" },
        { label: "Heading italic", value: "heading-italic" },
      ],
    },
    titleClassName: { type: "text", label: "Title class (advanced)" },
  },
  render: ({
    title,
    linkText,
    linkUrl,
    bgColor,
    textColor,
    titleSize,
    titleFont,
    titleClassName,
    puck,
    ...rest
  }: any) => (
    <SectionHeaderRender
      title={title}
      linkText={linkText}
      linkUrl={linkUrl}
      bgColor={bgColor}
      textColor={textColor}
      titleSize={titleSize}
      titleFont={titleFont}
      titleClassName={titleClassName}
      titleStyle={rest.titleStyle}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function SectionHeaderRender({
  title,
  linkText,
  linkUrl,
  bgColor,
  textColor,
  titleSize,
  titleFont,
  titleClassName,
  titleStyle,
  isEditing,
}: {
  title: LocalizedString;
  linkText: LocalizedString;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  titleSize: string;
  titleFont: string;
  titleClassName: string;
  titleStyle?: Record<string, string | number>;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const titleText = t(title, locale);
  const linkLabel = t(linkText, locale);
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-t-md"
      style={{ backgroundColor: bgColor || "#1e40af" }}
    >
      <h3
        className={`font-bold uppercase tracking-wide ${SECTION_TITLE_SIZES[titleSize] || SECTION_TITLE_SIZES.sm} ${SECTION_TITLE_FONTS[titleFont] || ""} ${titleClassName || ""}`}
        style={{ color: textColor || "#ffffff", ...(titleStyle || {}) }}
      >
        {titleText}
      </h3>
      {linkLabel && (
        <a
          href={isEditing ? "#" : linkUrl || "#"}
          tabIndex={isEditing ? -1 : undefined}
          className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: textColor || "#ffffff" }}
        >
          {linkLabel} &raquo;
        </a>
      )}
    </div>
  );
}

export const ContactInfo: ComponentConfig<{
  address: LocalizedString;
  phone: string;
  email: string;
  showIcons: boolean;
  color: string;
  layout: string;
  alignment: string;
}> = {
  label: "Contact Info",
  defaultProps: {
    address: {
      vi: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM",
      en: "227 Nguyen Van Cu, Ward 4, District 5, HCMC",
    },
    phone: "+84 28 38355272",
    email: "phys@hcmus.edu.vn",
    showIcons: true,
    color: "#475569",
    layout: "vertical",
    alignment: "left",
  },
  fields: {
    address: localizedTextField("Address"),
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
    color: colorField("Text Color"),
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
  }) => (
    <ContactInfoRender
      address={address}
      phone={phone}
      email={email}
      showIcons={showIcons}
      color={color}
      layout={layout}
      alignment={alignment}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function ContactInfoRender({
  address,
  phone,
  email,
  showIcons,
  color,
  layout,
  alignment,
  isEditing,
}: {
  address: LocalizedString;
  phone: string;
  email: string;
  showIcons: boolean;
  color: string;
  layout: string;
  alignment: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const addressText = t(address, locale);
  const items = [
    { icon: "location_on", text: addressText, href: "" },
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
          : `space-y-2${isCenter ? " flex flex-col items-center" : ""}`
      }
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {showIcons !== false && (
            <DynamicIcon
              name={item.icon}
              className="w-[18px] h-[18px] shrink-0"
              style={{ color: color || "#475569" }}
            />
          )}
          {item.href ? (
            <a
              href={isEditing ? "#" : item.href}
              tabIndex={isEditing ? -1 : undefined}
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
}

export const NewsCard: ComponentConfig<{
  imageUrl: string;
  title: LocalizedString;
  date: LocalizedString;
  linkUrl: string;
  layout: string;
  widthPct: string;
  align: string;
  tags: { slug: string }[];
}> = {
  label: "News Card",
  defaultProps: {
    imageUrl: "",
    title: { vi: "Tiêu đề bài viết", en: "Article title" },
    date: { vi: "25/03/2026", en: "25/03/2026" },
    linkUrl: "#",
    layout: "horizontal",
    widthPct: "100",
    align: "left",
    tags: [],
  },
  fields: {
    imageUrl: mediaPickerField("Image"),
    title: localizedTextField("Title"),
    date: localizedTextField("Date"),
    linkUrl: { type: "text", label: "Link URL" },
    tags: {
      type: "array",
      label: "Tags (for personalization)",
      arrayFields: {
        slug: { type: "text", label: "Tag slug" },
      },
    },
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Horizontal (thumbnail left)", value: "horizontal" },
        { label: "Vertical (image top)", value: "vertical" },
      ],
    },
    widthPct: {
      type: "select",
      label: "Width",
      options: [
        { label: "25%", value: "25" },
        { label: "33%", value: "33" },
        { label: "50%", value: "50" },
        { label: "66%", value: "66" },
        { label: "75%", value: "75" },
        { label: "100% (fill)", value: "100" },
      ],
    },
    align: {
      type: "select",
      label: "Align",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  render: ({
    imageUrl,
    title,
    date,
    linkUrl,
    layout,
    widthPct,
    align,
    puck,
  }) => (
    <NewsCardRender
      imageUrl={imageUrl}
      title={title}
      date={date}
      linkUrl={linkUrl}
      layout={layout}
      widthPct={widthPct}
      align={align}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function NewsCardRender({
  imageUrl,
  title,
  date,
  linkUrl,
  layout,
  widthPct,
  align,
  isEditing,
}: {
  imageUrl: string;
  title: LocalizedString;
  date: LocalizedString;
  linkUrl: string;
  layout: string;
  widthPct: string;
  align: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const titleText = t(title, locale);
  const dateText = t(date, locale);
  const isVertical = layout === "vertical";
  const pct = parseInt(widthPct || "100", 10);
  const wrapperClass =
    align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "";
  const wrapperStyle =
    pct && pct < 100 ? { width: `${pct}%` } : { width: "100%" };
  const inner = isVertical ? (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className="block group"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={titleText}
          className="w-full aspect-video object-cover rounded-md mb-2"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full aspect-video bg-slate-100 dark:bg-[#1a2436] rounded-md mb-2 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-slate-300" />
        </div>
      )}
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
        {titleText}
      </h4>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{dateText}</p>
    </a>
  ) : (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className="flex gap-3 group py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={titleText}
          className="w-20 h-14 object-cover rounded shrink-0"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-20 h-14 bg-slate-100 dark:bg-[#1a2436] rounded shrink-0 flex items-center justify-center">
          <ImageIcon className="w-[18px] h-[18px] text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
          {titleText}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{dateText}</p>
      </div>
    </a>
  );
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {inner}
    </div>
  );
}

export const ProfileCard: ComponentConfig<{
  imageUrl: string;
  name: LocalizedString;
  role: LocalizedString;
  description: LocalizedString;
  linkUrl: string;
}> = {
  label: "Profile Card",
  defaultProps: {
    imageUrl: "",
    name: { vi: "Họ và Tên", en: "Full Name" },
    role: { vi: "Chức vụ", en: "Title" },
    description: { vi: "", en: "" },
    linkUrl: "#",
  },
  fields: {
    imageUrl: mediaPickerField("Photo"),
    name: localizedTextField("Name"),
    role: localizedTextField("Role/Title"),
    description: localizedTextareaField("Description"),
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ imageUrl, name, role, description, linkUrl, puck }) => (
    <ProfileCardRender
      imageUrl={imageUrl}
      name={name}
      role={role}
      description={description}
      linkUrl={linkUrl}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function ProfileCardRender({
  imageUrl,
  name,
  role,
  description,
  linkUrl,
  isEditing,
}: {
  imageUrl: string;
  name: LocalizedString;
  role: LocalizedString;
  description: LocalizedString;
  linkUrl: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const nameText = t(name, locale);
  const roleText = t(role, locale);
  const descriptionText = t(description, locale);
  return (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className="block text-center group"
    >
      <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm mb-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nameText}
            className="w-full aspect-[3/4] object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-[#1a2436] flex items-center justify-center">
            <User className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {descriptionText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/95 via-blue-900/85 to-transparent pt-16 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white font-bold text-base">{nameText}</p>
            <p className="text-blue-200 text-sm mt-1">{roleText}</p>
            <p className="text-white text-sm md:text-base mt-3 leading-relaxed font-medium">
              {descriptionText}
            </p>
          </div>
        )}
      </div>
      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
        {nameText}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{roleText}</p>
    </a>
  );
}

export const DepartmentCard: ComponentConfig<{
  imageUrl: string;
  title: LocalizedString;
  linkUrl: string;
}> = {
  label: "Department Card",
  defaultProps: {
    imageUrl: "",
    title: { vi: "Tên bộ môn", en: "Department name" },
    linkUrl: "#",
  },
  fields: {
    imageUrl: mediaPickerField("Background Image"),
    title: localizedTextField("Title"),
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ imageUrl, title, linkUrl, puck }) => (
    <DepartmentCardRender
      imageUrl={imageUrl}
      title={title}
      linkUrl={linkUrl}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function DepartmentCardRender({
  imageUrl,
  title,
  linkUrl,
  isEditing,
}: {
  imageUrl: string;
  title: LocalizedString;
  linkUrl: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const titleText = t(title, locale);
  return (
    <a
      href={isEditing ? "#" : linkUrl || "#"}
      tabIndex={isEditing ? -1 : undefined}
      className="block relative aspect-[16/10] rounded-lg overflow-hidden group"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={titleText}
          className="w-full h-full object-cover animate-[deptFloat_6s_ease-in-out_infinite] group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
        <span className="text-white text-sm font-semibold drop-shadow-lg">
          {titleText}
        </span>
      </div>
    </a>
  );
}

type ImageTextStat = { value: string; label: LocalizedString };

function ImageTextBlockClient({
  imageUrl,
  imageAlt,
  imagePosition,
  headline,
  body,
  stats,
  ctaLabel,
  ctaUrl,
  bgColor,
  fullBleed,
  isEditing,
}: {
  imageUrl: string;
  imageAlt: string;
  imagePosition: string;
  headline: LocalizedString;
  body: LocalizedString;
  stats: ImageTextStat[];
  ctaLabel: LocalizedString;
  ctaUrl: string;
  bgColor: string;
  fullBleed: boolean;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const headlineText = t(headline, locale);
  const bodyText = t(body, locale);
  const ctaText = t(ctaLabel, locale);
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
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isEditing]);

  const isRight = imagePosition === "right";

  if (fullBleed) {
    const imgClip = visible
      ? "inset(0 0 0 0)"
      : isRight
        ? "inset(0 0 0 100%)"
        : "inset(0 100% 0 0)";
    return (
      <div
        ref={ref}
        className="grid md:grid-cols-2 overflow-hidden"
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <div
          className={`relative min-h-[50vh] md:min-h-[70vh] ${isRight ? "md:order-2" : ""}`}
          style={{
            clipPath: imgClip,
            transition: "clip-path 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-200 dark:bg-[#202c44] flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
        <div
          className={`flex flex-col justify-center p-10 md:p-16 lg:p-20 ${isRight ? "md:order-1" : ""}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          {headlineText && (
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              {headlineText}
            </h2>
          )}
          {bodyText && (
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              {bodyText}
            </p>
          )}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-8 mb-8">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-4xl font-bold text-blue-800">
                    {s.value}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                    {t(s.label, locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {ctaText && (
            <a
              href={isEditing ? "#" : ctaUrl || "#"}
              tabIndex={isEditing ? -1 : undefined}
              className="inline-block px-8 py-4 bg-blue-800 text-white text-base font-semibold rounded hover:bg-blue-900 transition-colors self-start"
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="py-16 px-6 md:px-12"
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div
          className={`overflow-hidden rounded-lg ${isRight ? "md:order-2" : ""}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0)"
              : isRight
                ? "translateX(40px)"
                : "translateX(-40px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-[#202c44] flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
        <div
          className={isRight ? "md:order-1" : ""}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
          }}
        >
          {headlineText && (
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">
              {headlineText}
            </h2>
          )}
          {bodyText && (
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {bodyText}
            </p>
          )}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-blue-800">
                    {s.value}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t(s.label, locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {ctaText && (
            <a
              href={isEditing ? "#" : ctaUrl || "#"}
              tabIndex={isEditing ? -1 : undefined}
              className="inline-block px-6 py-3 bg-blue-800 text-white text-sm font-semibold rounded hover:bg-blue-900 transition-colors"
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export const ImageTextBlock: ComponentConfig<{
  imageUrl: string;
  imageAlt: string;
  imagePosition: string;
  headline: LocalizedString;
  body: LocalizedString;
  stats: ImageTextStat[];
  ctaLabel: LocalizedString;
  ctaUrl: string;
  bgColor: string;
  fullBleed: boolean;
}> = {
  label: "Image + Text Block",
  defaultProps: {
    imageUrl: "",
    imageAlt: "",
    imagePosition: "left",
    headline: { vi: "Tiêu đề", en: "Heading" },
    body: { vi: "Mô tả nội dung", en: "Content description" },
    stats: [],
    ctaLabel: { vi: "", en: "" },
    ctaUrl: "#",
    bgColor: "",
    fullBleed: false,
  },
  fields: {
    fullBleed: {
      type: "radio",
      label: "Full Bleed (edge-to-edge)",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    imageUrl: mediaPickerField("Image"),
    imageAlt: { type: "text", label: "Image Alt" },
    imagePosition: {
      type: "select",
      label: "Image Position",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    headline: localizedTextField("Headline"),
    body: localizedTextareaField("Body Text"),
    stats: {
      type: "array",
      label: "Stats",
      arrayFields: {
        value: { type: "text", label: "Value (e.g. 50+)" },
        label: localizedTextField("Label"),
      },
    },
    ctaLabel: localizedTextField("CTA Label"),
    ctaUrl: { type: "text", label: "CTA URL" },
    bgColor: colorField("Background Color"),
  },
  render: (props) => (
    <ImageTextBlockClient
      imageUrl={props.imageUrl}
      imageAlt={props.imageAlt}
      imagePosition={props.imagePosition}
      headline={props.headline}
      body={props.body}
      stats={props.stats}
      ctaLabel={props.ctaLabel}
      ctaUrl={props.ctaUrl}
      bgColor={props.bgColor}
      fullBleed={!!props.fullBleed}
      isEditing={!!props.puck?.isEditing}
    />
  ),
};
