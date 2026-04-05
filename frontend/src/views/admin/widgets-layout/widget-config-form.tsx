"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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

  const isLongText = (value: any) =>
    typeof value === "string" && value.length > 60;

  return (
    <div className="space-y-3">
      {Object.entries(configSchema).map(([key, schema]) => (
        <div key={key}>
          {schema.type === "boolean" ? (
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                {schema.label}
              </Label>
              <Switch
                size="sm"
                checked={!!local[key]}
                onCheckedChange={(v) => update(key, v)}
              />
            </div>
          ) : (
            <Label className="text-xs text-muted-foreground block mb-1">
              {schema.label}
            </Label>
          )}

          {schema.type === "string" && !isLongText(local[key]) && (
            <Input
              value={local[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="h-7 text-xs"
            />
          )}

          {schema.type === "string" && isLongText(local[key]) && (
            <Textarea
              value={local[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              rows={3}
              className="text-xs resize-y"
            />
          )}

          {schema.type === "number" && (
            <Input
              type="number"
              value={local[key] ?? ""}
              min={schema.min}
              max={schema.max}
              onChange={(e) => update(key, Number(e.target.value))}
              className="h-7 text-xs"
            />
          )}

          {schema.type === "select" && (
            <Select
              value={local[key] ?? ""}
              onValueChange={(v) => update(key, v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schema.options?.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {schema.type === "multi-select" && (
            <div className="flex flex-wrap gap-1">
              {schema.options?.map((opt) => {
                const selected = (local[key] || []).includes(opt);
                return (
                  <Badge
                    key={opt}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => {
                      const current = local[key] || [];
                      update(
                        key,
                        selected
                          ? current.filter((v: string) => v !== opt)
                          : [...current, opt],
                      );
                    }}
                  >
                    {opt}
                  </Badge>
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
        <Button size="sm" className="w-full" onClick={handleSave}>
          Save Changes
        </Button>
      )}
    </div>
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
          className="flex items-start gap-1 p-2 rounded-md bg-muted/50 border"
        >
          <div className="flex-1 space-y-1">
            {keys.map((field) => (
              <div key={field} className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground w-10 shrink-0 text-right truncate">
                  {field}
                </span>
                <Input
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
                  className="h-6 text-[10px] flex-1"
                />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeItem(idx)}
            className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined text-[12px]">close</span>
          </Button>
        </div>
      ))}
      <Button variant="outline" size="xs" className="w-full" onClick={addItem}>
        <span className="material-symbols-outlined text-[12px]">add</span>
        Add Item
      </Button>
    </div>
  );
}
