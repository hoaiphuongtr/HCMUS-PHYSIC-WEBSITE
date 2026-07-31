import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

const API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

// Cache the set of published static-page slugs so the middleware only ever
// rewrites REAL static pages — every other route (locales, /vendor, CMS pages,
// unknown 404s) is left completely untouched. Refreshed at most once per minute.
let cache: { slugs: Set<string>; at: number } | null = null;
const TTL = 60_000;

async function staticSlugs(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL) return cache.slugs;
  try {
    const res = await fetch(`${API}/static-pages/slugs`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const slugs = (await res.json()) as string[];
      cache = { slugs: new Set(slugs), at: Date.now() };
    }
  } catch {
    // transient backend hiccup — keep serving from the previous cache if any
  }
  return cache?.slugs ?? new Set();
}

export async function middleware(req: NextRequest) {
  const seg = req.nextUrl.pathname.slice(1);
  // Candidate = a single top-level segment that is NOT a real locale.
  if (!seg || seg.includes("/") || isLocale(seg)) return NextResponse.next();

  const slugs = await staticSlugs();
  if (!slugs.has(seg)) return NextResponse.next();

  // Serve the standalone page at its clean top-level URL by internally
  // resolving through the existing [locale]/[...slug] catch-all (URL unchanged).
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}/${seg}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip _next internals, api routes, and any file with an extension.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
