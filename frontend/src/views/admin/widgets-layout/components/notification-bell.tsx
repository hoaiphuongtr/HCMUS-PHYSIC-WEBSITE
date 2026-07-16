"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// Trung tâm thông báo theo chủ đề, thuần trình duyệt (không đăng nhập, không email):
// khách bấm "Nhận thông báo" cho một chuyên mục (vd Tuyển dụng) -> lưu ở localStorage
// kèm mốc thời điểm đăng ký. Mỗi lần vào web, chuông đối chiếu ngày bài mới nhất của
// từng chuyên mục đã theo dõi với mốc đó; có bài mới hơn thì hiện huy hiệu số và tự
// bung danh sách. Bấm vào bài hoặc "đánh dấu đã đọc" thì cập nhật mốc, huy hiệu về 0.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const SUBS_KEY = "notif:subs"; // { [categorySlug]: seenAtISO }
const POPPED_KEY = "notif:autoPopped"; // session flag

type Category = { slug: string; name: LocalizedString; status?: boolean };
type NotiPost = {
  slug: string;
  title: LocalizedString;
  categoryId?: string;
  publishedAt: string | null;
  updatedAt: string;
  layouts?: { slug: string; isPublished: boolean }[];
};
type NewItem = NotiPost & { catSlug: string };

const postDate = (p: NotiPost) => p.publishedAt || p.updatedAt;
const readSubs = (): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem(SUBS_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeSubs = (s: Record<string, string>) =>
  window.localStorage.setItem(SUBS_KEY, JSON.stringify(s));

export function NotificationBell({ color }: { color?: string }) {
  const { locale } = useLocale();
  const [cats, setCats] = useState<Category[]>([]);
  const [subs, setSubs] = useState<Record<string, string>>({});
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nạp danh mục + tính bài mới cho các chuyên mục đã theo dõi.
  useEffect(() => {
    const current = readSubs();
    setSubs(current);
    fetch(`${API_URL}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) =>
        setCats(
          (Array.isArray(d) ? d : []).filter(
            (c: Category) => c.status !== false,
          ),
        ),
      )
      .catch(() => {});

    const slugs = Object.keys(current);
    if (slugs.length === 0) return;
    Promise.all(
      slugs.map((slug) =>
        fetch(
          `${API_URL}/posts/public/list?page=1&pageSize=5&category=${encodeURIComponent(slug)}`,
        )
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .then((d) =>
            (d.items || [])
              .filter((p: NotiPost) => new Date(postDate(p)) > new Date(current[slug]))
              .map((p: NotiPost) => ({ ...p, catSlug: slug })),
          )
          .catch(() => [] as NewItem[]),
      ),
    ).then((groups) => {
      const flat = groups
        .flat()
        .sort((a, b) => +new Date(postDate(b)) - +new Date(postDate(a)));
      setNewItems(flat);
      // Tự bung một lần mỗi phiên nếu có bài mới.
      if (flat.length > 0 && !window.sessionStorage.getItem(POPPED_KEY)) {
        setOpen(true);
        window.sessionStorage.setItem(POPPED_KEY, "1");
      }
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggleSub = async (slug: string) => {
    const next = { ...readSubs() };
    if (next[slug] !== undefined) {
      delete next[slug];
      writeSubs(next);
      setSubs(next);
      setNewItems((prev) => prev.filter((i) => i.catSlug !== slug));
      return;
    }
    // Đăng ký: đặt mốc ngay TRƯỚC bài mới nhất của chuyên mục để khách thấy ngay
    // bài gần nhất là "mới", đồng thời mọi bài đăng sau đó vẫn được tính.
    let posts: NotiPost[] = [];
    try {
      const d = await fetch(
        `${API_URL}/posts/public/list?page=1&pageSize=5&category=${encodeURIComponent(slug)}`,
      ).then((r) => (r.ok ? r.json() : { items: [] }));
      posts = d.items || [];
    } catch {
      posts = [];
    }
    const watermark = posts[1]
      ? postDate(posts[1])
      : new Date(0).toISOString();
    next[slug] = watermark;
    writeSubs(next);
    setSubs(next);
    const fresh: NewItem[] = posts
      .filter((p) => new Date(postDate(p)) > new Date(watermark))
      .map((p) => ({ ...p, catSlug: slug }));
    setNewItems((prev) =>
      [...prev.filter((i) => i.catSlug !== slug), ...fresh].sort(
        (a, b) => +new Date(postDate(b)) - +new Date(postDate(a)),
      ),
    );
  };

  const markRead = () => {
    const now = new Date().toISOString();
    const next = { ...readSubs() };
    for (const k of Object.keys(next)) next[k] = now;
    writeSubs(next);
    setSubs(next);
    setNewItems([]);
  };

  const href = (p: NotiPost) => {
    const layoutSlug = p.layouts?.find((l) => l.isPublished)?.slug;
    return `/${locale}/${layoutSlug ?? `tin-tuc/${p.slug}`}`;
  };
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
  const badge = newItems.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={locale === "en" ? "Notifications" : "Thông báo"}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#202c44] transition-colors"
        style={{ color: color || "#1e293b" }}
      >
        <Bell className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] shadow-xl z-[9999] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0c2340] dark:text-slate-100">
              {locale === "en" ? "Notifications" : "Thông báo"}
            </p>
            {badge > 0 && (
              <button
                type="button"
                onClick={markRead}
                className="text-xs text-blue-700 dark:text-blue-300 hover:underline"
              >
                {locale === "en" ? "Mark read" : "Đánh dấu đã đọc"}
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {badge === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400 text-center">
                {Object.keys(subs).length === 0
                  ? locale === "en"
                    ? "Follow a topic below to get notified."
                    : "Theo dõi một chủ đề bên dưới để nhận thông báo."
                  : locale === "en"
                    ? "No new posts."
                    : "Chưa có bài mới."}
              </li>
            )}
            {newItems.map((p) => (
              <li key={`${p.catSlug}-${p.slug}`}>
                <a
                  href={href(p)}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#202c44] transition-colors"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                    {t(p.title, locale)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {fmt(postDate(p))}
                  </p>
                </a>
              </li>
            ))}
          </ul>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
              {locale === "en" ? "Follow topics" : "Nhận thông báo theo chủ đề"}
            </p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => {
                const on = subs[c.slug] !== undefined;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleSub(c.slug)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      on
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-[#202c44] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    }`}
                  >
                    {on && <Check className="w-3 h-3" />}
                    {t(c.name, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
