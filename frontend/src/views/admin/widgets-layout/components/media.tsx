"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";

export const ImageBlock: ComponentConfig<{
  src: string;
  alt: string;
  caption: string;
  fit: string;
  borderRadius: string;
}> = {
  label: "Image",
  defaultProps: {
    src: "",
    alt: "",
    caption: "",
    fit: "cover",
    borderRadius: "md",
  },
  fields: {
    src: { type: "text", label: "Image URL" },
    alt: { type: "text", label: "Alt Text" },
    caption: { type: "text", label: "Caption" },
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
  render: ({ src, alt, caption, fit, borderRadius }) => {
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
          />
        ) : (
          <div
            className={`w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center ${radii[borderRadius] || "rounded-md"}`}
          >
            <span className="material-symbols-outlined text-4xl text-slate-300">
              image
            </span>
          </div>
        )}
        {caption && (
          <p className="text-sm text-slate-500 text-center mt-2">{caption}</p>
        )}
      </div>
    );
  },
};

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
        src: { type: "text", label: "Image URL" },
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
              <span className="material-symbols-outlined text-2xl text-slate-300">
                image
              </span>
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
              />
            ) : (
              <div className="aspect-square rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-slate-300">
                  image
                </span>
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
            <span className="material-symbols-outlined text-5xl text-white/30">
              play_circle
            </span>
          </div>
        )}
      </div>
    );
  },
};

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
  slides: { src: string; alt: string; caption: string; linkUrl: string }[];
  autoplay: boolean;
  intervalMs: number;
  h: string;
  r: string;
  showDots: boolean;
  showArrows: boolean;
  isEditing: boolean;
}) {
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
        <span className="material-symbols-outlined text-5xl text-slate-400">
          photo_library
        </span>
      </div>
    );
  }

  const slide = slides[current] || slides[0];

  return (
    <div className={`relative overflow-hidden ${r}`} style={{ height: h }}>
      {slide?.src ? (
        <img
          src={slide.src}
          alt={slide.alt || ""}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-800 flex items-center justify-center">
          <div className="text-center text-white">
            <span className="material-symbols-outlined text-5xl mb-2 block opacity-50">
              photo_library
            </span>
            <p className="text-lg font-semibold opacity-80">
              {slide?.caption || `Slide ${current + 1}`}
            </p>
          </div>
        </div>
      )}
      {slide?.caption && slide?.src && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <p className="text-white text-xl font-bold drop-shadow-lg">
            {slide.caption}
          </p>
          {slide.linkUrl && (
            <a
              href={isEditing ? "#" : slide.linkUrl}
              tabIndex={isEditing ? -1 : undefined}
              className="inline-block mt-2 px-4 py-1.5 text-sm text-white bg-white/20 rounded-md border border-white/30 hover:bg-white/30 transition-colors"
            >
              Chi tiết
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
            <span className="material-symbols-outlined text-xl">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
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
  slides: { src: string; alt: string; caption: string; linkUrl: string }[];
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
      { src: "", alt: "Slide 1", caption: "Slide 1", linkUrl: "" },
      { src: "", alt: "Slide 2", caption: "Slide 2", linkUrl: "" },
      { src: "", alt: "Slide 3", caption: "Slide 3", linkUrl: "" },
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
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        caption: { type: "text", label: "Caption" },
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
        src: { type: "text", label: "Logo URL" },
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
  title: string;
  description: string;
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
    title: "Liên kết",
    description: "",
    logoSize: "80",
  },
  fields: {
    logos: {
      type: "array",
      label: "Logos",
      arrayFields: {
        src: { type: "text", label: "Logo URL" },
        alt: { type: "text", label: "Name" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
    bgImageUrl: { type: "text", label: "Background Image URL" },
    title: { type: "text", label: "Title" },
    description: { type: "textarea", label: "Description" },
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
  render: ({ logos, bgImageUrl, title, description, logoSize, puck }) => {
    const size = parseInt(logoSize, 10) || 80;
    return (
      <div className="relative py-12 px-6 overflow-hidden">
        {bgImageUrl ? (
          <img
            src={bgImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center">
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-white/80 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          <div className="flex items-center justify-around flex-wrap gap-y-6">
            {(logos || []).map(
              (
                logo: { src: string; alt: string; linkUrl: string },
                i: number,
              ) => (
                <a
                  key={i}
                  href={puck?.isEditing ? "#" : logo.linkUrl || "#"}
                  tabIndex={puck?.isEditing ? -1 : undefined}
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
              ),
            )}
          </div>
        </div>
      </div>
    );
  },
};

function PartnerShowcaseClient({
  partners,
  title,
  bgColor,
  isEditing,
}: {
  partners: {
    name: string;
    logoUrl: string;
    description: string;
    linkUrl: string;
  }[];
  title: string;
  bgColor: string;
  isEditing: boolean;
}) {
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isEditing) {
      setVisibleSet(new Set(partners.map((_, i) => i)));
      return;
    }
    const observers: IntersectionObserver[] = [];
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSet((prev) => new Set(prev).add(i));
          } else {
            setVisibleSet((prev) => {
              const next = new Set(prev);
              next.delete(i);
              return next;
            });
          }
        },
        { threshold: 0.2 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [isEditing, partners]);

  return (
    <div
      className="relative py-20 px-6 overflow-hidden"
      style={{ backgroundColor: bgColor || "#0c2340" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      <div className="relative z-10">
        {title && (
          <h2 className="text-3xl font-bold text-white text-center mb-14">
            {title}
          </h2>
        )}
        <div className="max-w-4xl mx-auto space-y-6">
          {partners.map((partner, i) => {
            const alignLeft = i % 2 === 0;
            const isVisible = visibleSet.has(i);
            return (
              <div
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className={`flex items-center gap-6 md:gap-10 p-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors ${alignLeft ? "flex-row" : "flex-row-reverse"}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? "translateX(0)"
                    : alignLeft
                      ? "translateX(100%)"
                      : "translateX(-100%)",
                  transition:
                    "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <a
                  href={isEditing ? "#" : partner.linkUrl || "#"}
                  tabIndex={isEditing ? -1 : undefined}
                  className="shrink-0"
                >
                  {partner.logoUrl ? (
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center p-2">
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-xs text-white/60 text-center px-2">
                        {partner.name}
                      </span>
                    </div>
                  )}
                </a>
                <div className={alignLeft ? "" : "text-right"}>
                  <h3 className="text-lg font-semibold text-white">
                    {partner.name}
                  </h3>
                  {partner.description && (
                    <p className="text-sm text-white/60 mt-1 line-clamp-2">
                      {partner.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const PartnerShowcase: ComponentConfig<{
  partners: {
    name: string;
    logoUrl: string;
    description: string;
    linkUrl: string;
  }[];
  title: string;
  bgColor: string;
}> = {
  label: "Partner Showcase",
  defaultProps: {
    partners: [
      {
        name: "Đối tác 1",
        logoUrl: "",
        description: "",
        linkUrl: "#",
      },
    ],
    title: "Đối tác & Liên kết",
    bgColor: "#f8fafc",
  },
  fields: {
    title: { type: "text", label: "Title" },
    bgColor: { type: "text", label: "Background Color" },
    partners: {
      type: "array",
      label: "Partners",
      arrayFields: {
        name: { type: "text", label: "Name" },
        logoUrl: { type: "text", label: "Logo URL" },
        description: { type: "textarea", label: "Description" },
        linkUrl: { type: "text", label: "Link URL" },
      },
    },
  },
  render: ({ partners, title, bgColor, puck }) => (
    <PartnerShowcaseClient
      partners={partners || []}
      title={title}
      bgColor={bgColor}
      isEditing={!!puck?.isEditing}
    />
  ),
};
