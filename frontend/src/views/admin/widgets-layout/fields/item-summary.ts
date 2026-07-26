import type { LocalizedString } from "@/lib/i18n";

// Shared getItemSummary helper for Puck array fields: shows a real label
// (localized text, else a fallback) instead of the default "Item #0/#1".
export const localizedSummary = (
  v: LocalizedString | string | null | undefined,
  fallback: string,
): string => {
  if (!v) return fallback;
  if (typeof v === "string") return v || fallback;
  return v.vi || v.en || fallback;
};
