import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";
import legacyRedirects from "@/lib/legacy-redirects.json";

const LOCALE_PREFIXES = LOCALES.map((l) => `/${l}`);
const REDIRECTS = legacyRedirects as Record<string, string>;

export function proxy(request: NextRequest) {
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

  // No locale prefix → send to the default locale (also apply a redirect if the
  // bare path matches a moved slug).
  const bare = pathname === "/" ? "" : pathname.replace(/^\//, "");
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
