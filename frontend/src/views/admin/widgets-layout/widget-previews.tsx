"use client";

type PreviewProps = { config: Record<string, any> };

function NavBarPreview({ config }: PreviewProps) {
  return (
    <div className="bg-[#0B1120] rounded px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-blue-500/30" />
        <div className="w-16 h-2 rounded bg-white/30" />
      </div>
      <div className="flex items-center gap-2">
        {(config.menuItems || []).slice(0, 5).map((_: unknown, i: number) => (
          <div key={i} className="w-10 h-1.5 rounded bg-white/20" />
        ))}
      </div>
      {config.showSearch && (
        <div className="w-20 h-5 rounded bg-white/10 border border-white/10" />
      )}
    </div>
  );
}

function HeroCarouselPreview({ config }: PreviewProps) {
  const h =
    config.height === "sm" ? "h-24" : config.height === "md" ? "h-32" : "h-40";
  return (
    <div
      className={`${h} rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-48 h-3 rounded bg-white/40 mx-auto mb-2" />
          <div className="w-32 h-2 rounded bg-white/25 mx-auto mb-3" />
          {config.showOverlayText && (
            <div className="w-20 h-5 rounded bg-white/20 mx-auto" />
          )}
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {Array.from({ length: Math.min(config.maxSlides || 3, 5) }).map(
          (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ThreeColumnNewsPreview({ config }: PreviewProps) {
  const cols = config.columns || [
    { title: "Col 1" },
    { title: "Col 2" },
    { title: "Col 3" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cols.slice(0, 3).map((col: { title?: string }, i: number) => (
        <div key={i} className="space-y-2">
          <div className="text-[10px] font-bold text-blue-700 border-b border-blue-200 pb-1 truncate">
            {col.title || `Column ${i + 1}`}
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex gap-1.5">
              {config.showThumbnails !== false && (
                <div className="w-8 h-6 rounded bg-slate-200 shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <div className="w-full h-1.5 rounded bg-slate-200" />
                <div className="w-3/4 h-1 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function LatestNewsPreview({ config }: PreviewProps) {
  const count = Math.min(config.maxItems || 4, 4);
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2 items-start">
          {config.showThumbnail !== false && (
            <div className="w-12 h-9 rounded bg-slate-200 shrink-0" />
          )}
          <div className="flex-1 space-y-1">
            <div className="w-full h-1.5 rounded bg-slate-200" />
            <div className="w-2/3 h-1.5 rounded bg-slate-100" />
            {config.showDate !== false && (
              <div className="w-12 h-1 rounded bg-slate-100" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementsPreview({ config }: PreviewProps) {
  const colors: Record<string, string> = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };
  const bg = colors[config.bgColor] || "bg-red-500";
  return (
    <div className={`${bg} rounded px-3 py-2 flex items-center gap-2`}>
      <span className="material-symbols-outlined text-white/80 text-sm">
        campaign
      </span>
      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        <div className="w-32 h-1.5 rounded bg-white/40" />
        <div className="w-24 h-1.5 rounded bg-white/30" />
      </div>
    </div>
  );
}

function VideoEmbedPreview({ config }: PreviewProps) {
  const ratio = config.aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-video";
  return (
    <div className="space-y-2">
      {config.title && (
        <div className="text-[10px] font-bold text-slate-700">
          {config.title}
        </div>
      )}
      <div
        className={`${ratio} max-h-32 bg-slate-900 rounded-lg flex items-center justify-center`}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">
            play_arrow
          </span>
        </div>
      </div>
    </div>
  );
}

function DepartmentsGridPreview({ config }: PreviewProps) {
  const cols = config.columns === "3" ? "grid-cols-3" : "grid-cols-4";
  const count = Math.min(config.maxDepartments || 8, 8);
  return (
    <div className={`grid ${cols} gap-2`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1 p-2 rounded bg-slate-50"
        >
          {config.showAvatar !== false && (
            <div className="w-6 h-6 rounded-full bg-blue-100" />
          )}
          <div className="w-10 h-1.5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function LeadershipPreview({ config }: PreviewProps) {
  return (
    <div className="space-y-2">
      {config.title && (
        <div className="text-[10px] font-bold text-slate-700 text-center">
          {config.title}
        </div>
      )}
      <div
        className={`flex ${config.layout === "vertical" ? "flex-col" : ""} gap-3 justify-center`}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 p-2 rounded bg-slate-50 flex-1"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100" />
            <div className="w-14 h-1.5 rounded bg-slate-200" />
            <div className="w-10 h-1 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnersGridPreview({ config }: PreviewProps) {
  const cols =
    config.columns === "8"
      ? "grid-cols-8"
      : config.columns === "4"
        ? "grid-cols-4"
        : "grid-cols-6";
  const count = (config.partners || []).length || 6;
  return (
    <div className="space-y-2">
      {config.title && (
        <div className="text-[10px] font-bold text-slate-700 text-center">
          {config.title}
        </div>
      )}
      <div className={`grid ${cols} gap-2`}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded bg-slate-100 flex items-center justify-center"
          >
            <div className="w-6 h-6 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsCalendarPreview({ config }: PreviewProps) {
  if (config.layout === "calendar") {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-bold text-slate-700">
            Tháng 3, 2026
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-center">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="text-[7px] text-slate-400 font-medium">
              {d}
            </div>
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`text-[8px] py-0.5 rounded ${i === 5 ? "bg-blue-500 text-white" : "text-slate-500"}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {Array.from({ length: Math.min(config.maxEvents || 3, 3) }).map(
        (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 flex flex-col items-center justify-center shrink-0">
              <div className="text-[8px] font-bold text-blue-600">{15 + i}</div>
              <div className="text-[6px] text-blue-400">Mar</div>
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="w-full h-1.5 rounded bg-slate-200" />
              <div className="w-1/2 h-1 rounded bg-slate-100" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function QuickLinksPreview({ config }: PreviewProps) {
  const links = config.links || [];
  const count = Math.min(links.length || 6, 6);
  const isRow = config.layout === "row";
  return (
    <div
      className={isRow ? "flex gap-3 justify-center" : "grid grid-cols-3 gap-2"}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1 p-2 rounded bg-blue-50"
        >
          <span className="material-symbols-outlined text-blue-500 text-sm">
            {links[i]?.icon || "link"}
          </span>
          <div className="text-[7px] text-slate-600 text-center truncate w-full">
            {links[i]?.label || "Link"}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchBarPreview({ config }: PreviewProps) {
  return (
    <div className="flex justify-center py-2">
      <div className="w-72 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-3 gap-2">
        <span className="material-symbols-outlined text-slate-400 text-sm">
          search
        </span>
        <span className="text-[10px] text-slate-400">
          {config.placeholder || "Tìm kiếm..."}
        </span>
      </div>
    </div>
  );
}

function FooterPreview({ config }: PreviewProps) {
  return (
    <div className="bg-[#0B1120] rounded px-3 py-3">
      <div className="grid grid-cols-3 gap-3 mb-2">
        <div className="space-y-1">
          <div className="w-12 h-1.5 rounded bg-white/30" />
          <div className="w-20 h-1 rounded bg-white/15" />
          <div className="w-16 h-1 rounded bg-white/15" />
        </div>
        <div className="space-y-1">
          <div className="w-10 h-1.5 rounded bg-white/30" />
          {(config.footerLinks || [])
            .slice(0, 3)
            .map((_: unknown, i: number) => (
              <div key={i} className="w-14 h-1 rounded bg-white/15" />
            ))}
        </div>
        <div className="space-y-1">
          <div className="w-12 h-1.5 rounded bg-white/30" />
          <div className="w-20 h-1 rounded bg-white/15" />
        </div>
      </div>
      <div className="border-t border-white/10 pt-1.5">
        <div className="w-40 h-1 rounded bg-white/10 mx-auto" />
      </div>
    </div>
  );
}

function DefaultPreview({
  config,
  icon,
  name,
}: PreviewProps & { icon?: string; name: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-slate-400">
      <div className="text-center">
        <span className="material-symbols-outlined text-2xl block mb-1">
          {icon || "widgets"}
        </span>
        <div className="text-xs font-medium">{name}</div>
        <div className="text-[10px] text-slate-300 mt-0.5">
          {Object.keys(config).length} config fields
        </div>
      </div>
    </div>
  );
}

function HeadingPreview({ config }: PreviewProps) {
  const sizes: Record<string, string> = {
    h1: "text-lg font-bold",
    h2: "text-base font-bold",
    h3: "text-sm font-semibold",
    h4: "text-xs font-semibold",
    h5: "text-[11px] font-semibold",
    h6: "text-[10px] font-medium",
  };
  const align: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return (
    <div
      className={`${sizes[config.level] || sizes.h2} ${align[config.alignment] || ""} py-1`}
      style={{ color: config.color || "#1e293b" }}
    >
      {config.text || "Heading"}
    </div>
  );
}

function TextBlockPreview({ config }: PreviewProps) {
  const sizes: Record<string, string> = {
    sm: "text-[10px]",
    base: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };
  const align: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  };
  return (
    <p
      className={`${sizes[config.fontSize] || sizes.base} ${align[config.alignment] || ""} leading-relaxed line-clamp-3`}
      style={{ color: config.color || "#475569" }}
    >
      {config.content || "Enter your text here..."}
    </p>
  );
}

function ImagePreview({ config }: PreviewProps) {
  const radii: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  return (
    <div className="space-y-1">
      <div
        className={`w-full aspect-video bg-slate-100 border border-slate-200 flex items-center justify-center ${radii[config.borderRadius] || "rounded-md"}`}
      >
        {config.src ? (
          <div className="text-[9px] text-slate-400 truncate px-2">
            {config.src}
          </div>
        ) : (
          <span className="material-symbols-outlined text-2xl text-slate-300">
            image
          </span>
        )}
      </div>
      {config.caption && (
        <div className="text-[9px] text-slate-400 text-center">
          {config.caption}
        </div>
      )}
    </div>
  );
}

function ButtonPreview({ config }: PreviewProps) {
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-slate-700 text-white",
    outline: "border border-blue-600 text-blue-600 bg-transparent",
    ghost: "text-blue-600 bg-transparent",
  };
  const sizes: Record<string, string> = {
    sm: "px-2 py-0.5 text-[9px]",
    md: "px-3 py-1 text-[10px]",
    lg: "px-4 py-1.5 text-xs",
  };
  const align: Record<string, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };
  return (
    <div className={`flex ${align[config.alignment] || "justify-start"}`}>
      <div
        className={`${variants[config.variant] || variants.primary} ${sizes[config.size] || sizes.md} rounded-md font-medium ${config.fullWidth ? "w-full text-center" : ""}`}
      >
        {config.label || "Button"}
      </div>
    </div>
  );
}

function SpacerPreview({ config }: PreviewProps) {
  const heights: Record<string, string> = {
    xs: "h-2",
    sm: "h-4",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };
  return (
    <div
      className={`${heights[config.height] || heights.md} w-full bg-slate-50/50 border border-dashed border-slate-200 rounded flex items-center justify-center`}
    >
      <span className="text-[8px] text-slate-300">spacer</span>
    </div>
  );
}

function DividerPreview({ config }: PreviewProps) {
  const thickness: Record<string, string> = {
    thin: "border-t",
    normal: "border-t-2",
    thick: "border-t-4",
  };
  const styles: Record<string, string> = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };
  return (
    <div className="py-2">
      <hr
        className={`${thickness[config.thickness] || "border-t"} ${styles[config.style] || "border-solid"}`}
        style={{ borderColor: config.color || "#e2e8f0" }}
      />
    </div>
  );
}

function CardPreview({ config }: PreviewProps) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${config.showBorder !== false ? "border border-slate-200" : ""} ${config.showShadow !== false ? "shadow-sm" : ""}`}
    >
      {config.imageUrl ? (
        <div className="h-16 bg-slate-100 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 truncate px-2">
            {config.imageUrl}
          </span>
        </div>
      ) : (
        <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-50" />
      )}
      <div className="p-2">
        <div className="text-xs font-semibold text-slate-700">
          {config.title || "Card Title"}
        </div>
        {config.description && (
          <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">
            {config.description}
          </div>
        )}
      </div>
    </div>
  );
}

function IconTextPreview({ config }: PreviewProps) {
  const isVertical = config.layout === "vertical";
  return (
    <div
      className={`flex ${isVertical ? "flex-col items-center text-center" : "items-start"} gap-2 p-2`}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={{ color: config.iconColor || "#3b82f6" }}
      >
        {config.icon || "info"}
      </span>
      <div>
        <div className="text-xs font-semibold text-slate-700">
          {config.title || "Feature"}
        </div>
        {config.description && (
          <div className="text-[9px] text-slate-400 mt-0.5">
            {config.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageGalleryPreview({ config }: PreviewProps) {
  const cols: Record<string, string> = {
    "2": "grid-cols-2",
    "3": "grid-cols-3",
    "4": "grid-cols-4",
  };
  const gaps: Record<string, string> = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  };
  const count = (config.images || []).length || 4;
  return (
    <div
      className={`grid ${cols[config.columns] || "grid-cols-3"} ${gaps[config.gap] || "gap-2"}`}
    >
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded bg-slate-100 border border-slate-200 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-sm text-slate-300">
            image
          </span>
        </div>
      ))}
    </div>
  );
}

function BannerPreview({ config }: PreviewProps) {
  const align: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return (
    <div
      className={`rounded-lg px-4 py-3 ${align[config.alignment] || "text-center"}`}
      style={{
        backgroundColor: config.bgColor || "#1e40af",
        color: config.textColor || "#ffffff",
      }}
    >
      <div className="text-sm font-bold">{config.text || "Welcome"}</div>
      {config.subtext && (
        <div className="text-[10px] opacity-80 mt-0.5">{config.subtext}</div>
      )}
      {config.buttonLabel && (
        <div className="mt-2">
          <span className="px-3 py-1 text-[10px] font-medium rounded bg-white/20 border border-white/30">
            {config.buttonLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function NavLinksPreview({ config }: PreviewProps) {
  const links = config.links || [];
  const isVertical = config.direction !== "horizontal";
  const sizes: Record<string, string> = {
    sm: "text-[11px]",
    base: "text-xs",
    lg: "text-sm",
  };
  const weights: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  return (
    <div className={isVertical ? "space-y-0.5" : "flex flex-wrap gap-3"}>
      {links.map((link: { label: string; url: string }, i: number) => (
        <div
          key={i}
          className={`flex items-center justify-between py-1.5 ${isVertical && i < links.length - 1 ? "border-b border-slate-100" : ""} ${sizes[config.fontSize] || "text-[11px]"} ${weights[config.fontWeight] || "font-medium"}`}
          style={{ color: config.color || "#374151" }}
        >
          <span>{link.label}</span>
          {config.showArrow !== false && (
            <span className="text-slate-400 ml-2">&raquo;</span>
          )}
        </div>
      ))}
    </div>
  );
}

const PREVIEW_MAP: Record<string, React.FC<PreviewProps>> = {
  TOP_NAV_BAR: NavBarPreview,
  HERO_CAROUSEL: HeroCarouselPreview,
  THREE_COLUMN_NEWS: ThreeColumnNewsPreview,
  LATEST_NEWS_LIST: LatestNewsPreview,
  ANNOUNCEMENTS_TICKER: AnnouncementsPreview,
  VIDEO_EMBED: VideoEmbedPreview,
  DEPARTMENTS_GRID: DepartmentsGridPreview,
  LEADERSHIP_SECTION: LeadershipPreview,
  PARTNERS_GRID: PartnersGridPreview,
  EVENTS_CALENDAR: EventsCalendarPreview,
  QUICK_LINKS: QuickLinksPreview,
  SEARCH_BAR: SearchBarPreview,
  FOOTER: FooterPreview,
  HEADING: HeadingPreview,
  TEXT_BLOCK: TextBlockPreview,
  IMAGE: ImagePreview,
  BUTTON: ButtonPreview,
  SPACER: SpacerPreview,
  DIVIDER: DividerPreview,
  CARD: CardPreview,
  ICON_TEXT: IconTextPreview,
  IMAGE_GALLERY: ImageGalleryPreview,
  BANNER: BannerPreview,
  NAV_LINKS: NavLinksPreview,
};

export function WidgetPreview({
  type,
  config,
  icon,
  name,
}: {
  type: string;
  config: Record<string, any>;
  icon?: string | null;
  name: string;
}) {
  const Preview = PREVIEW_MAP[type];
  if (Preview) return <Preview config={config} />;
  return (
    <DefaultPreview config={config} icon={icon || undefined} name={name} />
  );
}
