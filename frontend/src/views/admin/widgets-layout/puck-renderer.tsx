"use client";

import { Render } from "@puckeditor/core";
import { puckConfig } from "./puck-config";

export function PuckRenderer({ puckData }: { puckData: any }) {
  if (!puckData) return null;
  return <Render config={puckConfig} data={puckData} />;
}
