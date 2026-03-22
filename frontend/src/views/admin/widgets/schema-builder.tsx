"use client";

import { useState } from "react";

type FieldDef = {
  type: string;
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  itemSchema?: Record<string, string>;
};

const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Toggle" },
  { value: "select", label: "Dropdown" },
  { value: "multi-select", label: "Multi-Select" },
  { value: "array", label: "Array / List" },
];

export function SchemaBuilder({
  schema,
  onChange,
}: {
  schema: Record<string, FieldDef>;
  onChange: (schema: Record<string, FieldDef>) => void;
}) {
  const [newKey, setNewKey] = useState("");

  const entries = Object.entries(schema);

  const updateField = (key: string, field: Partial<FieldDef>) => {
    onChange({ ...schema, [key]: { ...schema[key], ...field } });
  };

  const removeField = (key: string) => {
    const next = { ...schema };
    delete next[key];
    onChange(next);
  };

  const addField = () => {
    const key = newKey
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    if (!key || schema[key]) return;
    onChange({
      ...schema,
      [key]: { type: "string", label: key },
    });
    setNewKey("");
  };

  return (
    <div className="space-y-3">
      {entries.map(([key, field]) => (
        <FieldRow
          key={key}
          fieldKey={key}
          field={field}
          onUpdate={(f) => updateField(key, f)}
          onRemove={() => removeField(key)}
        />
      ))}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="field_name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addField();
            }
          }}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 font-mono"
        />
        <button
          type="button"
          onClick={addField}
          disabled={!newKey.trim()}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Add Field
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-[10px] text-slate-400 text-center py-4">
          No fields yet. Add a field above to define the widget&apos;s
          configuration.
        </p>
      )}
    </div>
  );
}

function FieldRow({
  fieldKey,
  field,
  onUpdate,
  onRemove,
}: {
  fieldKey: string;
  field: FieldDef;
  onUpdate: (field: Partial<FieldDef>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = field.type === "select" || field.type === "multi-select";
  const isNumber = field.type === "number";
  const isArray = field.type === "array";
  const hasDetails = needsOptions || isNumber || isArray;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-[10px] font-mono text-slate-400 w-20 truncate shrink-0">
          {fieldKey}
        </span>
        <input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-200"
          placeholder="Label"
        />
        <select
          value={field.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          className="px-2 py-1 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-200 bg-white"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
          >
            <span className="material-symbols-outlined text-[14px]">
              {expanded ? "expand_less" : "settings"}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {expanded && hasDetails && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {needsOptions && (
            <OptionsEditor
              options={field.options || []}
              onChange={(options) => onUpdate({ options })}
            />
          )}
          {isNumber && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Min</span>
                <input
                  type="number"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-16 px-2 py-1 text-[10px] border border-slate-200 rounded outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Max</span>
                <input
                  type="number"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-16 px-2 py-1 text-[10px] border border-slate-200 rounded outline-none"
                />
              </div>
            </div>
          )}
          {isArray && (
            <ItemSchemaEditor
              itemSchema={field.itemSchema || {}}
              onChange={(itemSchema) => onUpdate({ itemSchema })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const [newOpt, setNewOpt] = useState("");

  const addOption = () => {
    if (!newOpt.trim() || options.includes(newOpt.trim())) return;
    onChange([...options, newOpt.trim()]);
    setNewOpt("");
  };

  return (
    <div>
      <span className="text-[10px] font-medium text-slate-500 mb-1 block">
        Options
      </span>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {options.map((opt) => (
          <span
            key={opt}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full"
          >
            {opt}
            <button
              type="button"
              onClick={() => onChange(options.filter((o) => o !== opt))}
              className="hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          value={newOpt}
          onChange={(e) => setNewOpt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
          placeholder="Add option..."
          className="flex-1 px-2 py-1 text-[10px] border border-slate-200 rounded outline-none"
        />
        <button
          type="button"
          onClick={addOption}
          className="text-[10px] text-blue-600 hover:underline"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ItemSchemaEditor({
  itemSchema,
  onChange,
}: {
  itemSchema: Record<string, string>;
  onChange: (schema: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState("");

  const addKey = () => {
    if (!newKey.trim() || itemSchema[newKey.trim()]) return;
    onChange({ ...itemSchema, [newKey.trim()]: "string" });
    setNewKey("");
  };

  return (
    <div>
      <span className="text-[10px] font-medium text-slate-500 mb-1 block">
        Item Fields
      </span>
      <div className="space-y-1 mb-1.5">
        {Object.entries(itemSchema).map(([key, type]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 w-16 truncate">
              {key}
            </span>
            <select
              value={type}
              onChange={(e) =>
                onChange({ ...itemSchema, [key]: e.target.value })
              }
              className="px-1.5 py-0.5 text-[10px] border border-slate-200 rounded bg-white outline-none"
            >
              <option value="string">string</option>
              <option value="number">number</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const next = { ...itemSchema };
                delete next[key];
                onChange(next);
              }}
              className="text-slate-400 hover:text-red-500"
            >
              <span className="material-symbols-outlined text-[12px]">
                close
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKey();
            }
          }}
          placeholder="field_name"
          className="flex-1 px-2 py-1 text-[10px] font-mono border border-slate-200 rounded outline-none"
        />
        <button
          type="button"
          onClick={addKey}
          className="text-[10px] text-blue-600 hover:underline"
        >
          Add
        </button>
      </div>
    </div>
  );
}
