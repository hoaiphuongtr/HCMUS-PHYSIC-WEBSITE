"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type LocalizedString, t } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import {
  NOTIF_TOPICS,
  readSubs,
  SUBS_EVENT,
  topicByKey,
  topicQuery,
  writeSubs,
} from "./notif-subs";

// Trung tâm thông báo theo chủ đề, thuần trình duyệt (không đăng nhập, không email).
// Đọc/ghi cùng localStorage notif:subs với nút chuông trên trang học bổng.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const POPPED_KEY = "notif:autoPopped";

type NotiPost = {
  slug: string;
  title: LocalizedString;
  publishedAt: string | null;
  updatedAt: string;
  layouts?: { slug: string; isPublished: boolean }[];
};
type NewItem = NotiPost & { topicKey: string };

const postDate = (p: NotiPost) => p.publishedAt || p.updatedAt;

const fetchTopicPosts = async (key: string): Promise<NotiPost[]> => {
  const topic = topicByKey(key);
  if (!topic) return [];
  try {
    const d = await fetch(
      `${API_URL}/posts/public/list?page=1&pageSize=5&${topicQuery(topic)}`,
    ).then((r) => (r.ok ? r.json() : { items: [] }));
    return d.items || [];
  } catch {
    return [];
  }
};

export function NotificationBell({ color }: { color?: string }) {
  const { locale } = useLocale();
  const [subs, setSubs] = useState<Record<string, string>>({});
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = readSubs();
    setSubs(current);
    const keys = Object.keys(current);
    if (keys.length === 0) return;
    Promise.all(
      keys.map((key) =>
        fetchTopicPosts(key).then((posts) =>
          posts
            .filter((p) => new Date(postDate(p)) > new Date(current[key]))
            .map((p) => ({ ...p, topicKey: key })),
        ),
      ),
    ).then((groups) => {
      const flat = groups
        .flat()
        .sort((a, b) => +new Date(postDate(b)) - +new Date(postDate(a)));
      setNewItems(flat);
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

  // Đồng bộ khi chuông ở trang học bổng (hoặc component khác) đổi đăng ký.
  useEffect(() => {
    const onChange = () => setSubs(readSubs());
    window.addEventListener(SUBS_EVENT, onChange);
    return () => window.removeEventListener(SUBS_EVENT, onChange);
  }, []);

  const toggleTopic = async (key: string) => {
    const next = { ...readSubs() };
    if (next[key] !== undefined) {
      delete next[key];
      writeSubs(next);
      setSubs(next);
      setNewItems((prev) => prev.filter((i) => i.topicKey !== key));
      return;
    }
    // Theo dõi: hiện thẳng vài bài mới nhất (bài di trú hay trùng mốc), đặt mốc =
    // ngày bài mới nhất để về sau chỉ bài đăng SAU đó mới báo.
    const posts = await fetchTopicPosts(key);
    next[key] = posts[0] ? postDate(posts[0]) : new Date().toISOString();
    writeSubs(next);
    setSubs(next);
    const fresh = posts.slice(0, 3).map((p) => ({ ...p, topicKey: key }));
    setNewItems((prev) =>
      [...prev.filter((i) => i.topicKey !== key), ...fresh].sort(
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
        onClick={() => {
          setSubs(readSubs()); // phản ánh đăng ký mới nhất khi mở
          setOpen((v) => !v);
        }}
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
        <div className="fixed right-2 top-16 left-2 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2436] shadow-xl z-[9999]">
          <div className="sticky top-0 z-10 bg-white dark:bg-[#1a2436] px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
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

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
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
              <li key={`${p.topicKey}-${p.slug}`}>
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
              {NOTIF_TOPICS.map((topic) => {
                const on = subs[topic.key] !== undefined;
                return (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => toggleTopic(topic.key)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      on
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-[#202c44] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    }`}
                  >
                    {on && <Check className="w-3 h-3" />}
                    {t(topic.label, locale)}
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
