import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, reason: "REVALIDATE_TOKEN not configured" },
      { status: 500 },
    );
  }
  const provided = request.headers.get("x-revalidate-token");
  if (provided !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { tags?: unknown };
  try {
    body = (await request.json()) as { tags?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid body" },
      { status: 400 },
    );
  }
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  return NextResponse.json({ ok: true, revalidated: tags });
}
