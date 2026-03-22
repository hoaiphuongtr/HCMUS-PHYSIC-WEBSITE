"use client";

import { useState, useEffect } from "react";

type FieldSchema = {
  type: string;
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  itemSchema?: Record<string, string>;
};

export function WidgetConfigForm({
  configSchema,
  config,
  onSave,
}: {
  configSchema: Record<string, FieldSchema>;
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
}) {
  const [local, setLocal] = useState<Record<string, any>>(config);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(config);
    setDirty(false);
  }, [config]);

  const update = (key: string, value: any) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(local);
    setDirty(false);
  };

  const isLongText = (key: string, value: any) =>
    typeof value === "string" &&
    (value.length > 60 ||
      (key.toLowerCase().includes("url") === false && value.includes("\n")));

  return (
    <div className="space-y-3">
      {Object.entries(configSchema).map(([key, schema]) => (
        <div key={key}>
          <label className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>{schema.label}</span>
            {schema.type === "boolean" && (
              <Toggle checked={!!local[key]} onChange={(v) => update(key, v)} />
            )}
          </label>

          {schema.type === "string" && !isLongText(key, local[key]) && (
            <input
              type="text"
              value={local[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 bg-white"
            />
          )}

          {schema.type === "string" && isLongText(key, local[key]) && (
            <textarea
              value={local[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 bg-white resize-y"
            />
          )}

          {schema.type === "number" && (
            <input
              type="number"
              value={local[key] ?? ""}
              min={schema.min}
              max={schema.max}
              onChange={(e) => update(key, Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 bg-white"
            />
          )}

          {schema.type === "select" && (
            <select
              value={local[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 bg-white"
            >
              {schema.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {schema.type === "multi-select" && (
            <div className="flex flex-wrap gap-1">
              {schema.options?.map((opt) => {
                const selected = (local[key] || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const current = local[key] || [];
                      update(
                        key,
                        selected
                          ? current.filter((v: string) => v !== opt)
                          : [...current, opt],
                      );
                    }}
                    className={
                      "px-2 py-0.5 text-[10px] rounded border transition-colors " +
                      (selected
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300")
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {schema.type === "array" && schema.itemSchema && (
            <ArrayFieldEditor
              items={local[key] || []}
              itemSchema={schema.itemSchema}
              onChange={(items) => update(key, items)}
            />
          )}
        </div>
      ))}

      {dirty && (
        <button
          onClick={handleSave}
          className="w-full py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors " +
        (checked ? "bg-blue-500" : "bg-slate-300")
      }
    >
      <span
        className={
          "inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform " +
          (checked ? "translate-x-3.5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

function ArrayFieldEditor({
  items,
  itemSchema,
  onChange,
}: {
  items: Record<string, any>[];
  itemSchema: Record<string, string>;
  onChange: (items: Record<string, any>[]) => void;
}) {
  const keys = Object.keys(itemSchema);

  const addItem = () => {
    const newItem: Record<string, any> = {};
    for (const k of keys) {
      newItem[k] = itemSchema[k] === "number" ? 0 : "";
    }
    onChange([...items, newItem]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-1 p-2 rounded-md bg-slate-50 border border-slate-100"
        >
          <div className="flex-1 space-y-1">
            {keys.map((field) => (
              <div key={field} className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 w-10 shrink-0 text-right truncate">
                  {field}
                </span>
                <input
                  type={itemSchema[field] === "number" ? "number" : "text"}
                  value={item[field] ?? ""}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      field,
                      itemSchema[field] === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  className="flex-1 px-2 py-0.5 text-[10px] border border-slate-200 rounded bg-white outline-none focus:ring-1 focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => removeItem(idx)}
            className="p-0.5 text-slate-400 hover:text-red-500 shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full py-1 text-[10px] font-medium text-blue-600 border border-dashed border-blue-200 rounded-md hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[12px]">add</span>
        Add Item
      </button>
    </div>
  );
}
