"use client";

import { useState, useEffect, useRef } from "react";
import type { ComponentConfig } from "@puckeditor/core";

function HeroFullScreenClient({
  slides,
  tagline,
  taglineColor,
  overlayOpacity,
  height,
  showScrollIndicator,
  isEditing,
}: {
  slides: {
    src: string;
    alt: string;
    headline: string;
    subtitle: string;
    ctaLabel: string;
    ctaUrl: string;
  }[];
  tagline: string;
  taglineColor: string;
  overlayOpacity: string;
  height: string;
  showScrollIndicator: boolean;
  isEditing: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const dirRef = useRef(1);
  const count = slides?.length || 0;

  useEffect(() => {
    if (isEditing || count <= 1) return;
    const id = setInterval(() => {
      dirRef.current = 1;
      setPrev((c) => c);
      setCurrent((p) => {
        setPrev(p);
        return (p + 1) % count;
      });
      setAnimating(true);
    }, 6000);
    return () => clearInterval(id);
  }, [count, isEditing]);

  useEffect(() => {
    if (!animating) return;
    const timer = setTimeout(() => {
      setAnimating(false);
      setPrev(null);
    }, 800);
    return () => clearTimeout(timer);
  }, [animating, current]);

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
    if (i === current || animating) return;
    dirRef.current = i > current ? 1 : -1;
    setPrev(current);
    setCurrent(i);
    setAnimating(true);
  };

  const getSlideAnimation = (i: number) => {
    const forward = dirRef.current > 0;
    if (i === current && animating) {
      return forward
        ? "heroSlideInFromRight 0.8s cubic-bezier(0.4,0,0.2,1) both"
        : "heroSlideInFromLeft 0.8s cubic-bezier(0.4,0,0.2,1) both";
    }
    if (i === prev && animating) {
      return forward
        ? "heroSlideOutToLeft 0.8s cubic-bezier(0.4,0,0.2,1) both"
        : "heroSlideOutToRight 0.8s cubic-bezier(0.4,0,0.2,1) both";
    }
    return "none";
  };

  return (
    <div
      className={`relative w-full ${heights[height] || "min-h-screen"} overflow-hidden`}
    >
      {slides?.map(
        (
          s: {
            src: string;
            alt: string;
            headline: string;
            subtitle: string;
            ctaLabel: string;
            ctaUrl: string;
          },
          i: number,
        ) => {
          const isActive = i === current;
          const isPrev = i === prev && animating;
          const visible = isActive || isPrev;
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                visibility: visible ? "visible" : "hidden",
                zIndex: isActive ? 2 : isPrev ? 1 : 0,
                animation: getSlideAnimation(i),
              }}
            >
              {s.src ? (
                <img
                  src={s.src}
                  alt={s.alt}
                  className="w-full h-full object-cover scale-105 animate-[slowZoom_20s_ease_infinite_alternate]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
              )}
            </div>
          );
        },
      )}
      <div
        className={`absolute inset-0 z-[3] ${opacities[overlayOpacity] || "bg-black/40"}`}
      />
      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 py-32 gap-4">
        {tagline && (
          <p
            className="text-xs md:text-sm uppercase tracking-[0.3em] font-medium animate-[fadeInUp_1s_ease_0.6s_both]"
            style={{ color: taglineColor || "#ffffff" }}
          >
            {tagline}
          </p>
        )}
        {slide?.headline && (
          <h1
            key={"h-" + current}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-2 animate-[fadeInUp_0.8s_ease] leading-tight max-w-4xl font-heading italic"
          >
            {slide.headline}
          </h1>
        )}
        {slide?.subtitle && (
          <p
            key={"s-" + current}
            className="text-lg md:text-xl text-white/80 mb-6 animate-[fadeInUp_0.8s_ease_0.2s_both] max-w-2xl"
          >
            {slide.subtitle}
          </p>
        )}
        {slide?.ctaLabel && (
          <a
            key={"c-" + current}
            href={isEditing ? "#" : slide.ctaUrl || "#"}
            tabIndex={isEditing ? -1 : undefined}
            className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-full hover:bg-white/90 transition-all animate-[fadeInUp_0.8s_ease_0.4s_both] text-sm uppercase tracking-wider"
          >
            {slide.ctaLabel}
          </a>
        )}
      </div>
      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_: any, i: number) => (
            <button
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

export const HeroFullScreen: ComponentConfig<{
  slides: {
    src: string;
    alt: string;
    headline: string;
    subtitle: string;
    ctaLabel: string;
    ctaUrl: string;
  }[];
  tagline: string;
  taglineColor: string;
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
        headline: "Khoa Vật lý - Vật lý Kỹ thuật",
        subtitle: "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
        ctaLabel: "Khám phá",
        ctaUrl: "/gioi-thieu",
      },
    ],
    tagline: "KHÁM PHÁ • SÁNG TẠO • CỐNG HIẾN",
    taglineColor: "#ffffff",
    overlayOpacity: "medium",
    height: "full",
    showScrollIndicator: true,
  },
  fields: {
    slides: {
      type: "array",
      label: "Slides",
      arrayFields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        headline: { type: "text", label: "Headline" },
        subtitle: { type: "text", label: "Subtitle" },
        ctaLabel: { type: "text", label: "CTA Label" },
        ctaUrl: { type: "text", label: "CTA URL" },
      },
    },
    tagline: { type: "text", label: "Tagline" },
    taglineColor: { type: "text", label: "Tagline Color" },
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
    overlayOpacity,
    height,
    showScrollIndicator,
    puck,
  }) => (
    <HeroFullScreenClient
      slides={slides}
      tagline={tagline}
      taglineColor={taglineColor}
      overlayOpacity={overlayOpacity}
      height={height}
      showScrollIndicator={showScrollIndicator}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function StatsCounterClient({
  stats,
  isEditing,
}: {
  stats: { value: number; suffix: string; label: string }[];
  isEditing: boolean;
}) {
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
  }, [isEditing, stats]);

  useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
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
      {(stats || []).map(
        (stat: { value: number; suffix: string; label: string }, i: number) => (
          <div key={i} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-blue-800 mb-2">
              {counts[i] || 0}
              {stat.suffix}
            </div>
            <div className="text-sm text-slate-600 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export const StatsCounter: ComponentConfig<{
  stats: { value: number; suffix: string; label: string }[];
  bgColor: string;
}> = {
  label: "Stats Counter",
  defaultProps: {
    stats: [
      { value: 50, suffix: "+", label: "Năm thành lập" },
      { value: 120, suffix: "+", label: "Giảng viên" },
      { value: 3000, suffix: "+", label: "Sinh viên" },
      { value: 500, suffix: "+", label: "Công bố quốc tế" },
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
        label: { type: "text", label: "Label" },
      },
    },
    bgColor: { type: "text", label: "Background Color" },
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
