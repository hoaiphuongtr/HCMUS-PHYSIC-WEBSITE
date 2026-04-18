"use client";

import { useEffect } from "react";
import { visitorApi } from "@/lib/api";
import { getOrCreateVisitorId } from "@/lib/visitor";

export function useTrackSlug(slug: string | undefined | null) {
  useEffect(() => {
    if (!slug) return;
    const key = `tracked:${slug}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(key)) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    window.sessionStorage.setItem(key, "1");
    visitorApi.trackSlug(visitorId, slug).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [slug]);
}

export function useTrackPost(postId: string | undefined | null) {
  useEffect(() => {
    if (!postId) return;
    const key = `post-read:${postId}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(key)) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    window.sessionStorage.setItem(key, "1");
    visitorApi.trackPost(visitorId, postId).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [postId]);
}
