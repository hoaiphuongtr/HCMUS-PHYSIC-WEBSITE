import type { PostCategoryValue } from "@/lib/api";

export type PostCategoryMeta = {
  vi: string;
  en: string;
  color: string;
};

export const POST_CATEGORY_META: Record<PostCategoryValue, PostCategoryMeta> = {
  EDUCATIONAL_NEWS: {
    vi: "Tin học vụ",
    en: "Educational News",
    color: "#2563eb",
  },
  SCIENTIFIC_INFORMATION: {
    vi: "Thông tin khoa học",
    en: "Scientific Information",
    color: "#7c3aed",
  },
  RECRUITMENT: { vi: "Tuyển dụng", en: "Recruitment", color: "#dc2626" },
  EVENT: { vi: "Sự kiện", en: "Event", color: "#059669" },
  SCHOLARSHIP: { vi: "Học bổng", en: "Scholarship", color: "#d97706" },
};

export const POST_CATEGORY_VALUES = Object.keys(
  POST_CATEGORY_META,
) as PostCategoryValue[];

export const POST_CATEGORY_OPTIONS_VI: {
  value: PostCategoryValue;
  label: string;
}[] = POST_CATEGORY_VALUES.map((value) => ({
  value,
  label: POST_CATEGORY_META[value].vi,
}));

export const categoryLabelVi = (category: string): string =>
  POST_CATEGORY_META[category as PostCategoryValue]?.vi ?? category;
