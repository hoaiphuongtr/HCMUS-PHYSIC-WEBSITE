import type { Category, CategoryRef, LocalizedText } from "@/lib/api";
import { type Locale, localize } from "@/lib/localized";

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  "tin-hoc-vu": "#2563eb",
  "thong-tin-khoa-hoc": "#7c3aed",
  "tuyen-dung": "#dc2626",
  "su-kien": "#059669",
  "hoc-bong": "#d97706",
};

export const FALLBACK_CATEGORY_COLOR = "#475569";

export const categoryColor = (slug: string | null | undefined): string => {
  if (!slug) return FALLBACK_CATEGORY_COLOR;
  return DEFAULT_CATEGORY_COLORS[slug] ?? FALLBACK_CATEGORY_COLOR;
};

export const categoryLabel = (
  cat: { name: LocalizedText } | CategoryRef | Category | null | undefined,
  locale: Locale = "vi",
): string => {
  if (!cat) return "";
  return localize(cat.name, locale);
};

export const findCategoryById = (
  categories: Category[] | undefined,
  id: string | null | undefined,
): Category | undefined => {
  if (!id || !categories) return undefined;
  return categories.find((c) => c.id === id);
};

export const findCategoryBySlug = (
  categories: Category[] | undefined,
  slug: string | null | undefined,
): Category | undefined => {
  if (!slug || !categories) return undefined;
  return categories.find((c) => c.slug === slug);
};

export const buildCategoryOptions = (
  categories: Category[] | undefined,
  locale: Locale = "vi",
): { value: string; label: string }[] => {
  if (!categories) return [];
  return categories
    .filter((c) => c.status)
    .map((c) => ({ value: c.id, label: localize(c.name, locale) }));
};
