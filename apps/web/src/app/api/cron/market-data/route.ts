import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { isCronRequestAuthorized } from "@/lib/cron-auth";
import { refreshMarketData } from "@/lib/market-data/refresh-market-data";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const results = await refreshMarketData(getDb());
  return NextResponse.json({ ok: true, results });
}
