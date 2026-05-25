"use client";

import type { ComponentConfig } from "@puckeditor/core";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Images,
  Map,
  PlayCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { colorField } from "../fields/color-field";
import {
  localizedTextareaField,
  localizedTextField,
} from "../fields/localized-text-field";
import { mediaPickerField } from "../fields/media-picker-field";

export const ImageBlock: ComponentConfig<{
  src: string;
  alt: string;
  caption: LocalizedString;
  fit: string;
  borderRadius: string;
}> = {
  label: "Image",
  defaultProps: {
    src: "",
    alt: "",
    caption: { vi: "", en: "" },
    fit: "cover",
    borderRadius: "md",
  },
  fields: {
    src: mediaPickerField("Image"),
    alt: { type: "text", label: "Alt Text" },
    caption: localizedTextField("Caption"),
    fit: {
      type: "select",
      label: "Fit",
      options: [
        { label: "Cover", value: "cover" },
        { label: "Contain", value: "contain" },
        { label: "Fill", value: "fill" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Full", value: "full" },
      ],
    },
  },
  render: ({ src, alt, caption, fit, borderRadius }) => (
    <ImageBlockRender
      src={src}
      alt={alt}
      caption={caption}
      fit={fit}
      borderRadius={borderRadius}
    />
  ),
};

function ImageBlockRender({
  src,
  alt,
  caption,
  fit,
  borderRadius,
}: {
  src: string;
  alt: string;
  caption: LocalizedString;
  fit: string;
  borderRadius: string;
}) {
  const { locale } = useLocale();
  const captionText = t(caption, locale);
  const radii: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  return (
    <div>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full ${radii[borderRadius] || "rounded-md"}`}
          style={{ objectFit: (fit as any) || "cover" }}
          loading="lazy"
        decoding="async"
        />
      ) : (
        <div
          className={`w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center ${radii[borderRadius] || "rounded-md"}`}
        >
          <ImageIcon className="w-9 h-9 text-slate-300" />
        </div>
      )}
      {captionText && (
        <p className="text-sm text-slate-500 text-center mt-2">{captionText}</p>
      )}
    </div>
  );
}

export const ImageGallery: ComponentConfig<{
  images: { src: string; alt: string }[];
  columns: string;
  gap: string;
}> = {
  label: "Image Gallery",
  defaultProps: { images: [], columns: "3", gap: "md" },
  fields: {
    images: {
      type: "array",
      label: "Images",
      arrayFields: {
        src: mediaPickerField("Image"),
        alt: { type: "text", label: "Alt Text" },
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  render: ({ images, columns, gap }) => {
    const cols = parseInt(columns, 10) || 3;
    const gaps: Record<string, string> = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };
    if (!images || images.length === 0) {
      return (
        <div
          className={`grid ${gaps[gap] || "gap-4"}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center"
            >
              <ImageIcon className="w-6 h-6 text-slate-300" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div
        className={`grid ${gaps[gap] || "gap-4"}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {images.map((img: { src: string; alt: string }, i: number) => (
          <div key={i}>
            {img.src ? (
              <img
                src={img.src}
                alt={img.alt || ""}
                className="w-full aspect-square object-cover rounded-md"
                loading="lazy"
              decoding="async"
              />
            ) : (
              <div className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  },
};

export const VideoEmbed: ComponentConfig<{
  videoUrl: string;
  title: string;
  aspectRatio: string;
}> = {
  label: "Video",
  defaultProps: { videoUrl: "", title: "", aspectRatio: "16:9" },
  fields: {
    videoUrl: { type: "text", label: "Video URL (YouTube/Vimeo)" },
    title: { type: "text", label: "Title" },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
      ],
    },
  },
  render: ({ videoUrl, title, aspectRatio }) => {
    const ratio = aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-video";
    return (
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
        )}
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className={`w-full ${ratio} rounded-lg`}
            allowFullScreen
          />
        ) : (
          <div
            className={`w-full ${ratio} rounded-lg bg-slate-900 flex items-center justify-center`}
          >
            <PlayCircle className="w-12 h-12 text-white/30" />
          </div>
        )}
      </div>
    );
  },
};

export const MapEmbed: ComponentConfig<{
  src: string;
  height: string;
  rounded: boolean;
}> = {
  label: "Map (Google Maps embed)",
  defaultProps: {
    src: "https://maps.google.com/maps?q=227+Nguyen+Van+Cu,+District+5,+Ho+Chi+Minh+City,+Vietnam&hl=en&z=15&output=embed",
    height: "240",
    rounded: true,
  },
  fields: {
    src: {
      type: "text",
      label: "Embed URL (output=embed from Google Maps)",
    },
    height: { type: "text", label: "Height (px)" },
    rounded: {
      type: "radio",
      label: "Rounded corners",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  render: ({ src, height, rounded }) => {
    if (!src)
      return (
        <div className="w-full h-40 bg-slate-100 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center">
          <Map className="w-8 h-8 text-slate-300" />
        </div>
      );
    return (
      <iframe
        src={src}
        title="Map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={`w-full border-0 ${rounded ? "rounded-lg" : ""}`}
        style={{ height: `${height || 240}px` }}
      />
    );
  },
};

type ImageSliderSlide = {
  src: string;
  alt: string;
  caption: LocalizedString;
  linkUrl: string;
};

const SLIDER_DETAILS_LABEL = { vi: "Chi tiết", en: "Details" };

function ImageSliderClient({
  slides,
  autoplay,
  intervalMs,
  h,
  r,
  showDots,
  showArrows,
  isEditing,
}: {
  slides: ImageSliderSlide[];
  autoplay: boolean;
  intervalMs: number;
  h: string;
  r: string;
  showDots: boolean;
  showArrows: boolean;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const [current, setCurrent] = useState(0);
  const count = slides.length || 1;

  useEffect(() => {
    if (!autoplay || isEditing || count <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, intervalMs, count, isEditing]);

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  if (count === 0) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-200 flex items-center justify-center ${r}`}
        style={{ height: h }}
      >
        <Images className="w-12 h-12 text-slate-400" />
      </div>
    );
  }

  const slide = slides[current] || slides[0];
  const captionText = t(slide?.caption, locale);

  return (
    <div className={`relative overflow-hidden ${r}`} style={{ height: h }}>
      {slide?.src ? (
        <img
          src={slide.src}
          alt={slide.alt || ""}
          className="w-full h-full object-cover transition-opacity duration-500"
          loading="lazy"
        decoding="async"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-800 flex items-center justify-center">
          <div className="text-center text-white">
            <Images className="w-12 h-12 mb-2 mx-auto block opacity-50" />
            <p className="text-lg font-semibold opacity-80">
              {captionText || `Slide ${current + 1}`}
            </p>
          </div>
        </div>
      )}
      {captionText && slide?.src && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <p className="text-white text-xl font-bold drop-shadow-lg">
            {captionText}
          </p>
          {slide.linkUrl && (
            <a
              href={isEditing ? "#" : slide.linkUrl}
              tabIndex={isEditing ? -1 : undefined}
              className="inline-block mt-2 px-4 py-1.5 text-sm text-white bg-white/20 rounded-md border border-white/30 hover:bg-white/30 transition-colors"
            >
              {t(SLIDER_DETAILS_LABEL, locale)}
            </a>
          )}
        </div>
      )}
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      {showDots && count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const ImageSlider: ComponentConfig<{
  slides: ImageSliderSlide[];
  autoplay: boolean;
  intervalMs: number;
  height: string;
  showDots: boolean;
  showArrows: boolean;
  borderRadius: string;
}> = {
  label: "Image Slider",
  defaultProps: {
    slides: [
      {
        src: "",
        alt: "Slide 1",
        caption: { vi: "Slide 1", en: "Slide 1" },
        linkUrl: "",
      },
      {
        src: "",
        alt: "Slide 2",
        caption: { vi: "Slide 2", en: "Slide 2" },
        linkUrl: "",
      },
      {
        src: "",
        alt: "Slide 3",
        caption: { vi: "Slide 3", en: "Slide 3" },
        linkUrl: "",
      },
    ],
    autoplay: true,
    intervalMs: 5000,
    height: "lg",
    showDots: true,
    showArrows: true,
    borderRadius: "none",
  },
  fields: {
    slides: {
      type: "array",
      label: "Slides",
      arrayFields: {
        src: mediaPickerField("Image"),
        alt: { type: "text", label: "Alt Text" },
        caption: localizedTextField("Caption"),
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    autoplay: {
      type: "radio",
      label: "Autoplay",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    intervalMs: {
      type: "number",
      label: "Interval (ms)",
      min: 1000,
      max: 15000,
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Small (200px)", value: "sm" },
        { label: "Medium (320px)", value: "md" },
        { label: "Large (450px)", value: "lg" },
        { label: "XL (600px)", value: "xl" },
      ],
    },
    showDots: {
      type: "radio",
      label: "Show Dots",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showArrows: {
      type: "radio",
      label: "Show Arrows",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  render: (props) => {
    const {
      slides,
      autoplay,
      intervalMs,
      height,
      showDots,
      showArrows,
      borderRadius,
      puck,
    } = props;
    const heights: Record<string, string> = {
      sm: "200px",
      md: "320px",
      lg: "450px",
      xl: "600px",
    };
    const radii: Record<string, string> = {
      none: "",
      md: "rounded-md",
      lg: "rounded-lg",
    };
    return (
      <ImageSliderClient
        slides={slides || []}
        autoplay={!!autoplay}
        intervalMs={intervalMs || 5000}
        h={heights[height] || "450px"}
        r={radii[borderRadius] || ""}
        showDots={showDots !== false}
        showArrows={showArrows !== false}
        isEditing={!!puck?.isEditing}
      />
    );
  },
};

export const LogoGrid: ComponentConfig<{
  logos: { src: string; alt: string; linkUrl: string }[];
  columns: string;
  height: string;
}> = {
  label: "Logo Grid",
  defaultProps: {
    logos: [
      { src: "", alt: "Partner 1", linkUrl: "#" },
      { src: "", alt: "Partner 2", linkUrl: "#" },
      { src: "", alt: "Partner 3", linkUrl: "#" },
    ],
    columns: "6",
    height: "60",
  },
  fields: {
    logos: {
      type: "array",
      label: "Logos",
      arrayFields: {
        src: mediaPickerField("Logo"),
        alt: { type: "text", label: "Name" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: "5", value: "5" },
        { label: "6", value: "6" },
      ],
    },
    height: {
      type: "select",
      label: "Logo Height",
      options: [
        { label: "40px", value: "40" },
        { label: "60px", value: "60" },
        { label: "80px", value: "80" },
      ],
    },
  },
  render: ({ logos, columns, height, puck }) => {
    const cols = parseInt(columns, 10) || 6;
    const h = parseInt(height, 10) || 60;
    return (
      <div
        className="grid gap-6 items-center justify-items-center"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {(logos || []).map(
          (logo: { src: string; alt: string; linkUrl: string }, i: number) => (
            <a
              key={i}
              href={puck?.isEditing ? "#" : logo.linkUrl || "#"}
              tabIndex={puck?.isEditing ? -1 : undefined}
              className="block hover:opacity-70 transition-opacity"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.alt || ""}
                  style={{ height: `${h}px` }}
                  className="object-contain"
                  loading="lazy"
                decoding="async"
                />
              ) : (
                <div
                  className="bg-slate-100 rounded-md flex items-center justify-center px-4"
                  style={{ height: `${h}px`, minWidth: `${h * 1.5}px` }}
                >
                  <span className="text-xs text-slate-400 text-center">
                    {logo.alt || "Logo"}
                  </span>
                </div>
              )}
            </a>
          ),
        )}
      </div>
    );
  },
};

export const LogoSlider: ComponentConfig<{
  logos: { src: string; alt: string; linkUrl: string }[];
  bgImageUrl: string;
  title: LocalizedString;
  description: LocalizedString;
  logoSize: string;
}> = {
  label: "Logo Slider",
  defaultProps: {
    logos: [
      { src: "", alt: "Đại học Quốc Gia", linkUrl: "#" },
      { src: "", alt: "Đại học Sài Gòn", linkUrl: "#" },
      { src: "", alt: "Đại học Cần Thơ", linkUrl: "#" },
      { src: "", alt: "Đại học Kinh tế - Luật", linkUrl: "#" },
      { src: "", alt: "Đại học Bách Khoa", linkUrl: "#" },
    ],
    bgImageUrl: "",
    title: { vi: "Liên kết", en: "Affiliations" },
    description: { vi: "", en: "" },
    logoSize: "80",
  },
  fields: {
    logos: {
      type: "array",
      label: "Logos",
      arrayFields: {
        src: mediaPickerField("Logo"),
        alt: { type: "text", label: "Name" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    bgImageUrl: mediaPickerField("Background Image"),
    title: localizedTextField("Title"),
    description: localizedTextareaField("Description"),
    logoSize: {
      type: "select",
      label: "Logo Size",
      options: [
        { label: "60px", value: "60" },
        { label: "80px", value: "80" },
        { label: "100px", value: "100" },
      ],
    },
  },
  render: ({ logos, bgImageUrl, title, description, logoSize, puck }) => (
    <LogoSliderRender
      logos={logos || []}
      bgImageUrl={bgImageUrl}
      title={title}
      description={description}
      logoSize={logoSize}
      isEditing={!!puck?.isEditing}
    />
  ),
};

function LogoSliderRender({
  logos,
  bgImageUrl,
  title,
  description,
  logoSize,
  isEditing,
}: {
  logos: { src: string; alt: string; linkUrl: string }[];
  bgImageUrl: string;
  title: LocalizedString;
  description: LocalizedString;
  logoSize: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const titleText = t(title, locale);
  const descriptionText = t(description, locale);
  const size = parseInt(logoSize, 10) || 80;
  return (
    <div className="relative py-12 px-6 overflow-hidden">
      {bgImageUrl ? (
        <img
          src={bgImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200" />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center">
        {titleText && (
          <h2 className="text-2xl font-bold text-white mb-2">{titleText}</h2>
        )}
        {descriptionText && (
          <p className="text-sm text-white/80 mb-8 max-w-2xl mx-auto">
            {descriptionText}
          </p>
        )}
        <div className="flex items-center justify-around flex-wrap gap-y-6">
          {logos.map((logo, i) => (
            <a
              key={i}
              href={isEditing ? "#" : logo.linkUrl || "#"}
              tabIndex={isEditing ? -1 : undefined}
              className="flex flex-col items-center gap-3 group"
            >
              <div
                className="bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                style={{ width: `${size}px`, height: `${size}px` }}
              >
                {logo.src ? (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="object-contain rounded-full"
                    style={{
                      width: `${size * 0.7}px`,
                      height: `${size * 0.7}px`,
                    }}
                    loading="lazy"
                  decoding="async"
                  />
                ) : (
                  <span className="text-xs text-slate-400 text-center px-1 leading-tight">
                    {logo.alt}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-white mt-1 group-hover:underline">
                {logo.alt}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

type PartnerItem = {
  name: string;
  logoUrl: string;
  description?: string;
  linkUrl: string;
};

function PartnerShowcaseClient({
  partners,
  title,
  bgColor,
  textColor,
  speed,
  isEditing,
}: {
  partners: PartnerItem[];
  title: LocalizedString;
  bgColor: string;
  textColor: string;
  speed: string;
  isEditing: boolean;
}) {
  const { locale } = useLocale();
  const titleText = t(title, locale);
  const items = partners.length ? partners : [];
  const duration = speed === "fast" ? "20s" : speed === "slow" ? "60s" : "40s";
  const fadeBg = bgColor || "#ffffff";

  return (
    <div
      className="relative py-16 px-6 overflow-hidden"
      style={{ backgroundColor: fadeBg }}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {titleText && (
          <h2
            className="text-2xl md:text-3xl font-semibold text-center mb-12"
            style={{ color: textColor || "#0c2340" }}
          >
            {titleText}
          </h2>
        )}
        {items.length === 0 ? (
          <p
            className="text-center text-sm opacity-50"
            style={{ color: textColor || "#0c2340" }}
          >
            Chưa có đối tác. Thêm logo trong panel bên phải.
          </p>
        ) : (
          <div
            className="group relative"
            style={
              {
                ["--marquee-duration" as string]: duration,
                ["--partner-bg" as string]: fadeBg,
              } as React.CSSProperties
            }
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--partner-bg)] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[var(--partner-bg)] to-transparent z-10" />
            <div className="overflow-hidden">
              <div
                className={
                  "flex items-center gap-16 w-max " +
                  (isEditing
                    ? ""
                    : "animate-[partner-marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused]")
                }
              >
                {[...items, ...items].map((partner, i) => (
                  <a
                    key={`${partner.name}-${i}`}
                    href={isEditing ? "#" : partner.linkUrl || "#"}
                    tabIndex={isEditing ? -1 : undefined}
                    target={isEditing ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                    title={partner.name}
                  >
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-20 max-h-20 max-w-[240px] object-contain"
                        loading="lazy"
                      decoding="async"
                      />
                    ) : (
                      <span
                        className="text-sm font-medium"
                        style={{ color: textColor || "#0c2340" }}
                      >
                        {partner.name}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes partner-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export const PartnerShowcase: ComponentConfig<{
  partners: PartnerItem[];
  title: LocalizedString;
  bgColor: string;
  textColor: string;
  speed: string;
}> = {
  label: "Partner Logo Marquee",
  defaultProps: {
    partners: [
      {
        name: "Đại học Quốc Gia TP.HCM",
        logoUrl: "/partner-logos/dhqg.png",
        description: "",
        linkUrl: "https://vnuhcm.edu.vn/",
      },
      {
        name: "Đại học Bách Khoa",
        logoUrl: "/partner-logos/bku.png",
        description: "",
        linkUrl: "https://hcmut.edu.vn/",
      },
      {
        name: "Đại học Kinh Tế - Luật",
        logoUrl: "/partner-logos/uel.png",
        description: "",
        linkUrl: "https://uel.edu.vn/",
      },
      {
        name: "Đại học Sài Gòn",
        logoUrl: "/partner-logos/saigon.png",
        description: "",
        linkUrl: "https://sgu.edu.vn/",
      },
      {
        name: "Đại học Cần Thơ",
        logoUrl: "/partner-logos/cantho.png",
        description: "",
        linkUrl: "https://www.ctu.edu.vn/",
      },
      {
        name: "Đại học Đà Lạt",
        logoUrl: "/partner-logos/dalat.png",
        description: "",
        linkUrl: "https://dlu.edu.vn/",
      },
      {
        name: "Bosch",
        logoUrl: "/partner-logos/bosch.svg",
        description: "",
        linkUrl: "https://www.bosch.com.vn/",
      },
      {
        name: "Synopsys",
        logoUrl: "/partner-logos/synopsys.png",
        description: "",
        linkUrl: "https://www.synopsys.com/",
      },
      {
        name: "Renesas",
        logoUrl: "/partner-logos/renesas.svg",
        description: "",
        linkUrl: "https://www.renesas.com/",
      },
      {
        name: "Mantis",
        logoUrl: "/partner-logos/mantis.jpg",
        description: "",
        linkUrl: "http://mantis.vn/",
      },
      {
        name: "ESTEC",
        logoUrl: "/partner-logos/estec.png",
        description: "",
        linkUrl: "https://biendongco.vn/",
      },
      {
        name: "TMA Solutions",
        logoUrl: "/partner-logos/tma.png",
        description: "",
        linkUrl: "https://www.tmasolutions.vn/",
      },
    ],
    title: { vi: "Đối tác & Liên kết", en: "Partners & Affiliations" },
    bgColor: "#ffffff",
    textColor: "#0c2340",
    speed: "normal",
  },
  fields: {
    title: localizedTextField("Title"),
    bgColor: colorField("Background Color"),
    textColor: colorField("Title Color"),
    speed: {
      type: "select",
      label: "Scroll Speed",
      options: [
        { label: "Slow", value: "slow" },
        { label: "Normal", value: "normal" },
        { label: "Fast", value: "fast" },
      ],
    },
    partners: {
      type: "array",
      label: "Partners",
      arrayFields: {
        name: { type: "text", label: "Name" },
        logoUrl: mediaPickerField("Logo"),
        description: { type: "textarea", label: "Description (unused)" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
  },
  render: ({ partners, title, bgColor, textColor, speed, puck }) => (
    <PartnerShowcaseClient
      partners={partners || []}
      title={title}
      bgColor={bgColor}
      textColor={textColor}
      speed={speed}
      isEditing={!!puck?.isEditing}
    />
  ),
};
