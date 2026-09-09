import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { isCronRequestAuthorized } from "@/lib/cron-auth";
import { refreshMarketData } from "@/lib/market-data";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const results = await refreshMarketData(getDb());
  const everySeriesSkipped = results.every((result) => result.outcome === "skipped");
  return NextResponse.json(
    { ok: !everySeriesSkipped, results },
    { status: everySeriesSkipped ? 502 : 200 },
  );
}
