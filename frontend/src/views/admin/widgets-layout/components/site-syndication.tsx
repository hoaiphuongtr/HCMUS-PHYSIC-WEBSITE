"use client";

import type { ComponentConfig, Config } from "@puckeditor/core";
import { Render } from "@puckeditor/core";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const HOME_SLUG = "trang-chu";

type PuckNode = { type?: string; props?: Record<string, unknown> };
type PuckTree = {
  root?: unknown;
  content?: PuckNode[];
  zones?: Record<string, unknown>;
};

const findNode = (
  data: PuckTree | null | undefined,
  predicate: (n: PuckNode) => boolean,
): PuckNode | null => {
  if (!data?.content) return null;
  const walk = (nodes: unknown): PuckNode | null => {
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
      if (node && typeof node === "object") {
        const n = node as PuckNode;
        if (predicate(n)) return n;
        const props = (n.props ?? {}) as Record<string, unknown>;
        for (const value of Object.values(props)) {
          const inner = walk(value);
          if (inner) return inner;
        }
      }
    }
    return null;
  };
  return walk(data.content);
};

// Header and Footer both need the homepage layout (for the Navbar and
// FooterBlock nodes). Dedup + short-TTL cache so a page render fetches it once
// instead of twice, and rapid navigations reuse it.
const HOME_TTL_MS = 30_000;
let homeCache: { at: number; data: PuckTree | null } | null = null;
let homeInflight: Promise<PuckTree | null> | null = null;

const fetchHome = async (): Promise<PuckTree | null> => {
  if (homeCache && Date.now() - homeCache.at < HOME_TTL_MS) return homeCache.data;
  if (homeInflight) return homeInflight;
  homeInflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/page-layouts/slug/${HOME_SLUG}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const layout = (await res.json()) as {
        publishedPuckData: PuckTree | null;
        puckData: PuckTree | null;
      };
      return layout.publishedPuckData ?? layout.puckData ?? null;
    } catch {
      return null;
    }
  })()
    .then((data) => {
      homeCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      homeInflight = null;
    });
  return homeInflight;
};

type SyndicatedRenderProps = {
  nodeType: "Navbar" | "FooterBlock";
  fallback: React.ReactNode;
};

function SyndicatedRender({ nodeType, fallback }: SyndicatedRenderProps) {
  const [node, setNode] = useState<PuckNode | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [home, mod] = await Promise.all([
        fetchHome(),
        import("../puck-config"),
      ]);
      if (!alive) return;
      const found = findNode(home, (n) => n.type === nodeType);
      setNode(found);
      setConfig(mod.puckConfig);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [nodeType]);

  if (!loaded) {
    return (
      <div className="w-full h-16 bg-slate-50 dark:bg-[#121a2b] animate-pulse" />
    );
  }
  if (!node || !config) return <>{fallback}</>;

  const tree: PuckTree = { root: { props: {} }, content: [node] };
  return <Render config={config} data={tree as never} />;
}

export const Header: ComponentConfig<Record<string, never>> = {
  label: "Header",
  defaultProps: {},
  fields: {},
  render: () => (
    <SyndicatedRender
      nodeType="Navbar"
      fallback={
        <div className="px-6 py-3 text-xs text-slate-500">
          Header chưa cấu hình. Cập nhật Navbar ở layout "trang-chu".
        </div>
      }
    />
  ),
};

export const Footer: ComponentConfig<Record<string, never>> = {
  label: "Footer",
  defaultProps: {},
  fields: {},
  render: () => (
    <SyndicatedRender
      nodeType="FooterBlock"
      fallback={
        <div className="px-6 py-6 text-xs text-slate-500">
          Footer chưa cấu hình. Cập nhật FooterBlock ở layout "trang-chu".
        </div>
      }
    />
  ),
};
