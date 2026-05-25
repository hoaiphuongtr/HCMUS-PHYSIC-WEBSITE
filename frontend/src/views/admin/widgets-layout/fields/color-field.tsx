"use client";

import type { CustomField } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { PaletteIcon } from "@/components/admin/icons";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const normalizeHex = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const isValidHex = (value: string): boolean => HEX_RE.test(value);

type ColorInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const ColorInput = ({ value, onChange }: ColorInputProps) => {
  const externalValue = value ?? "";
  const [draft, setDraft] = useState(externalValue);
  const [pickerOpen, setPickerOpen] = useState(false);
  const focusedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync external value into draft when user not interacting
  useEffect(() => {
    if (!focusedRef.current && externalValue !== draft) {
      setDraft(externalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const commit = (next: string) => {
    if (next !== externalValue) onChange(next);
  };

  const handleChange = (raw: string) => {
    const normalized = normalizeHex(raw);
    setDraft(normalized);
    if (!normalized || isValidHex(normalized)) commit(normalized);
  };

  const handleBlur = () => {
    focusedRef.current = false;
    const normalized = normalizeHex(draft);
    setDraft(normalized);
    if (!normalized || isValidHex(normalized)) commit(normalized);
  };

  const handlePicker = (next: string) => {
    setDraft(next);
    if (isValidHex(next)) commit(next);
  };

  const isEmpty = draft.trim().length === 0;
  const valid = !isEmpty && isValidHex(draft);
  const swatchColor = valid ? draft : "transparent";

  return (
    <div ref={containerRef} className="space-y-1">
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="text"
          value={draft}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="#000000"
          spellCheck={false}
          className={
            "flex-1 min-w-0 px-2 py-1.5 text-xs font-mono border rounded-md outline-none focus:ring-2 " +
            (valid || isEmpty
              ? "border-slate-200 focus:ring-blue-200"
              : "border-rose-300 focus:ring-rose-200 bg-rose-50/30")
          }
        />
        <button
          type="button"
          onClick={() => setPickerOpen((p) => !p)}
          className={
            "shrink-0 w-8 h-8 rounded-full border-2 border-slate-200 hover:border-slate-300 transition-colors " +
            (valid
              ? ""
              : "bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#fff_0%_50%)_50%_/_8px_8px]")
          }
          style={valid ? { backgroundColor: swatchColor } : undefined}
          aria-label="Mở bảng chọn màu"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        />
      </div>
      {!valid && !isEmpty && (
        <p className="text-[11px] text-rose-600">
          Mã màu không hợp lệ. Định dạng đúng: #RGB, #RRGGBB, hoặc #RRGGBBAA.
        </p>
      )}
      {isEmpty && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Nhập mã hex hợp lệ (ví dụ #2563eb) hoặc bấm vòng tròn để chọn.
        </p>
      )}
      {pickerOpen && (
        <div className="relative">
          <div className="absolute right-0 z-50 mt-1 p-2 bg-white dark:bg-[#1a2436] rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg">
            <HexColorPicker
              color={valid ? draft : "#2563eb"}
              onChange={handlePicker}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const colorField = (label: string): CustomField<string> => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        <PaletteIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        {label}
      </div>
      <ColorInput
        value={value ?? ""}
        onChange={(next) => onChange(next as string)}
      />
    </div>
  ),
});
