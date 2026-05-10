"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { t, type LocalizedString } from "@/lib/i18n";
import { colorField } from "../fields/color-field";
import { mediaPickerField } from "../fields/media-picker-field";
import { localizedTextField } from "../fields/localized-text-field";

type HeroSlide = {
  src: string;
  alt: string;
  headline: LocalizedString;
  subtitle: LocalizedString;
  ctaLabel: LocalizedString;
  ctaUrl: string;
};

const TAGLINE_SIZES: Record<string, string> = {
  xs: "text-xs md:text-sm",
  sm: "text-sm md:text-base",
  md: "text-base md:text-lg",
  lg: "text-lg md:text-xl",
  xl: "text-xl md:text-2xl",
};

const FONT_FAMILIES: Record<string, string> = {
  default: "",
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
  heading: "font-heading",
  "heading-italic": "font-heading italic",
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
              <img
                src={s.src}
                alt={s.alt}
                className="w-full h-full object-cover animate-[slowZoom_20s_ease_infinite_alternate]"
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
          current={current}
          isEditing={isEditing}
          locale={locale}
        />
      </div>
      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_: any, i: number) => (
            <button
              type="button"
              key={i}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-white w-8" : "bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
      {showScrollIndicator && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
          <span className="material-symbols-outlined text-white/60 text-3xl">
            keyboard_arrow_down
          </span>
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
  current: number;
  isEditing: boolean;
  locale: string;
}) {
  const taglineText = t(tagline, locale);
  const headline = t(slide?.headline, locale);
  const subtitle = t(slide?.subtitle, locale);
  const ctaLabel = t(slide?.ctaLabel, locale);

  return (
    <>
      {taglineText && (
        <p
          className={`inline-block uppercase tracking-[0.3em] font-bold px-5 py-2 rounded-full backdrop-blur-sm border border-white/30 animate-[fadeInUp_1s_ease_0.6s_both] ${TAGLINE_SIZES[taglineSize] || TAGLINE_SIZES.sm} ${FONT_FAMILIES[taglineFont] || ""} ${taglineClassName || ""}`}
          style={{
            color: taglineColor || "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            textShadow:
              "0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)",
            ...(taglineStyle || {}),
          }}
        >
          {taglineText}
        </p>
      )}
      {headline && (
        <h1
          key={`h-${current}`}
          className="font-black text-white mb-3 animate-[fadeInUp_0.8s_ease] leading-[1.05] max-w-none whitespace-nowrap font-heading italic"
          style={{
            fontSize: "clamp(2rem, 7vw, 6.5rem)",
            textShadow:
              "0 4px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
            WebkitTextStroke: "0.5px rgba(0,0,0,0.2)",
          }}
        >
          {headline}
        </h1>
      )}
      {subtitle && (
        <p
          key={`s-${current}`}
          className="text-xl md:text-2xl font-semibold text-white mb-6 animate-[fadeInUp_0.8s_ease_0.2s_both] max-w-2xl"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          {subtitle}
        </p>
      )}
      {ctaLabel && (
        <a
          key={`c-${current}`}
          href={isEditing ? "#" : slide?.ctaUrl || "#"}
          tabIndex={isEditing ? -1 : undefined}
          className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-full hover:bg-white/90 transition-all animate-[fadeInUp_0.8s_ease_0.4s_both] text-sm uppercase tracking-wider"
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
}> = {
  label: "Hero Full Screen",
  defaultProps: {
    slides: [
      {
        src: "",
        alt: "Slide 1",
        headline: {
          vi: "Khoa Vật lý - Vật lý Kỹ thuật",
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
  },
  fields: {
    slides: {
      type: "array",
      label: "Slides",
      arrayFields: {
        src: mediaPickerField("Image"),
        alt: { type: "text", label: "Alt Text" },
        headline: localizedTextField("Headline"),
        subtitle: localizedTextField("Subtitle"),
        ctaLabel: localizedTextField("CTA Label"),
        ctaUrl: { type: "text", label: "CTA URL" },
      },
    },
    tagline: localizedTextField("Tagline"),
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
      isEditing={!!puck?.isEditing}
    />
  ),
};

type StatItem = { value: number; suffix: string; label: LocalizedString };

function StatsCounterClient({
  stats,
  isEditing,
}: {
  stats: StatItem[];
  isEditing: boolean;
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
          <div className="text-4xl md:text-5xl font-bold text-blue-800 mb-2">
            {counts[i] || 0}
            {stat.suffix}
          </div>
          <div className="text-sm text-slate-600 uppercase tracking-wider">
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
      arrayFields: {
        value: { type: "number", label: "Value" },
        suffix: { type: "text", label: "Suffix (+, %, etc.)" },
        label: localizedTextField("Label"),
      },
    },
    bgColor: colorField("Background Color"),
  },
  render: ({ stats, bgColor, puck }) => (
    <div
      className="py-16 px-6"
      style={{ backgroundColor: bgColor || "#f8fafc" }}
    >
      <div className="max-w-5xl mx-auto">
        <StatsCounterClient stats={stats} isEditing={!!puck?.isEditing} />
      </div>
    </div>
  ),
};
