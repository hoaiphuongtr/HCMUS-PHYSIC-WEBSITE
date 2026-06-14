import type { LocalizedText } from "./api";

export type Locale = "vi" | "en";

type MaybeLocalized = LocalizedText | string | null | undefined;

export function localize(value: MaybeLocalized, locale: Locale = "vi"): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (locale === "en") return value.en ?? value.vi ?? "";
  return value.vi ?? value.en ?? "";
}

export function localizeOrNull(
  value: MaybeLocalized,
  locale: Locale = "vi",
): string | null {
  const out = localize(value, locale);
  return out === "" ? null : out;
}

export function emptyLocalized(): LocalizedText {
  return { vi: "", en: "" };
}

export function toLocalized(value: MaybeLocalized): LocalizedText {
  if (value === null || value === undefined) return emptyLocalized();
  if (typeof value === "string") return { vi: value, en: "" };
  return { vi: value.vi ?? "", en: value.en ?? "" };
}
