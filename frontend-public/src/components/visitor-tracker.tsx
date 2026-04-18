"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )visitor_id=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  document.cookie = `visitor_id=${encodeURIComponent(id)}; max-age=${60 * 60 * 24 * 365 * 2}; path=/; samesite=lax`;
  return id;
}

export function VisitorTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `tracked:${slug}`;
    if (sessionStorage.getItem(key)) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    sessionStorage.setItem(key, "1");
    fetch(`${API_URL}/visitor/track-slug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, slug }),
    }).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, [slug]);
  return null;
}
