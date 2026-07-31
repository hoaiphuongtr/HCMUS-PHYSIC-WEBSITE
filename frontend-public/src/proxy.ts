import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import legacyRedirects from "@/lib/legacy-redirects.json";

const LOCALE_PREFIXES = LOCALES.map((l) => `/${l}`);
const REDIRECTS = legacyRedirects as Record<string, string>;

const API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

// Cache published static-page slugs so we only REWRITE real static pages to a
// clean top-level URL — every other non-locale path keeps its existing
// redirect-to-default-locale behaviour. Refreshed at most once per minute.
let slugCache: { slugs: Set<string>; at: number } | null = null;
const SLUG_TTL = 60_000;
async function staticSlugs(): Promise<Set<string>> {
  if (slugCache && Date.now() - slugCache.at < SLUG_TTL) return slugCache.slugs;
  try {
    const res = await fetch(`${API}/static-pages/slugs`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const slugs = (await res.json()) as string[];
      // lower-cased so the match below is case-insensitive (/ICEBA2026 works)
      slugCache = {
        slugs: new Set(slugs.map((s) => s.toLowerCase())),
        at: Date.now(),
      };
    }
  } catch {
    // keep any previous cache on a transient backend hiccup
  }
  return slugCache?.slugs ?? new Set();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localePrefix = LOCALE_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (localePrefix) {
    // Department re-slug redirects: old flat tin-tuc/… → <dept-slug>/tin-tuc/…
    const rest = pathname.slice(localePrefix.length + 1);
    const target = REDIRECTS[rest];
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = `${localePrefix}/${target}`;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // No locale prefix.
  const bare = pathname === "/" ? "" : pathname.replace(/^\//, "");

  // A published standalone static page (single-segment slug) is served at its
  // clean top-level URL via an internal REWRITE (URL stays /iceba2023) instead of
  // the default redirect to /vi. Everything else keeps the redirect below.
  if (bare && !bare.includes("/")) {
    const slugs = await staticSlugs();
    if (slugs.has(bare.toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}/${bare}`;
      return NextResponse.rewrite(url);
    }
  }

  // No locale prefix → send to the default locale (also apply a redirect if the
  // bare path matches a moved slug).
  const moved = bare ? REDIRECTS[bare] : undefined;
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${bare ? `/${moved ?? bare}` : ""}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|fonts|favicon|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)).*)",
  ],
};
