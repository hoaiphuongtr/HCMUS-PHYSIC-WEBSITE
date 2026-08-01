import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import legacyRedirects from "@/lib/legacy-redirects.json";

const LOCALE_PREFIXES = LOCALES.map((l) => `/${l}`);
const REDIRECTS = legacyRedirects as Record<string, string>;

const API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

// Published static pages, cached ≤60s:
//  - slugs: html-only pages → rewritten to the [locale] catch-all (iframe render).
//  - bundles: folder microsites (.zip) → slug ⇒ served base dir; requests to
//    /<slug>/* are proxied straight to the extracted files.
type Caches = { slugs: Set<string>; bundles: Map<string, string>; at: number };
let cache: Caches | null = null;
const TTL = 60_000;

async function loadCaches(): Promise<Caches> {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const next: Caches = { slugs: new Set(), bundles: new Map(), at: Date.now() };
  try {
    const [slugsRes, bundlesRes] = await Promise.all([
      fetch(`${API}/static-pages/slugs`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${API}/static-pages/bundles`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      }),
    ]);
    if (slugsRes.ok) {
      const slugs = (await slugsRes.json()) as string[];
      slugs.forEach((s) => next.slugs.add(s.toLowerCase()));
    }
    if (bundlesRes.ok) {
      const rows = (await bundlesRes.json()) as {
        slug: string;
        bundlePath: string | null;
      }[];
      for (const r of rows) {
        if (r.bundlePath) {
          next.bundles.set(
            r.slug.toLowerCase(),
            r.bundlePath.replace(/\/[^/]+$/, ""), // strip entry filename → base dir
          );
        }
      }
    }
    cache = next;
  } catch {
    // transient backend hiccup — keep serving from the previous cache if any
  }
  return cache ?? next;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSeg = (pathname.split("/")[1] || "").toLowerCase();

  const { slugs, bundles } = await loadCaches();

  // Folder microsite: serve /<slug> and /<slug>/* straight from the extracted
  // bundle. NO redirect (a trailing-slash redirect looped for absolute-path
  // builds) — the backend injects <base href="/slug/"> so relative-path builds
  // (CRA/Vite/Astro) resolve, and absolute-path builds (Next basePath) work as
  // is. A sub-path with no file extension falls back to index.html (SPA routing).
  const base = bundles.get(firstSeg);
  if (base) {
    const rest = pathname.slice(firstSeg.length + 1); // "" | "/" | "/x.js" | "/agenda"
    const isAsset =
      rest !== "" && rest !== "/" && /\.[a-z0-9]+$/i.test(rest);
    const entry = isAsset ? rest : "/index.html";
    const target = new URL(`${API}${base}${entry}`);
    target.search = request.nextUrl.search;
    return NextResponse.rewrite(target);
  }

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

  // Html static page (no bundle) → render at the clean top-level URL via the
  // [locale] catch-all (iframe), case-insensitive.
  if (bare && !bare.includes("/") && slugs.has(firstSeg)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}/${bare}`;
    return NextResponse.rewrite(url);
  }

  // Real files (public assets, favicon, sitemap, robots…) pass through as-is;
  // only bare paths fall through to the default-locale redirect.
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  const moved = bare ? REDIRECTS[bare] : undefined;
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${bare ? `/${moved ?? bare}` : ""}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|api/).*)"],
};
