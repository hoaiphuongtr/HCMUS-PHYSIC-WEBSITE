export const LOCALES = ["vi", "en"] as const;
export const DEFAULT_LOCALE = "vi";

export type Locale = (typeof LOCALES)[number];

export type LocalizedString = string | Partial<Record<string, string>>;

export const LOCALE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export const isLocale = (value: string | null | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

export const t = (
  value: LocalizedString | null | undefined,
  locale: string,
): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const direct = value[locale];
  if (direct) return direct;
  const fallback = value[DEFAULT_LOCALE];
  if (fallback) return fallback;
  for (const v of Object.values(value)) {
    if (v) return v;
  }
  return "";
};

export const ensureLocalized = (
  value: LocalizedString | null | undefined,
): Partial<Record<string, string>> => {
  if (value == null) return {};
  if (typeof value === "string") return { [DEFAULT_LOCALE]: value };
  return value;
};

// Các ngôn ngữ (khác mặc định) còn để trống trong khi ngôn ngữ mặc định đã có
// nội dung. Trình soạn thảo dùng để cảnh báo. Bản này phải KHỚP frontend/src/lib/i18n.ts
// vì các field song ngữ (localized-*-field) được frontend-public compile lại.
export const untranslatedLocales = (
  value: LocalizedString | null | undefined,
  isHtml = false,
): string[] => {
  const map = ensureLocalized(value);
  const clean = (s: string | undefined) => {
    if (!s) return "";
    const text = isHtml
      ? s.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ")
      : s;
    return text.trim();
  };
  if (!clean(map[DEFAULT_LOCALE])) return [];
  return (LOCALES as readonly string[]).filter(
    (l) => l !== DEFAULT_LOCALE && !clean(map[l]),
  );
};

export const setLocaleValue = (
  value: LocalizedString | null | undefined,
  locale: string,
  text: string,
): Partial<Record<string, string>> => ({
  ...ensureLocalized(value),
  [locale]: text,
});
