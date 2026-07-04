"use client";

// Auto-runs the first-login "tab tour". Reads the profile (same query the sidebar
// uses); if the user has never completed the tour (tourCompletedAt == null), runs
// the overview once, then persists completion so it never nags again.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api";
import { OVERVIEW_STEPS } from "@/lib/tour/content";
import { runOverview, waitForElement } from "@/lib/tour/driver";

export function OnboardingTour() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["AUTH", "PROFILE"],
    queryFn: authApi.getProfile,
  });
  const started = useRef(false);

  useEffect(() => {
    if (!profile || started.current) return;
    if (profile.tourCompletedAt) return; // already onboarded
    started.current = true;

    let cancelled = false;
    void (async () => {
      // wait for the sidebar nav anchors to mount before highlighting
      await waitForElement('[data-tour="nav:/admin"]', 5000);
      if (cancelled) return;
      runOverview(OVERVIEW_STEPS, "vi", () => {
        authApi
          .completeTour()
          .catch(() => undefined)
          .finally(() => {
            queryClient.invalidateQueries({ queryKey: ["AUTH", "PROFILE"] });
          });
        toast.success(
          "Đã hoàn tất hướng dẫn. Bấm nút Trợ giúp (?) ở góc dưới bên phải bất cứ lúc nào.",
        );
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, queryClient]);

  return null;
}
