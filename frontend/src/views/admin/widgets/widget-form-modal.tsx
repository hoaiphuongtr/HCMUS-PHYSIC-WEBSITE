"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { type WidgetType, widgetApi } from "@/lib/api";
import { SchemaBuilder } from "./schema-builder";

const CATEGORIES = [
  { value: "NAVIGATION", label: "Navigation" },
  { value: "FEED_COMPONENTS", label: "Feed & News" },
  { value: "CONTENT", label: "Content" },
  { value: "UTILITY_INFO", label: "Utility & Info" },
];

export function WidgetFormModal({
  widget,
  onClose,
  onSaved,
}: {
  widget: WidgetType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!widget;
  const [type, setType] = useState(widget?.type || "");
  const [name, setName] = useState(widget?.name || "");
  const [description, setDescription] = useState(widget?.description || "");
  const [category, setCategory] = useState(widget?.category || "CONTENT");
  const [icon, setIcon] = useState(widget?.icon || "widgets");
  const [configSchema, setConfigSchema] = useState<Record<string, any>>(
    widget?.configSchema || {},
  );
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJson, setRawJson] = useState(
    JSON.stringify(widget?.configSchema || {}, null, 2),
  );
  const [jsonError, setJsonError] = useState("");

  const createMutation = useMutation({
    mutationKey: ["WIDGETS", "CREATE"],
    mutationFn: widgetApi.create,
    onSuccess() {
      toast.success("Widget created");
      onSaved();
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to create widget");
    },
  });

  const updateMutation = useMutation({
    mutationKey: ["WIDGETS", "UPDATE"],
    mutationFn: (body: Partial<WidgetType>) =>
      widgetApi.update(widget!.id, body),
    onSuccess() {
      toast.success("Widget updated");
      onSaved();
    },
    onError(err: { message?: string }) {
      toast.error(err.message || "Failed to update widget");
    },
  });

  const handleTypeChange = (value: string) => {
    setType(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/(^_|_$)/g, ""),
    );
  };

  const handleRawJsonChange = (value: string) => {
    setRawJson(value);
    try {
      const parsed = JSON.parse(value);
      setConfigSchema(parsed);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  const handleSchemaChange = (schema: Record<string, any>) => {
    setConfigSchema(schema);
    setRawJson(JSON.stringify(schema, null, 2));
  };

  const buildDefaultConfig = () => {
    const defaults: Record<string, any> = {};
    for (const [key, field] of Object.entries(configSchema)) {
      const f = field as any;
      if (f.type === "boolean") defaults[key] = false;
      else if (f.type === "number") defaults[key] = f.min ?? 0;
      else if (f.type === "select") defaults[key] = f.options?.[0] ?? "";
      else if (f.type === "multi-select") defaults[key] = [];
      else if (f.type === "array") defaults[key] = [];
      else defaults[key] = "";
    }
    return defaults;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type,
      name,
      description: description || undefined,
      category,
      icon,
      configSchema,
      defaultConfig: buildDefaultConfig(),
    };
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? "Edit Widget Type" : "Create Widget Type"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type Identifier
              </label>
              <input
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                placeholder="MY_CUSTOM_WIDGET"
                required
                disabled={isEdit}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 font-mono disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Display Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Widget"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this widget do?"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Icon
              </label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-slate-500">
                    {icon || "widgets"}
                  </span>
                </div>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="material icon name"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Use{" "}
                <a
                  href="https://fonts.google.com/icons"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 underline"
                >
                  Material Symbols
                </a>{" "}
                icon names
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Config Schema
              </label>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">
                  {showRawJson ? "view_list" : "code"}
                </span>
                {showRawJson ? "Visual Editor" : "Raw JSON"}
              </button>
            </div>

            {showRawJson ? (
              <div>
                <textarea
                  value={rawJson}
                  onChange={(e) => handleRawJsonChange(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50 resize-none"
                />
                {jsonError && (
                  <p className="text-[10px] text-red-500 mt-1">{jsonError}</p>
                )}
              </div>
            ) : (
              <SchemaBuilder
                schema={configSchema}
                onChange={handleSchemaChange}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Widget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
