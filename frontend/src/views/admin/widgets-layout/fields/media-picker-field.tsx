"use client";

import type { CustomField } from "@puckeditor/core";
import { useState } from "react";
import { resolveMediaUrl } from "@/lib/api";
import { MediaPickerModal } from "./media-picker-modal";

type MediaPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const MediaPickerInput = ({
  value,
  onChange,
  placeholder = "https://… hoặc chọn từ thư viện",
}: MediaPickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const preview = resolveMediaUrl(value);

  return (
    <div className="space-y-2 min-w-0">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 px-2 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">
          photo_library
        </span>
        Chọn từ thư viện
      </button>
      {preview && (
        <div className="rounded-md overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
          {/** biome-ignore lint/performance/noImgElement: user uploads not allowlisted in next images */}
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      )}
      {open && (
        <MediaPickerModal onSelect={onChange} onClose={() => setOpen(false)} />
      )}
    </div>
  );
};

export const mediaPickerField = (label: string): CustomField<string> => ({
  type: "custom",
  label,
  render: ({ value, onChange }) => (
    <MediaPickerInput value={value ?? ""} onChange={onChange} />
  ),
});
