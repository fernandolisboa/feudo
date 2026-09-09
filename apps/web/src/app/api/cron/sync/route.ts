import { NextResponse } from "next/server";
import { tokensMatch } from "@/lib/timing-safe-token";

function isAuthorized(authorizationHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authorizationHeader) {
    return false;
  }
  return tokensMatch(`Bearer ${cronSecret}`, authorizationHeader);
}

export function GET(request: Request): NextResponse {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
