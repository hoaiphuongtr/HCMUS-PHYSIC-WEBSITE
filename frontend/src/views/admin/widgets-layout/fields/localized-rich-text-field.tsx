"use client";

import type { CustomField } from "@puckeditor/core";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { DynamicIcon } from "@/components/admin/icons";
import {
  DEFAULT_LOCALE,
  ensureLocalized,
  LOCALE_LABELS,
  LOCALES,
  type LocalizedString,
  untranslatedLocales,
} from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// The Tiptap editor is heavy and admin-only — load it lazily so it never lands on
// the public render path (the Puck config is compiled by frontend-public too, but
// fields are only used inside the admin editor).
const MarkdownEditor = dynamic(
  () => import("@/views/admin/posts/markdown-editor").then((m) => m.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="p-3 text-xs text-slate-400">Đang tải trình soạn thảo…</div>
    ),
  },
);

function LocalizedRichText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedString | undefined;
  onChange: (value: LocalizedString) => void;
}) {
  const normalized = ensureLocalized(value);
  const missing = untranslatedLocales(value, true);
  // Tab ngôn ngữ của ô soạn thảo BÁM THEO công tắc VI/EN của cả trang. Trước đây
  // nó giữ trạng thái riêng, nên bấm EN ở thanh trên thì khung xem trước đổi sang
  // tiếng Anh còn ô soạn thảo vẫn hiện tiếng Việt — người soạn tưởng bản Anh chưa
  // có, hoặc tệ hơn là gõ bản Anh đè lên ô tiếng Việt.
  // Vẫn cho bấm tab riêng ở đây khi muốn sửa một ngôn ngữ mà xem trước ngôn ngữ kia.
  const { locale: pageLocale } = useLocale();
  const [locale, setLocale] = useState<string>(pageLocale || DEFAULT_LOCALE);
  useEffect(() => {
    if (pageLocale) setLocale(pageLocale);
  }, [pageLocale]);
  // Visual (WYSIWYG) by default; raw HTML is an escape hatch so complex legacy
  // markup (styled tables etc.) can be edited without Tiptap normalising it away.
  const [mode, setMode] = useState<"visual" | "html">("visual");

  const setLocaleHtml = (html: string) =>
    onChange({ ...normalized, [locale]: html });

  const tabBtn = (active: boolean) =>
    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors " +
    (active
      ? "bg-blue-600 text-white"
      : "text-slate-500 hover:text-slate-800 dark:text-slate-400");

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
          <DynamicIcon
            name="edit_note"
            className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
          />
          {label}
        </div>
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-[#1a2436]">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={tabBtn(locale === l) + " inline-flex items-center gap-1"}
            >
              {LOCALE_LABELS[l] || l}
              {missing.includes(l) && (
                <span
                  title="Chưa dịch"
                  className="w-1.5 h-1.5 rounded-full bg-amber-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMode("visual")}
          className={tabBtn(mode === "visual")}
        >
          Trực quan
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          className={tabBtn(mode === "html")}
        >
          HTML
        </button>
      </div>

      {missing.includes(locale) && (
        <p className="flex items-center gap-1 text-[10px] leading-snug text-amber-600">
          <DynamicIcon name="warning" className="w-3 h-3 shrink-0" />
          Bỏ trống — trang công khai sẽ hiển thị nội dung tiếng Việt.
        </p>
      )}

      {mode === "visual" ? (
        <MarkdownEditor
          key={locale}
          value={normalized[locale] ?? ""}
          onChange={setLocaleHtml}
        />
      ) : (
        <textarea
          key={`${locale}-html`}
          value={normalized[locale] ?? ""}
          onChange={(e) => setLocaleHtml(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full px-2 py-1.5 text-[11px] font-mono leading-relaxed border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-[#1a2436] resize-y"
        />
      )}
    </div>
  );
}

export const localizedRichTextField = (
  label: string,
): CustomField<LocalizedString> => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <LocalizedRichText
      label={label}
      value={value}
      onChange={(next) => onChange(next as LocalizedString)}
    />
  ),
});
