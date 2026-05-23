"use client";

import type { CustomField } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  ensureLocalized,
  type LocalizedString,
} from "@/lib/i18n";

type LocalizedTextInputProps = {
  label: string;
  value: LocalizedString | undefined;
  onChange: (value: Partial<Record<string, string>>) => void;
  multiline?: boolean;
};

type LocaleInputRowProps = {
  locale: string;
  isDefault: boolean;
  text: string;
  multiline: boolean;
  onCommit: (next: string) => void;
};

const LocaleInputRow = ({
  locale,
  isDefault,
  text,
  multiline,
  onCommit,
}: LocaleInputRowProps) => {
  const [local, setLocal] = useState(text);
  const composingRef = useRef(false);
  const focusedRef = useRef(false);

  // Sync external value when not focused/composing (prevents resetting caret while typing).
  useEffect(() => {
    if (!focusedRef.current && !composingRef.current && text !== local) {
      setLocal(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const commit = (value: string) => {
    if (value !== text) onCommit(value);
  };

  const inputClass =
    "w-full min-w-0 px-2 py-1.5 text-xs border rounded-md outline-none focus:ring-2 focus:ring-blue-200 " +
    (isDefault ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white");

  const sharedHandlers = {
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: (
      e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      composingRef.current = false;
      const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
      setLocal(v);
      commit(v);
    },
    onFocus: () => {
      focusedRef.current = true;
    },
    onBlur: () => {
      focusedRef.current = false;
      commit(local);
    },
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setLocal(e.target.value);
      // Skip mid-composition commits to avoid IME caret jump.
      if (composingRef.current) return;
      commit(e.target.value);
    },
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span
          className={
            "px-1.5 py-0.5 rounded " +
            (isDefault
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-700")
          }
        >
          {locale}
        </span>
        <span className="text-slate-400 normal-case">
          {LOCALE_LABELS[locale] || locale}
        </span>
        {isDefault && (
          <span className="text-[9px] text-blue-600 normal-case">
            (mặc định)
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={local}
          rows={3}
          className={inputClass + " resize-y leading-relaxed"}
          {...sharedHandlers}
        />
      ) : (
        <input value={local} className={inputClass} {...sharedHandlers} />
      )}
    </div>
  );
};

const LocalizedTextInput = ({
  label,
  value,
  onChange,
  multiline,
}: LocalizedTextInputProps) => {
  const normalized = ensureLocalized(value);

  const handleLocaleCommit = (locale: string, text: string) => {
    onChange({ ...normalized, [locale]: text });
  };

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
        <span className="material-symbols-outlined text-[14px] text-slate-400">
          translate
        </span>
        {label}
      </div>
      {LOCALES.map((locale) => (
        <LocaleInputRow
          key={locale}
          locale={locale}
          isDefault={locale === DEFAULT_LOCALE}
          text={normalized[locale] ?? ""}
          multiline={!!multiline}
          onCommit={(next) => handleLocaleCommit(locale, next)}
        />
      ))}
    </div>
  );
};

export const localizedTextField = (
  label: string,
): CustomField<LocalizedString> => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <LocalizedTextInput
      label={label}
      value={value}
      onChange={(next) => onChange(next as LocalizedString)}
    />
  ),
});

export const localizedTextareaField = (
  label: string,
): CustomField<LocalizedString> => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <LocalizedTextInput
      label={label}
      value={value}
      onChange={(next) => onChange(next as LocalizedString)}
      multiline
    />
  ),
});
