"use client";

// Floating Help button + panel. Two tabs:
//  - Interact: re-runnable guided walkthroughs (driver.js) + "replay the tab tour"
//  - Doc: pre-written FAQ (problem → resolution steps)
import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { widgetApi, type WidgetType } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { FAQ, type Locale, OVERVIEW_STEPS, WALKTHROUGHS } from "@/lib/tour/content";
import { runOverview, runWalkthrough } from "@/lib/tour/driver";

// The widget catalog stores English-only name/usage. This map provides the
// Vietnamese equivalents so the help center's Widget tab respects the VI/EN toggle
// (keyed by Widget.type; falls back to the catalog's English when a type is missing).
const WIDGET_I18N: Record<string, { name: string; usage: string }> = {
  ANNOUNCEMENTS_TICKER: {
    name: "Thanh thông báo chạy",
    usage: "Thanh thông báo khẩn cấp dạng chạy ngang",
  },
  BANNER: {
    name: "Biểu ngữ",
    usage: "Biểu ngữ màu tràn chiều rộng, có chữ và nút tùy chọn",
  },
  BUTTON: { name: "Nút bấm", usage: "Nút kêu gọi hành động với nhiều kiểu" },
  CARD: { name: "Thẻ", usage: "Thẻ có viền, gồm tiêu đề, mô tả và ảnh" },
  DEPARTMENTS_GRID: {
    name: "Lưới bộ môn",
    usage: "Các thẻ bộ môn xếp dạng lưới",
  },
  DIVIDER: { name: "Đường phân cách", usage: "Đường kẻ ngang phân cách" },
  EVENTS_CALENDAR: {
    name: "Lịch sự kiện",
    usage: "Lịch nhỏ hiển thị các sự kiện sắp tới",
  },
  FOOTER: {
    name: "Chân trang",
    usage: "Chân trang nhiều cột với thông tin liên hệ và liên kết",
  },
  HEADING: {
    name: "Tiêu đề",
    usage: "Tiêu đề văn bản (h1–h6) với căn lề và màu sắc",
  },
  HERO_CAROUSEL: {
    name: "Ảnh bìa trình chiếu",
    usage: "Trình chiếu biểu ngữ quảng bá tràn chiều rộng",
  },
  ICON_TEXT: {
    name: "Biểu tượng + Chữ",
    usage: "Biểu tượng kèm tiêu đề và mô tả",
  },
  IMAGE: { name: "Hình ảnh", usage: "Một hình ảnh kèm chú thích tùy chọn" },
  IMAGE_GALLERY: { name: "Thư viện ảnh", usage: "Lưới các hình ảnh" },
  LATEST_NEWS_LIST: {
    name: "Danh sách tin mới",
    usage: "Danh sách tin dạng dọc kèm ảnh thu nhỏ",
  },
  LEADERSHIP_SECTION: {
    name: "Ban lãnh đạo",
    usage: "Các thẻ hồ sơ lãnh đạo khoa",
  },
  TOP_NAV_BAR: {
    name: "Thanh điều hướng",
    usage: "Điều hướng trên cùng gồm logo, menu, tìm kiếm và mạng xã hội",
  },
  NAV_LINKS: {
    name: "Liên kết điều hướng",
    usage: "Danh sách liên kết điều hướng đơn giản có mũi tên",
  },
  PARTNERS_GRID: {
    name: "Đối tác & Liên kết",
    usage: "Lưới logo các trường đối tác",
  },
  QUICK_LINKS: {
    name: "Liên kết nhanh",
    usage: "Lưới biểu tượng cho các công cụ hay dùng",
  },
  SEARCH_BAR: { name: "Thanh tìm kiếm", usage: "Ô tìm kiếm toàn trang" },
  SPACER: { name: "Khoảng trống", usage: "Khoảng trống dọc" },
  TEXT_BLOCK: {
    name: "Khối văn bản",
    usage: "Đoạn văn bản với cỡ chữ, căn lề và màu sắc",
  },
  THREE_COLUMN_NEWS: {
    name: "Tin ba cột",
    usage: "Lưới tin ba cột (Tin Giáo Vụ, TTKH, Tuyển Dụng)",
  },
  VIDEO_EMBED: {
    name: "Nhúng video",
    usage: "Khối video nhúng kèm tiêu đề",
  },
};

export function HelpCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("vi");
  const [query, setQuery] = useState("");
  // Widget feature docs — synced from the /admin/widgets catalog (usage field).
  const widgetsQuery = useQuery({
    queryKey: ["WIDGET_TYPES"],
    queryFn: () => widgetApi.list(),
    enabled: open,
  });

  const launch = (fn: () => void) => {
    setOpen(false);
    // let the sheet close first so its backdrop doesn't sit above the tour overlay
    window.setTimeout(fn, 320);
  };

  const startWalkthrough = (id: string) => {
    const wt = WALKTHROUGHS.find((w) => w.id === id);
    if (!wt) return;
    launch(() =>
      runWalkthrough(wt, {
        locale,
        prefix: "",
        navigate: (p) => router.push(p),
        toast: (m) => toast.info(m),
      }),
    );
  };

  const startOverview = () => launch(() => runOverview(OVERVIEW_STEPS, locale, () => {}));

  const faq = FAQ.filter(
    (f) =>
      !query.trim() ||
      t(f.q, locale).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const T = (vi: string, en: string) => (locale === "en" ? en : vi);

  // Opened from the sidebar "Trợ giúp" item (which dispatches `open-help`)
  // instead of a floating button that overlapped the editor field panel.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-help", handler);
    return () => window.removeEventListener("open-help", handler);
  }, []);

  return (
    <>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md dark:bg-[#0B1120]"
        >
          <SheetHeader className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            {/* pr-9 keeps the VI/EN toggle clear of the Sheet's absolute close (X)
                button at top-3 right-3 (they were overlapping). */}
            <div className="flex items-center justify-between gap-3 pr-9">
              <div>
                <SheetTitle className="text-base">
                  {T("Trung tâm trợ giúp", "Help center")}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {T(
                    "Hướng dẫn tương tác và câu hỏi thường gặp",
                    "Interactive guides and FAQ",
                  )}
                </SheetDescription>
              </div>
              <div className="flex overflow-hidden rounded-md border border-slate-200 text-xs dark:border-slate-700">
                {(["vi", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={
                      "px-2 py-1 uppercase " +
                      (locale === l
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="interact" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-5 mt-4 grid grid-cols-3">
              <TabsTrigger value="interact">
                {T("Hướng dẫn", "Interactive")}
              </TabsTrigger>
              <TabsTrigger value="doc">{T("Câu hỏi (FAQ)", "FAQ")}</TabsTrigger>
              <TabsTrigger value="widgets">
                {T("Widget", "Widgets")}
              </TabsTrigger>
            </TabsList>

            {/* Interact */}
            <TabsContent
              value="interact"
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
            >
              <button
                type="button"
                onClick={startOverview}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span>
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                    {T("Xem lại giới thiệu các tab", "Replay the tab tour")}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {T(
                      "Giới thiệu nhanh từng mục trong trang quản trị.",
                      "A quick tour of each admin section.",
                    )}
                  </span>
                </span>
              </button>

              {WALKTHROUGHS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => startWalkthrough(w.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                      {t(w.label, locale)}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t(w.summary, locale)}
                    </span>
                  </span>
                </button>
              ))}
            </TabsContent>

            {/* Doc */}
            <TabsContent
              value="doc"
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
            >
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={T("Tìm câu hỏi…", "Search questions…")}
                className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700"
              />
              {faq.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {T("Không có kết quả.", "No results.")}
                </p>
              ) : (
                faq.map((f, i) => (
                  <details
                    key={i}
                    className="rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-slate-800 marker:text-slate-400 dark:text-slate-100">
                      {t(f.q, locale)}
                    </summary>
                    <ol className="list-decimal space-y-1 border-t border-slate-100 px-6 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {f.steps.map((s, j) => (
                        <li key={j}>{t(s, locale)}</li>
                      ))}
                    </ol>
                  </details>
                ))
              )}
            </TabsContent>

            {/* Widgets — feature docs synced from the /admin/widgets catalog */}
            <TabsContent
              value="widgets"
              className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4"
            >
              {(widgetsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">
                  {T("Chưa có widget nào.", "No widgets yet.")}
                </p>
              ) : (
                (widgetsQuery.data ?? []).map((w: WidgetType) => (
                  <details
                    key={w.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {locale === "vi"
                        ? (WIDGET_I18N[w.type]?.name ?? w.name)
                        : w.name}
                    </summary>
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      <p>
                        {(locale === "vi"
                          ? WIDGET_I18N[w.type]?.usage
                          : undefined) ||
                          w.usage ||
                          w.description ||
                          T(
                            "Chưa có mô tả cách dùng.",
                            "No usage description yet.",
                          )}
                      </p>
                      {w.configSchema &&
                      Object.keys(w.configSchema).length > 0 ? (
                        <p className="text-xs text-slate-400">
                          {T("Trường: ", "Fields: ")}
                          {Object.keys(w.configSchema).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </details>
                ))
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
