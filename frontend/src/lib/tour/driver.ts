"use client";

// Tour engine built on driver.js (v1, framework-agnostic — safe on React 19).
// Exposes: the sidebar force-expand signal, a DOM wait helper, the first-login
// OVERVIEW tour, and the interactive WALKTHROUGH runner (handles route changes
// + mount-on-open portals like the Puck save menu).
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { type LocalizedString, t } from "@/lib/i18n";
import type { Locale, WalkStep, Walkthrough } from "./content";

// --- sidebar force-expand (the admin sidebar is hover-collapsed) --------------
export const SIDEBAR_TOUR_EVENT = "tour:sidebar";
export function setSidebarForced(open: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIDEBAR_TOUR_EVENT, { detail: open }));
}

// --- wait for an element to appear (route change / portal mount) --------------
export function waitForElement(
  selector: string,
  timeoutMs = 7000,
): Promise<Element | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  const existing = document.querySelector(selector);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      obs.disconnect();
      resolve(document.querySelector(selector));
    }, timeoutMs);
  });
}

const labels = (locale: Locale) => ({
  nextBtnText: locale === "en" ? "Next ›" : "Tiếp ›",
  prevBtnText: locale === "en" ? "‹ Back" : "‹ Quay lại",
  doneBtnText: locale === "en" ? "Done" : "Hoàn tất",
});

// --- OVERVIEW (first-login tab tour) -----------------------------------------
export type OverviewStep = {
  selector: string;
  title: LocalizedString;
  body: LocalizedString;
};

export function runOverview(
  steps: OverviewStep[],
  locale: Locale,
  onDone: () => void,
): Driver {
  setSidebarForced(true);
  const present = steps.filter((s) => document.querySelector(s.selector));
  const d = driver({
    showProgress: true,
    allowClose: true,
    stagePadding: 6,
    popoverClass: "hcmus-tour",
    ...labels(locale),
    steps: present.map((s) => ({
      element: s.selector,
      popover: {
        title: t(s.title, locale),
        description: t(s.body, locale),
        side: "right",
        align: "start",
      },
    })),
    onDestroyed: () => {
      setSidebarForced(false);
      onDone();
    },
  });
  d.drive();
  return d;
}

// --- interactive WALKTHROUGH runner ------------------------------------------
// Navigates to each step's route if needed, runs its preAction (e.g. open a
// menu), waits for the anchor, then highlights. driver's onNextClick is
// overridden so we control async advancement.
export async function runWalkthrough(
  wt: Walkthrough,
  opts: {
    locale: Locale;
    prefix: string; // "/vi" | "/en" — locale prefix; admin routes are locale-less, kept for parity
    navigate: (path: string) => void;
    toast: (msg: string) => void;
    onDone?: () => void;
  },
): Promise<void> {
  const { locale, navigate, toast, onDone } = opts;
  const steps = wt.steps;

  const prepare = async (step: WalkStep): Promise<Element | null> => {
    if (step.route && !window.location.pathname.startsWith(step.route)) {
      navigate(step.route);
    }
    step.preAction?.();
    return waitForElement(step.selector, step.waitMs ?? 7000);
  };

  const firstEl = await prepare(steps[0]);
  if (!firstEl) {
    toast(
      locale === "en"
        ? "Couldn't open the walkthrough (element not found)."
        : "Không mở được hướng dẫn (không tìm thấy phần tử).",
    );
    onDone?.();
    return;
  }

  let d: Driver;
  let advancing = false;
  const detachers: Array<() => void> = [];
  const clearClickAdvancers = () => {
    while (detachers.length) detachers.pop()?.();
  };

  // For a step flagged advanceOnClick, clicking the real highlighted element
  // advances the tour itself — so the guide stays in sync with what the user does.
  const attachClickAdvance = (idx: number) => {
    const step = steps[idx];
    if (!step?.advanceOnClick) return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    const handler = () => {
      el.removeEventListener("click", handler, true);
      void goNext(true);
    };
    el.addEventListener("click", handler, true);
    detachers.push(() => el.removeEventListener("click", handler, true));
  };

  // userActed = the user performed the real action (clicked the highlighted
  // element) rather than pressing "Next"; in that case skip the next step's
  // preAction, which would redo/undo what the user just did.
  const goNext = async (userActed: boolean) => {
    if (advancing) return;
    advancing = true;
    clearClickAdvancers();
    const idx = d.getActiveIndex() ?? 0;
    const next = steps[idx + 1];
    if (!next) {
      d.destroy();
      advancing = false;
      return;
    }
    if (next.route && !window.location.pathname.startsWith(next.route)) {
      navigate(next.route);
    }
    if (!userActed) next.preAction?.();
    const el = await waitForElement(next.selector, next.waitMs ?? 7000);
    if (!el) {
      toast(
        locale === "en"
          ? `Skipped a step: ${t(next.title, locale)}`
          : `Đã bỏ qua một bước: ${t(next.title, locale)}`,
      );
    }
    d.moveNext();
    attachClickAdvance(idx + 1);
    advancing = false;
  };

  const stepDefs = steps.map((s) => ({
    element: s.selector,
    popover: {
      title: t(s.title, locale),
      description: t(s.body, locale),
      side: s.side ?? ("bottom" as const),
      align: "start" as const,
    },
  }));

  d = driver({
    showProgress: true,
    allowClose: true,
    stagePadding: 6,
    popoverClass: "hcmus-tour",
    ...labels(locale),
    steps: stepDefs,
    onNextClick: () => {
      void goNext(false);
    },
    onPrevClick: () => {
      clearClickAdvancers();
      d.movePrevious();
    },
    onDestroyed: () => {
      clearClickAdvancers();
      onDone?.();
    },
  });
  d.drive();
  attachClickAdvance(0);
}
