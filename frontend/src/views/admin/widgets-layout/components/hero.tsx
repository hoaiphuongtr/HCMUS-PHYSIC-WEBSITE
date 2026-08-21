"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import { localizedSummary } from "../fields/item-summary";
import { localizedTextField } from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";
import {
  resolveTextStyle,
  type TextStyle,
  textStyleField,
} from "../fields/text-style-field";
import { resolveOptimizerSrc } from "./media-src";

const withLocalePrefix = (
  url: string | null | undefined,
  locale: string,
): string => {
  if (!url) return "#";
  if (/^(?:https?:|mailto:|tel:|#)/.test(url)) return url;
  if (/^\/(?:vi|en)(?:\/|$)/.test(url)) return url;
  return `/${locale}${url.startsWith("/") ? url : `/${url}`}`;
};

type HeroSlide = {
  src: string;
  alt: string;
  // Khẩu hiệu RIÊNG của slide này. Bỏ trống thì dùng khẩu hiệu chung của khối.
  // KHÔNG khai optional: Puck không nhận field cho thuộc tính optional. Slide cũ
  // trong CSDL không có khoá này nên lúc chạy vẫn phải truy cập an toàn.
  tagline: LocalizedString;
  // Ẩn hẳn khẩu hiệu ở slide này, kể cả khi có khẩu hiệu chung.
  hideTagline: boolean;
  headline: LocalizedString;
  subtitle: LocalizedString;
  ctaLabel: LocalizedString;
  ctaUrl: string;
};

// Mobile taglines must stay on one short line inside the viewport (the tagline is
// uppercase + wide letter-spacing, so it overflows fast). Keep the phone sizes small
// and let them scale up from md: to the intended desktop size.
const TAGLINE_SIZES: Record<string, string> = {
  xs: "text-[9px] md:text-sm",
  sm: "text-[9px] md:text-base",
  md: "text-[10px] md:text-lg",
  lg: "text-[11px] md:text-xl",
  xl: "text-xs md:text-2xl",
};

// Dấu phân cách trong khẩu hiệu/tiêu đề ("KHÁM PHÁ • SÁNG TẠO • CỐNG HIẾN",
// "Khoa Vật lý - Vật lý kỹ thuật"): chỉ những dấu này mới là chỗ được xuống
// dòng, còn từng cụm chữ giữ nguyên khối.
const PHRASE_SEP = /^[•·|–—-]$/;
// Cụm dài hơn mức này thì KHÔNG ép giữ nguyên khối nữa — ép mà không vừa màn
// hình thì chữ tràn ra ngoài, còn tệ hơn là bị ngắt dòng.
const MAX_NOWRAP_CHARS = 24;
// Tiêu đề NGẮN thì ép một dòng trên desktop cho đẹp; tiêu đề DÀI mà vẫn ép thì
// tràn ra ngoài và bị cắt mất chữ (bản tiếng Anh "Faculty of Physics &
// Engineering Physics" dài 40 ký tự, gấp rưỡi bản tiếng Việt).
const MAX_ONE_LINE_HEADLINE = 32;

/**
 * Chia chuỗi thành các cụm + dấu phân cách, để trên màn hẹp chữ chỉ xuống dòng ở
 * dấu phân cách chứ không cắt đôi một cụm ("… • CỐNG / HIẾN", "… - Vật / lý").
 * Không có dấu nào thì trả về mảng rỗng, nơi gọi cứ hiển thị nguyên văn.
 */
function splitPhrases(text: string): string[] {
  if (!text) return [];
  const parts = text
    .split(/\s+([•·|–—-])\s+/)
    .filter((x) => x.trim().length > 0);
  return parts.length > 1 ? parts : [];
}

/** Hiển thị các cụm đã tách: cụm thì nowrap, dấu thì cho phép xuống dòng. */
function PhraseParts({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, i) =>
        PHRASE_SEP.test(part) ? (
          <span key={`sep-${i}`}>{` ${part} `}</span>
        ) : (
          <span
            key={`seg-${i}`}
            className={
              part.length <= MAX_NOWRAP_CHARS ? "whitespace-nowrap" : undefined
            }
          >
            {part}
          </span>
        ),
      )}
    </>
  );
}

const FONT_FAMILIES: Record<string, string> = {
  default: "",
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
  heading: "font-heading",
  "heading-italic": "font-heading italic",
};

// Khoảng cách phụ đề ↔ tiêu đề (thêm margin-top). "default" giữ nguyên như cũ.
const SUBTITLE_GAP: Record<string, string> = {
  default: "",
  sm: "mt-2",
  md: "mt-5",
  lg: "mt-10",
  xl: "mt-16",
};
// Bề rộng tối đa của phụ đề — càng rộng chữ càng dàn trải.
const SUBTITLE_WIDTH: Record<string, string> = {
  narrow: "max-w-2xl",
  normal: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
};

function HeroFullScreenClient({
  slides,
  tagline,
  taglineColor,
  taglineSize,
  taglineFont,
  taglineClassName,
  taglineStyle,
  overlayOpacity,
  height,
  showScrollIndicator,
  subtitleGap,
  subtitleWidth,
  isEditing,
}: {
  slides: HeroSlide[];
  tagline: LocalizedString;
  taglineColor: string;
  taglineSize: string;
  taglineFont: string;
  taglineClassName?: string;
  taglineStyle?: Record<string, string | number>;
  overlayOpacity: string;
  height: string;
  showScrollIndicator: boolean;
  subtitleGap?: string;
  subtitleWidth?: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const count = slides?.length || 0;

  useEffect(() => {
    if (isEditing || count <= 1) return;
    const id = setInterval(() => {
      setDirection(1);
      setCurrent((p) => {
        setPrev(p);
        return (p + 1) % count;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [count, isEditing]);

  useEffect(() => {
    if (prev === null) return;
    const timer = setTimeout(() => setPrev(null), 900);
    return () => clearTimeout(timer);
  }, [prev]);

  const heights: Record<string, string> = {
    md: "min-h-[60vh]",
    lg: "min-h-[75vh]",
    xl: "min-h-[85vh]",
    full: "min-h-screen",
    "16:9": "aspect-[16/9]",
  };

  const opacities: Record<string, string> = {
    light: "bg-black/20",
    medium: "bg-black/40",
    dark: "bg-black/60",
  };

  const slide = slides?.[current];

  const goTo = (i: number) => {
    if (i === current || prev !== null) return;
    setDirection(i > current ? 1 : -1);
    setPrev(current);
    setCurrent(i);
  };

  const getSlideAnimation = (i: number) => {
    if (prev === null) return undefined;
    const forward = direction > 0;
    if (i === current) {
      return forward
        ? "heroSlideInFromRight 0.8s cubic-bezier(0.4,0,0.2,1) both"
        : "heroSlideInFromLeft 0.8s cubic-bezier(0.4,0,0.2,1) both";
    }
    if (i === prev) {
      return forward
        ? "heroSlideOutToLeft 0.8s cubic-bezier(0.4,0,0.2,1) both"
        : "heroSlideOutToRight 0.8s cubic-bezier(0.4,0,0.2,1) both";
    }
    return undefined;
  };

  return (
    <div
      className={`relative w-full ${heights[height] || "min-h-screen"} overflow-hidden`}
    >
      {slides?.map((s: HeroSlide, i: number) => {
        const isActive = i === current;
        const isPrev = i === prev;
        const visible = isActive || isPrev;
        const anim = getSlideAnimation(i);
        return (
          <div
            key={`slide-${i}-${current}-${prev ?? "idle"}`}
            className="absolute inset-0"
            style={{
              visibility: visible ? "visible" : "hidden",
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
              animation: anim,
            }}
          >
            {s.src ? (
              <Image
                src={resolveOptimizerSrc(s.src)}
                alt={s.alt}
                fill
                sizes="100vw"
                priority={isActive}
                fetchPriority={isActive ? "high" : undefined}
                loading={isActive ? undefined : "lazy"}
                quality={65}
                className="object-cover animate-[slowZoom_20s_ease_infinite_alternate]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
            )}
          </div>
        );
      })}
      <div
        className={`absolute inset-0 z-[3] ${opacities[overlayOpacity] || "bg-black/40"}`}
      />
      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 py-32 gap-4">
        <HeroFullScreenText
          slide={slide}
          tagline={tagline}
          taglineColor={taglineColor}
          taglineSize={taglineSize}
          taglineFont={taglineFont}
          taglineClassName={taglineClassName}
          taglineStyle={taglineStyle}
          subtitleGap={subtitleGap}
          subtitleWidth={subtitleWidth}
          current={current}
          isEditing={isEditing}
          locale={locale}
        />
      </div>
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_: any, i: number) => (
            <button
              type="button"
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Chuyển đến ảnh ${i + 1}`}
              aria-current={i === current}
              className="h-6 min-w-6 flex items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-white dark:bg-[#1a2436] w-8" : "w-2.5 bg-white dark:bg-[#1a2436]/40 hover:bg-white/70"}`}
              />
            </button>
          ))}
        </div>
      )}
      {showScrollIndicator && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
          <ChevronDown className="w-8 h-8 text-white/60" />
        </div>
      )}
    </div>
  );
}

function HeroFullScreenText({
  slide,
  tagline,
  taglineColor,
  taglineSize,
  taglineFont,
  taglineClassName,
  taglineStyle,
  subtitleGap,
  subtitleWidth,
  current,
  isEditing,
  locale,
}: {
  slide: HeroSlide | undefined;
  tagline: LocalizedString;
  taglineColor: string;
  taglineSize: string;
  taglineFont: string;
  taglineClassName?: string;
  taglineStyle?: Record<string, string | number>;
  subtitleGap?: string;
  subtitleWidth?: string;
  current: number;
  isEditing: boolean;
  locale: string;
}) {
  // Thứ tự ưu tiên: slide tắt hẳn -> khẩu hiệu riêng của slide -> khẩu hiệu chung.
  const taglineText = slide?.hideTagline
    ? ""
    : t(slide?.tagline, locale) || t(tagline, locale);
  const headline = t(slide?.headline, locale);
  const subtitle = t(slide?.subtitle, locale);
  const ctaLabel = t(slide?.ctaLabel, locale);

  // Tách theo dấu phân cách để KHÔNG cắt đôi cụm từ khi xuống dòng trên điện
  // thoại ("… • CỐNG / HIẾN", "… - Vật / lý kỹ thuật").
  const taglineParts = splitPhrases(taglineText);
  const headlineParts = splitPhrases(headline);

  return (
    <>
      {taglineText && (
        <p
          className={`inline-block max-w-[calc(100vw-2rem)] uppercase tracking-[0.08em] md:tracking-[0.3em] font-bold px-3 py-1.5 md:px-5 md:py-2 rounded-full backdrop-blur-sm border border-white/30 animate-[fadeInUp_1s_ease_0.6s_both] ${TAGLINE_SIZES[taglineSize] || TAGLINE_SIZES.sm} ${FONT_FAMILIES[taglineFont] || ""} ${taglineClassName || ""}`}
          style={{
            color: taglineColor || "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            textShadow: "0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)",
            ...(taglineStyle || {}),
          }}
        >
          {taglineParts.length ? (
            <PhraseParts parts={taglineParts} />
          ) : (
            taglineText
          )}
        </p>
      )}
      {headline && (
        <h1
          key={`h-${current}`}
          // [text-wrap:balance]: chia đều độ dài các dòng thay vì nhồi đầy dòng
          // trên rồi bỏ một chữ lẻ xuống dưới ("… - Vật / lý kỹ thuật").
          className={
            "font-black text-white mb-3 animate-[fadeInUp_0.8s_ease] leading-[1.05] max-w-full break-words [text-wrap:balance] font-heading italic " +
            (headline.length <= MAX_ONE_LINE_HEADLINE
              ? "md:[text-wrap:normal] md:whitespace-nowrap"
              : "")
          }
          style={{
            // Cỡ tối thiểu nhỏ hơn một nhịp để tên khoa dài vẫn vừa màn hình hẹp.
            fontSize: "clamp(1.75rem, 7vw, 6.5rem)",
            textShadow: "0 4px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
            WebkitTextStroke: "0.5px rgba(0,0,0,0.2)",
          }}
        >
          {headlineParts.length ? (
            <PhraseParts parts={headlineParts} />
          ) : (
            headline
          )}
        </h1>
      )}
      {subtitle && (
        <p
          key={`s-${current}`}
          className={`text-base sm:text-lg md:text-2xl font-semibold text-white mb-6 break-words px-2 animate-[fadeInUp_0.8s_ease_0.2s_both] ${SUBTITLE_WIDTH[subtitleWidth || "narrow"] || "max-w-2xl"} ${SUBTITLE_GAP[subtitleGap || "default"] || ""}`}
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          {subtitle}
        </p>
      )}
      {ctaLabel && (
        <a
          key={`c-${current}`}
          href={isEditing ? "#" : withLocalePrefix(slide?.ctaUrl, locale)}
          tabIndex={isEditing ? -1 : undefined}
          className="px-8 py-3 bg-white dark:bg-[#1a2436] text-slate-900 dark:text-slate-100 font-semibold rounded-full hover:bg-white/90 transition-all animate-[fadeInUp_0.8s_ease_0.4s_both] text-sm uppercase tracking-wider"
        >
          {ctaLabel}
        </a>
      )}
    </>
  );
}

export const TEXT_SIZE_OPTIONS = [
  { label: "XS", value: "xs" },
  { label: "S", value: "sm" },
  { label: "M", value: "md" },
  { label: "L", value: "lg" },
  { label: "XL", value: "xl" },
];

export const FONT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Sans", value: "sans" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "mono" },
  { label: "Heading", value: "heading" },
  { label: "Heading italic", value: "heading-italic" },
];

export const HeroFullScreen: ComponentConfig<{
  slides: HeroSlide[];
  tagline: LocalizedString;
  taglineColor: string;
  taglineSize: string;
  taglineFont: string;
  taglineClassName: string;
  overlayOpacity: string;
  height: string;
  showScrollIndicator: boolean;
  subtitleGap: string;
  subtitleWidth: string;
}> = {
  label: "Hero Full Screen",
  defaultProps: {
    slides: [
      {
        src: "",
        alt: "Slide 1",
        tagline: { vi: "", en: "" },
        hideTagline: false,
        headline: {
          vi: "Khoa Vật lý - Vật lý kỹ thuật",
          en: "Faculty of Physics - Engineering Physics",
        },
        subtitle: {
          vi: "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
          en: "University of Science - VNUHCM",
        },
        ctaLabel: { vi: "Khám phá", en: "Discover" },
        ctaUrl: "/gioi-thieu",
      },
    ],
    tagline: {
      vi: "KHÁM PHÁ • SÁNG TẠO • CỐNG HIẾN",
      en: "EXPLORE • INNOVATE • CONTRIBUTE",
    },
    taglineColor: "#ffffff",
    taglineSize: "sm",
    taglineFont: "default",
    taglineClassName: "",
    overlayOpacity: "medium",
    height: "full",
    showScrollIndicator: true,
    subtitleGap: "default",
    subtitleWidth: "narrow",
  },
  fields: {
    slides: {
      type: "array",
      label: "Slides",
      getItemSummary: (item, i) =>
        localizedSummary(item.headline, item.alt || `Slide ${(i ?? 0) + 1}`),
      arrayFields: {
        src: mediaPickerField("Image"),
        alt: { type: "text", label: "Alt Text" },
        tagline: localizedTextField(
          "Khẩu hiệu riêng của slide (trống = dùng khẩu hiệu chung)",
        ),
        hideTagline: {
          type: "radio",
          label: "Ẩn khẩu hiệu ở slide này",
          options: [
            { label: "Không", value: false },
            { label: "Có", value: true },
          ],
        },
        headline: localizedTextField("Headline"),
        subtitle: localizedTextField("Subtitle"),
        ctaLabel: localizedTextField("CTA Label"),
        ctaUrl: { type: "text", label: "CTA URL" },
      },
    },
    tagline: localizedTextField("Khẩu hiệu chung (mặc định cho mọi slide)"),
    taglineColor: colorField("Tagline Color"),
    taglineSize: {
      type: "select",
      label: "Tagline Size",
      options: TEXT_SIZE_OPTIONS,
    },
    taglineFont: {
      type: "select",
      label: "Tagline Font",
      options: FONT_OPTIONS,
    },
    taglineClassName: {
      type: "text",
      label: "Tagline class (advanced)",
    },
    overlayOpacity: {
      type: "select",
      label: "Overlay Opacity",
      options: [
        { label: "Light", value: "light" },
        { label: "Medium", value: "medium" },
        { label: "Dark", value: "dark" },
      ],
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Medium (60vh)", value: "md" },
        { label: "Large (75vh)", value: "lg" },
        { label: "XL (85vh)", value: "xl" },
        { label: "Full Screen", value: "full" },
        { label: "16:9 (khung hình)", value: "16:9" },
      ],
    },
    showScrollIndicator: {
      type: "radio",
      label: "Show Scroll Indicator",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    subtitleGap: {
      type: "select",
      label: "Phụ đề — khoảng cách với tiêu đề",
      options: [
        { label: "Mặc định (sát)", value: "default" },
        { label: "Nhỏ", value: "sm" },
        { label: "Vừa", value: "md" },
        { label: "Lớn", value: "lg" },
        { label: "Rất lớn", value: "xl" },
      ],
    },
    subtitleWidth: {
      type: "select",
      label: "Phụ đề — bề rộng (dàn trải chữ)",
      options: [
        { label: "Hẹp", value: "narrow" },
        { label: "Vừa", value: "normal" },
        { label: "Rộng", value: "wide" },
        { label: "Toàn bộ", value: "full" },
      ],
    },
  },
  render: ({
    slides,
    tagline,
    taglineColor,
    taglineSize,
    taglineFont,
    taglineClassName,
    overlayOpacity,
    height,
    showScrollIndicator,
    puck,
    ...rest
  }: any) => (
    <HeroFullScreenClient
      slides={slides}
      tagline={tagline}
      taglineColor={taglineColor}
      taglineSize={taglineSize}
      taglineFont={taglineFont}
      taglineClassName={taglineClassName}
      taglineStyle={rest.taglineStyle}
      overlayOpacity={overlayOpacity}
      height={height}
      showScrollIndicator={showScrollIndicator}
      subtitleGap={rest.subtitleGap}
      subtitleWidth={rest.subtitleWidth}
      isEditing={!!puck?.isEditing}
    />
  ),
};

type StatItem = { value: number; suffix: string; label: LocalizedString };

function StatsCounterClient({
  stats,
  isEditing,
  textStyle,
}: {
  stats: StatItem[];
  isEditing: boolean;
  textStyle?: TextStyle;
}) {
  const { locale } = useLocale();
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>((stats || []).map(() => 0));
  const ref = { current: null as HTMLDivElement | null };

  useEffect(() => {
    if (isEditing) {
      setCounts((stats || []).map((s: { value: number }) => s.value));
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
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isEditing, stats, ref.current]);

  useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCounts(
        (stats || []).map((s: { value: number }) =>
          Math.round(s.value * eased),
        ),
      );
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [visible, stats]);

  return (
    <div
      ref={(el) => {
        ref.current = el;
      }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4"
    >
      {(stats || []).map((stat: StatItem, i: number) => (
        <div key={i} className="text-center">
          <div
            className="text-4xl md:text-5xl font-bold text-blue-800 mb-2"
            style={resolveTextStyle(textStyle)}
          >
            {counts[i] || 0}
            {stat.suffix}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {t(stat.label, locale)}
          </div>
        </div>
      ))}
    </div>
  );
}

export const StatsCounter: ComponentConfig<{
  stats: StatItem[];
  bgColor: string;
  textStyle?: TextStyle;
}> = {
  label: "Stats Counter",
  defaultProps: {
    stats: [
      {
        value: 50,
        suffix: "+",
        label: { vi: "Năm thành lập", en: "Years established" },
      },
      {
        value: 120,
        suffix: "+",
        label: { vi: "Giảng viên", en: "Faculty" },
      },
      {
        value: 3000,
        suffix: "+",
        label: { vi: "Sinh viên", en: "Students" },
      },
      {
        value: 500,
        suffix: "+",
        label: { vi: "Công bố quốc tế", en: "International publications" },
      },
    ],
    bgColor: "#f8fafc",
  },
  fields: {
    stats: {
      type: "array",
      label: "Stats",
      getItemSummary: (item, i) =>
        localizedSummary(
          item.label,
          item.value != null
            ? `${item.value}${item.suffix || ""}`
            : `Stat ${(i ?? 0) + 1}`,
        ),
      arrayFields: {
        value: { type: "number", label: "Value" },
        suffix: { type: "text", label: "Suffix (+, %, etc.)" },
        label: localizedTextField("Label"),
      },
    },
    bgColor: colorField("Background Color"),
    textStyle: textStyleField,
  },
  render: ({ stats, bgColor, puck, textStyle }) => (
    <div
      className="py-16 px-6"
      style={{ backgroundColor: bgColor || "#f8fafc" }}
    >
      <div className="max-w-5xl mx-auto">
        <StatsCounterClient
          stats={stats}
          isEditing={!!puck?.isEditing}
          textStyle={textStyle}
        />
      </div>
    </div>
  ),
};
