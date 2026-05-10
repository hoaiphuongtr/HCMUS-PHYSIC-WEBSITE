import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

const LOCALE_PREFIXES = LOCALES.map((l) => `/${l}`);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    LOCALE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
