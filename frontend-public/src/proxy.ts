import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import legacyRedirects from "@/lib/legacy-redirects.json";

const LOCALE_PREFIXES = LOCALES.map((l) => `/${l}`);
const REDIRECTS = legacyRedirects as Record<string, string>;

const API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

// Published html static-page slugs, cached ≤60s, so a bare /<slug> is rewritten
// to the [locale] catch-all (iframe render) at a clean top-level URL. Bundle
// microsites (.zip) are served via the iframe in [...slug] too — the middleware
// stays narrow (excludes assets) so it never sits in the hot path for every file.
let slugCache: { slugs: Set<string>; at: number } | null = null;
const TTL = 60_000;

async function staticSlugs(): Promise<Set<string>> {
  if (slugCache && Date.now() - slugCache.at < TTL) return slugCache.slugs;
  try {
    const res = await fetch(`${API}/static-pages/slugs`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const slugs = (await res.json()) as string[];
      slugCache = {
        slugs: new Set(slugs.map((s) => s.toLowerCase())),
        at: Date.now(),
      };
    }
  } catch {
    // transient backend hiccup — keep serving from the previous cache if any
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
    const moved = REDIRECTS[rest];
    if (moved) {
      const url = request.nextUrl.clone();
      url.pathname = `${localePrefix}/${moved}`;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // No locale prefix.
  const bare = pathname === "/" ? "" : pathname.replace(/^\//, "");

  // Published static page → rewrite to the catch-all so it renders at the clean
  // top-level URL (case-insensitive).
  if (bare && !bare.includes("/")) {
    const slugs = await staticSlugs();
    if (slugs.has(bare.toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}/${bare}`;
      return NextResponse.rewrite(url);
    }
  }

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
