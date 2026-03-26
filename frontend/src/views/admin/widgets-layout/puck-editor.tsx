"use client";

import { useMemo, useCallback } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import type { PageLayout } from "@/lib/api";
import { puckConfig } from "./puck-config";

export function PuckEditor({
  layout,
  onSave,
  isSaving,
}: {
  layout: PageLayout;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const initialData = useMemo(() => {
    if (layout.puckData) return layout.puckData;
    return { root: {}, content: [] };
  }, [layout.puckData]);

  const handlePublish = useCallback(
    (data: any) => {
      onSave(data);
    },
    [onSave],
  );

  return (
    <div className="puck-editor-wrapper h-full">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        headerTitle={layout.name}
        headerPath={`/${layout.slug}`}
      />
    </div>
  );
}
