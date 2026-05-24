"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type AdminSelectOption = {
  value: string;
  label: string;
};

export function AdminSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  clearLabel,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly AdminSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearLabel?: string;
}) {
  return (
    <Select
      value={value === "" ? null : value}
      onValueChange={(next) => onChange(next ?? "")}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={[
          "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-white !h-[38px]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value === "" ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          <span className="flex flex-1 text-left">
            {options.find((o) => o.value === value)?.label ?? value}
          </span>
        )}
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
      >
        {clearLabel ? (
          <SelectItem value={null} className="text-sm italic text-slate-500">
            {clearLabel}
          </SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
