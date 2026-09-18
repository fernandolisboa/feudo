import { NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/platform/cron-auth";

export function GET(request: Request): NextResponse {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
