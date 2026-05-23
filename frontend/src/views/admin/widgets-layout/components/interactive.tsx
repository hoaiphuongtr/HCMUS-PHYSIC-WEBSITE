"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { subscriptionApi, visitorApi } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { t, type LocalizedString } from "@/lib/i18n";
import {
  getOrCreateVisitorId,
  getSubscriberEmail,
  setSubscriberEmail,
} from "@/lib/visitor";
import { colorField } from "../fields/color-field";
import {
  localizedTextField,
  localizedTextareaField,
} from "../fields/localized-text-field";

const BUTTON_FONT_CLASS: Record<string, string> = {
  default: "",
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  heading: "font-heading",
  "heading-italic": "font-heading italic",
};

export const ButtonBlock: ComponentConfig<{
  label: LocalizedString;
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
    label: { vi: "Bấm vào đây", en: "Click me" },
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
    label: localizedTextField("Label"),
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
    labelColor: colorField("Label Color (override)"),
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
  }: any) => (
    <ButtonBlockRender
      label={label}
      url={url}
      variant={variant}
      size={size}
      alignment={alignment}
      fullWidth={fullWidth}
      labelFont={labelFont}
      labelColor={labelColor}
      labelClassName={labelClassName}
      labelStyle={rest.labelStyle}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function ButtonBlockRender({
  label,
  url,
  variant,
  size,
  alignment,
  fullWidth,
  labelFont,
  labelColor,
  labelClassName,
  labelStyle,
  isEditing,
}: {
  label: LocalizedString;
  url: string;
  variant: string;
  size: string;
  alignment: string;
  fullWidth: boolean;
  labelFont: string;
  labelColor: string;
  labelClassName: string;
  labelStyle?: Record<string, string | number>;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
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
  const style: Record<string, string> = labelColor ? { color: labelColor } : {};
  const labelText = t(label, locale);
  return (
    <div className={`flex ${aligns[alignment] || "justify-start"}`}>
      <a
        href={isEditing ? "#" : url}
        tabIndex={isEditing ? -1 : undefined}
        className={`inline-block rounded-md font-medium transition-colors ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${BUTTON_FONT_CLASS[labelFont] || ""} ${labelClassName || ""} ${fullWidth ? "w-full text-center" : ""}`}
        style={{ ...style, ...(labelStyle || {}) }}
      >
        {labelText || "Button"}
      </a>
    </div>
  );
}

export const Banner: ComponentConfig<{
  text: LocalizedString;
  subtext: LocalizedString;
  bgColor: string;
  textColor: string;
  alignment: string;
  buttonLabel: LocalizedString;
  buttonUrl: string;
}> = {
  label: "Banner",
  defaultProps: {
    text: { vi: "Chào mừng", en: "Welcome" },
    subtext: { vi: "", en: "" },
    bgColor: "#1e40af",
    textColor: "#ffffff",
    alignment: "center",
    buttonLabel: { vi: "", en: "" },
    buttonUrl: "",
  },
  fields: {
    text: localizedTextField("Text"),
    subtext: localizedTextField("Subtext"),
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    buttonLabel: localizedTextField("Button Label"),
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
    <BannerRender
      text={text}
      subtext={subtext}
      bgColor={bgColor}
      textColor={textColor}
      alignment={alignment}
      buttonLabel={buttonLabel}
      buttonUrl={buttonUrl}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function BannerRender({
  text,
  subtext,
  bgColor,
  textColor,
  alignment,
  buttonLabel,
  buttonUrl,
  isEditing,
}: {
  text: LocalizedString;
  subtext: LocalizedString;
  bgColor: string;
  textColor: string;
  alignment: string;
  buttonLabel: LocalizedString;
  buttonUrl: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const subtextText = t(subtext, locale);
  const buttonText = t(buttonLabel, locale);

  return (
    <div
      className="rounded-lg px-8 py-6"
      style={{
        backgroundColor: bgColor || "#1e40af",
        color: textColor || "#ffffff",
        textAlign: (alignment as any) || "center",
      }}
    >
      <div className="text-2xl font-bold">{t(text, locale) || "Welcome"}</div>
      {subtextText && (
        <div className="text-base opacity-80 mt-1">{subtextText}</div>
      )}
      {buttonText && (
        <div className="mt-4">
          <a
            href={isEditing ? "#" : buttonUrl || "#"}
            tabIndex={isEditing ? -1 : undefined}
            className="inline-block px-6 py-2 text-sm font-medium rounded-md bg-white/20 border border-white/30 hover:bg-white/30 transition-colors"
          >
            {buttonText}
          </a>
        </div>
      )}
    </div>
  );
}

export const AnnouncementBar: ComponentConfig<{
  text: LocalizedString;
  bgColor: string;
  textColor: string;
  icon: string;
  linkUrl: string;
}> = {
  label: "Announcement Bar",
  defaultProps: {
    text: { vi: "Thông báo quan trọng", en: "Important announcement" },
    bgColor: "#dc2626",
    textColor: "#ffffff",
    icon: "campaign",
    linkUrl: "",
  },
  fields: {
    text: localizedTextField("Text"),
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
    icon: { type: "text", label: "Icon (Material Symbol)" },
    linkUrl: { type: "text", label: "Link URL" },
  },
  render: ({ text, bgColor, textColor, icon, linkUrl, puck }) => (
    <AnnouncementBarRender
      text={text}
      bgColor={bgColor}
      textColor={textColor}
      icon={icon}
      linkUrl={linkUrl}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function AnnouncementBarRender({
  text,
  bgColor,
  textColor,
  icon,
  linkUrl,
  isEditing,
}: {
  text: LocalizedString;
  bgColor: string;
  textColor: string;
  icon: string;
  linkUrl: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const label = t(text, locale);

  return (
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
          href={isEditing ? "#" : linkUrl}
          tabIndex={isEditing ? -1 : undefined}
          className="text-sm font-medium flex-1 hover:underline"
        >
          {label}
        </a>
      ) : (
        <span className="text-sm font-medium flex-1">{label}</span>
      )}
    </div>
  );
}

type SearchLink = { label: LocalizedString; url: string };
type SearchLinkPlain = { label: string; url: string };
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
  placeholder: LocalizedString;
  bgColor: string;
  suggestedLinks: SearchLink[];
  hotLinks: SearchLink[];
  showRecent: boolean;
  recentStorageKey: string;
  autoPersonalize: boolean;
}> = {
  label: "Search Overlay",
  defaultProps: {
    placeholder: { vi: "Tìm kiếm...", en: "Search..." },
    bgColor: "#0c2340",
    suggestedLinks: [
      { label: { vi: "Tuyển sinh", en: "Admissions" }, url: "/tuyen-sinh" },
      {
        label: { vi: "Chương trình đào tạo", en: "Programs" },
        url: "/dao-tao",
      },
      { label: { vi: "Nghiên cứu", en: "Research" }, url: "/nghien-cuu" },
      { label: { vi: "Liên hệ", en: "Contact" }, url: "/lien-he" },
    ],
    hotLinks: [
      {
        label: { vi: "Học bổng 2026", en: "Scholarships 2026" },
        url: "/hoc-bong",
      },
      { label: { vi: "Bán dẫn", en: "Semiconductors" }, url: "/ban-dan" },
    ],
    showRecent: true,
    recentStorageKey: "search.recent",
    autoPersonalize: false,
  },
  fields: {
    placeholder: localizedTextField("Placeholder"),
    bgColor: colorField("Background Color"),
    suggestedLinks: {
      type: "array",
      label: "Suggested Links",
      arrayFields: {
        label: localizedTextField("Label"),
        url: { type: "text", label: "URL" },
      },
    },
    hotLinks: {
      type: "array",
      label: "Hot Links",
      arrayFields: {
        label: localizedTextField("Label"),
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
  }) => (
    <SearchOverlayClient
      placeholder={placeholder}
      bgColor={bgColor}
      suggestedLinks={suggestedLinks}
      hotLinks={hotLinks}
      showRecent={showRecent}
      recentStorageKey={recentStorageKey}
      autoPersonalize={autoPersonalize}
      isEditing={!!puck?.isEditing}
    />
  ),
};

const SEARCH_LABELS = {
  trending: { vi: "Xu hướng", en: "Trending" },
  forYou: { vi: "Dành cho bạn", en: "For you" },
  suggested: { vi: "Gợi ý tìm kiếm", en: "Suggested searches" },
  recent: { vi: "Gần đây", en: "Recent" },
  clear: { vi: "Xóa", en: "Clear" },
};

function SearchOverlayClient({
  placeholder,
  bgColor,
  suggestedLinks,
  hotLinks,
  showRecent,
  recentStorageKey,
  autoPersonalize,
  isEditing,
}: {
  placeholder: LocalizedString;
  bgColor: string;
  suggestedLinks: SearchLink[];
  hotLinks: SearchLink[];
  showRecent: boolean;
  recentStorageKey: string;
  autoPersonalize: boolean;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [personalSuggested, setPersonalSuggested] = useState<SearchLinkPlain[]>(
    [],
  );
  const [personalHot, setPersonalHot] = useState<SearchLinkPlain[]>([]);

  useEffect(() => {
    if (open && showRecent) {
      setRecent(readRecent(recentStorageKey || "search.recent"));
    }
  }, [open, showRecent, recentStorageKey]);

  useEffect(() => {
    if (!open || !autoPersonalize || isEditing) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    visitorApi
      .getSuggestions(visitorId, 6)
      .then((res) => {
        if (res.suggestedLinks?.length)
          setPersonalSuggested(res.suggestedLinks);
        if (res.hotTags?.length) {
          setPersonalHot(
            res.hotTags.map((tag) => ({
              label: tag.label,
              url: `/${tag.slug}`,
            })),
          );
        }
      })
      .catch(() => {});
  }, [open, autoPersonalize, isEditing]);

  const placeholderText = t(placeholder, locale);
  const renderLabel = (link: SearchLink | SearchLinkPlain): string =>
    typeof link.label === "string" ? link.label : t(link.label, locale);

  const usePersonalSuggested = autoPersonalize && personalSuggested.length > 0;
  const effectiveSuggested: (SearchLink | SearchLinkPlain)[] =
    usePersonalSuggested ? personalSuggested : suggestedLinks || [];
  const effectiveHot: (SearchLink | SearchLinkPlain)[] =
    autoPersonalize && personalHot.length > 0 ? personalHot : hotLinks || [];

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
        onClick={() => !isEditing && setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition-all text-sm backdrop-blur-sm"
      >
        <span className="material-symbols-outlined text-lg">search</span>
        <span className="hidden sm:inline">{placeholderText}</span>
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
                placeholder={placeholderText}
                className="w-full bg-transparent border-b-2 border-white/40 focus:border-white text-white text-2xl md:text-3xl pb-4 outline-none placeholder:text-white/40 transition-colors"
              />
              <span className="material-symbols-outlined absolute right-0 top-1 text-white/60 text-3xl">
                search
              </span>
            </div>

            {effectiveHot.length > 0 && (
              <div className="mt-8">
                <p className="text-orange-300/80 text-xs uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">
                    local_fire_department
                  </span>
                  {t(SEARCH_LABELS.trending, locale)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {effectiveHot.map((link, i) => (
                    <a
                      key={`hot-${i}`}
                      href={link.url}
                      className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-400/40 text-white hover:bg-orange-500/30 transition-all text-sm"
                    >
                      {renderLabel(link)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {effectiveSuggested.length > 0 && (
              <div className="mt-8">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
                  {usePersonalSuggested
                    ? t(SEARCH_LABELS.forYou, locale)
                    : t(SEARCH_LABELS.suggested, locale)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {effectiveSuggested.map((link, i) => (
                    <a
                      key={`sug-${i}`}
                      href={link.url}
                      className="px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/60 transition-all text-sm"
                    >
                      {renderLabel(link)}
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
                    {t(SEARCH_LABELS.recent, locale)}
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-white/50 hover:text-white text-xs underline"
                  >
                    {t(SEARCH_LABELS.clear, locale)}
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
}

type Persona = {
  label: LocalizedString;
  icon: string;
  description: LocalizedString;
  linkUrl: string;
};

export const PersonaSelector: ComponentConfig<{
  personas: Persona[];
  bgColor: string;
}> = {
  label: "Persona Selector",
  defaultProps: {
    personas: [
      {
        label: { vi: "Sinh viên", en: "Students" },
        icon: "school",
        description: {
          vi: "Thông tin học vụ, lịch thi, biểu mẫu",
          en: "Academics, exam schedules, forms",
        },
        linkUrl: "/sinh-vien",
      },
      {
        label: { vi: "Giảng viên", en: "Faculty" },
        icon: "person",
        description: {
          vi: "Nghiên cứu, giảng dạy, quản lý",
          en: "Research, teaching, administration",
        },
        linkUrl: "/giang-vien",
      },
      {
        label: { vi: "Tuyển sinh", en: "Admissions" },
        icon: "campaign",
        description: {
          vi: "Chương trình, xét tuyển, học bổng",
          en: "Programs, admissions, scholarships",
        },
        linkUrl: "/tuyen-sinh",
      },
      {
        label: { vi: "Cựu sinh viên", en: "Alumni" },
        icon: "groups",
        description: {
          vi: "Kết nối, sự kiện, đóng góp",
          en: "Connect, events, give back",
        },
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
        label: localizedTextField("Label"),
        icon: { type: "text", label: "Material Icon" },
        description: localizedTextField("Description"),
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    bgColor: colorField("Background Color"),
  },
  render: ({ personas, bgColor, puck }) => (
    <PersonaSelectorRender
      personas={personas || []}
      bgColor={bgColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function PersonaSelectorRender({
  personas,
  bgColor,
  isEditing,
}: {
  personas: Persona[];
  bgColor: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  return (
    <div
      className="py-16 px-6"
      style={{ backgroundColor: bgColor || "#ffffff" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {personas.map((p, i) => (
            <a
              key={i}
              href={isEditing ? "#" : p.linkUrl || "#"}
              tabIndex={isEditing ? -1 : undefined}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-2xl text-blue-700">
                  {p.icon}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">
                {t(p.label, locale)}
              </h3>
              <p className="text-xs text-slate-500">
                {t(p.description, locale)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

type SubscribeTagOption = { label: LocalizedString; value: string };

const SUBSCRIBE_LABELS = {
  emailRequired: { vi: "Vui lòng nhập email", en: "Please enter your email" },
  saving: { vi: "Đang lưu...", en: "Saving..." },
  subscribe: { vi: "Đăng ký", en: "Subscribe" },
  alreadyOnList: {
    vi: "Bạn đã nằm trong danh sách nhận thông báo.",
    en: "You're already on the notifications list.",
  },
  defaultSuccess: {
    vi: "Cảm ơn bạn đã đăng ký!",
    en: "Thanks for subscribing!",
  },
  defaultError: { vi: "Đăng ký thất bại", en: "Subscription failed" },
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
  title: LocalizedString;
  subtitle: LocalizedString;
  bgColor: string;
  textColor: string;
  tagOptions: SubscribeTagOption[];
  successMessage: LocalizedString;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
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
      prev.includes(value)
        ? prev.filter((tag) => tag !== value)
        : [...prev, value],
    );
  };

  const submit = async () => {
    if (!email.trim()) {
      setError(t(SUBSCRIBE_LABELS.emailRequired, locale));
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
      const msg =
        err instanceof Error
          ? err.message
          : t(SUBSCRIBE_LABELS.defaultError, locale);
      setError(msg);
    }
  };

  const titleText = t(title, locale);
  const subtitleText = t(subtitle, locale);
  const successText =
    t(successMessage, locale) || t(SUBSCRIBE_LABELS.defaultSuccess, locale);

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
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{titleText}</h3>
        <p className="text-sm md:text-base opacity-80">{subtitleText}</p>
      </div>
      {alreadySubscribed && !isEditing ? (
        <div
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-6 text-center"
          style={{ color: textColor || "#ffffff" }}
        >
          <p className="text-sm font-medium">{successText}</p>
          <p className="text-xs mt-1 opacity-70">
            {t(SUBSCRIBE_LABELS.alreadyOnList, locale)}
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
                    {t(opt.label, locale)}
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
            {status === "saving"
              ? t(SUBSCRIBE_LABELS.saving, locale)
              : t(SUBSCRIBE_LABELS.subscribe, locale)}
          </button>
          {error && <p className="text-xs text-red-200">{error}</p>}
        </div>
      )}
    </section>
  );
}

export const SubscribeBanner: ComponentConfig<{
  title: LocalizedString;
  subtitle: LocalizedString;
  bgColor: string;
  textColor: string;
  tagOptions: SubscribeTagOption[];
  successMessage: LocalizedString;
}> = {
  label: "Subscribe Banner",
  defaultProps: {
    title: {
      vi: "Nhận thông báo qua email",
      en: "Get notified by email",
    },
    subtitle: {
      vi: "Học bổng, tuyển sinh, sự kiện... được gửi tới bạn khi có thông tin mới.",
      en: "Scholarships, admissions, events... delivered to you when new info is available.",
    },
    bgColor: "#0c2340",
    textColor: "#ffffff",
    tagOptions: [
      {
        label: { vi: "Học bổng", en: "Scholarships" },
        value: "hoc-bong",
      },
      {
        label: { vi: "Tuyển sinh", en: "Admissions" },
        value: "tuyen-sinh",
      },
      {
        label: { vi: "Bán dẫn", en: "Semiconductors" },
        value: "ban-dan",
      },
      {
        label: { vi: "Nghiên cứu", en: "Research" },
        value: "nghien-cuu",
      },
    ],
    successMessage: {
      vi: "Cảm ơn bạn đã đăng ký!",
      en: "Thanks for subscribing!",
    },
  },
  fields: {
    title: localizedTextField("Title"),
    subtitle: localizedTextareaField("Subtitle"),
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
    tagOptions: {
      type: "array",
      label: "Tag Options",
      arrayFields: {
        label: localizedTextField("Label"),
        value: { type: "text", label: "Value (tag slug)" },
      },
    },
    successMessage: localizedTextField("Success Message"),
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
  message: LocalizedString;
  linkLabel: LocalizedString;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  minWeight: number;
  dismissible: boolean;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const messageText = t(message, locale);
  const linkLabelText = t(linkLabel, locale);
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
      <span className="text-sm font-medium flex-1">{messageText}</span>
      {linkLabelText && (
        <a
          href={isEditing ? "#" : linkUrl || "#"}
          tabIndex={isEditing ? -1 : undefined}
          className="px-3 py-1 text-xs font-semibold rounded-md bg-white/15 hover:bg-white/25"
        >
          {linkLabelText}
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
  message: LocalizedString;
  linkLabel: LocalizedString;
  linkUrl: string;
  bgColor: string;
  textColor: string;
  minWeight: number;
  dismissible: boolean;
}> = {
  label: "Tag Notification Bar",
  defaultProps: {
    tagSlug: "hoc-bong",
    message: {
      vi: "Bạn quan tâm học bổng? Đăng ký để không bỏ lỡ tin mới.",
      en: "Interested in scholarships? Subscribe to stay in the loop.",
    },
    linkLabel: { vi: "Đăng ký", en: "Subscribe" },
    linkUrl: "#subscribe",
    bgColor: "#0c2340",
    textColor: "#ffffff",
    minWeight: 3,
    dismissible: true,
  },
  fields: {
    tagSlug: { type: "text", label: "Tag slug" },
    message: localizedTextField("Message"),
    linkLabel: localizedTextField("Link label"),
    linkUrl: { type: "text", label: "Link URL" },
    bgColor: colorField("Background Color"),
    textColor: colorField("Text Color"),
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
