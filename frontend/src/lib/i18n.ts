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

export const setLocaleValue = (
  value: LocalizedString | null | undefined,
  locale: string,
  text: string,
): Partial<Record<string, string>> => ({
  ...ensureLocalized(value),
  [locale]: text,
});
