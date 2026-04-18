"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { visitorApi } from "@/lib/api";
import { getOrCreateVisitorId } from "@/lib/visitor";

export function useVisitorProfile() {
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  const query = useQuery({
    queryKey: ["VISITOR", "PROFILE", visitorId],
    queryFn: () => visitorApi.getProfile(visitorId),
    enabled: !!visitorId,
    staleTime: 60_000,
  });

  return {
    visitorId,
    tagWeights: query.data?.tagWeights || {},
    slugWeights: query.data?.slugWeights || {},
    subscribedTagSlugs: query.data?.subscribedTagSlugs || [],
    isLoading: query.isLoading,
  };
}

export function useVisitorSuggestions(limit = 6) {
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  return useQuery({
    queryKey: ["VISITOR", "SUGGESTIONS", visitorId, limit],
    queryFn: () => visitorApi.getSuggestions(visitorId, limit),
    enabled: !!visitorId,
    staleTime: 60_000,
  });
}
