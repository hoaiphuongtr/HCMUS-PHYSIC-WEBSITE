import type { LocalizedString } from "@/lib/i18n";

// Mô hình theo dõi thông báo dùng chung cho chuông trên header và trang học bổng.
// Chủ đề = chuyên mục thật (lọc theo category) HOẶC từ khóa (học bổng — do bài học
// bổng di trú nằm rải nhiều chuyên mục nên lọc theo từ khóa đáng tin hơn).
export type NotifTopic = {
  key: string;
  label: LocalizedString;
  category?: string;
  keyword?: string;
};

export const NOTIF_TOPICS: NotifTopic[] = [
  {
    key: "educational-news",
    label: { vi: "Tin học vụ", en: "Academic news" },
    category: "educational-news",
  },
  {
    key: "scientific-information",
    label: { vi: "Tin khoa học", en: "Science news" },
    category: "scientific-information",
  },
  {
    key: "recruitment",
    label: { vi: "Tuyển dụng", en: "Recruitment" },
    category: "recruitment",
  },
  { key: "event", label: { vi: "Sự kiện", en: "Events" }, category: "event" },
  {
    key: "hoc-bong",
    label: { vi: "Học bổng", en: "Scholarships" },
    keyword: "học bổng",
  },
];

export const topicByKey = (key: string): NotifTopic | undefined =>
  NOTIF_TOPICS.find((t) => t.key === key);

export const topicQuery = (t: NotifTopic): string =>
  t.category
    ? `category=${encodeURIComponent(t.category)}`
    : `search=${encodeURIComponent(t.keyword || "")}`;

const SUBS_KEY = "notif:subs";
// Sự kiện đồng bộ trong cùng tab: `storage` chỉ bắn liên-tab, nên phát custom event
// để chuông header và chuông trang học bổng cập nhật lẫn nhau ngay lập tức.
export const SUBS_EVENT = "notif:subs-changed";

// { [topicKey]: seenAtISO }. Chấp nhận cả dữ liệu cũ (giá trị chuỗi) — coi là mốc.
export const readSubs = (): Record<string, string> => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SUBS_KEY) || "{}");
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") out[k] = v;
      else if (v && typeof (v as { seenAt?: string }).seenAt === "string")
        out[k] = (v as { seenAt: string }).seenAt;
    }
    return out;
  } catch {
    return {};
  }
};

export const writeSubs = (s: Record<string, string>): void => {
  window.localStorage.setItem(SUBS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(SUBS_EVENT));
};
