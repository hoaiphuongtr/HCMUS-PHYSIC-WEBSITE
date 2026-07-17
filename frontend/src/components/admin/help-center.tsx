"use client";

// Floating Help button + panel. Two tabs:
//  - Interact: re-runnable guided walkthroughs (driver.js) + "replay the tab tour"
//  - Doc: pre-written FAQ (problem → resolution steps)
import { HelpCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
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

export function HelpCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("vi");
  const [query, setQuery] = useState("");

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={T("Trợ giúp", "Help")}
        data-tour="help-button"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

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
            <TabsList className="mx-5 mt-4 grid grid-cols-2">
              <TabsTrigger value="interact">
                {T("Hướng dẫn", "Interactive")}
              </TabsTrigger>
              <TabsTrigger value="doc">{T("Câu hỏi (FAQ)", "FAQ")}</TabsTrigger>
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
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
