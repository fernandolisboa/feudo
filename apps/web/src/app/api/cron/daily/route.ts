import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { isCronRequestAuthorized } from "@/lib/cron-auth";
import { refreshMarketData } from "@/lib/market-data";
import { pruneExpiredVerifications } from "@/modules/auth";

import type { Database } from "@/db/client";
import type { RefreshSeriesResult } from "@/lib/market-data";

type MarketDataStep = { ok: boolean; results: RefreshSeriesResult[] } | { error: string };
type PruneVerificationStep = { deleted: number } | { error: string };

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

async function runMarketDataStep(db: Database): Promise<MarketDataStep> {
  try {
    const results = await refreshMarketData(db);
    const everySeriesSkipped = results.every((result) => result.outcome === "skipped");
    return { ok: !everySeriesSkipped, results };
  } catch (error) {
    return { error: errorName(error) };
  }
}

async function runPruneVerificationStep(db: Database): Promise<PruneVerificationStep> {
  try {
    const deleted = await pruneExpiredVerifications(db);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = getDb();
  const marketData = await runMarketDataStep(db);
  const pruneVerification = await runPruneVerificationStep(db);
  const marketDataOk = "error" in marketData ? false : marketData.ok;
  const pruneVerificationOk = !("error" in pruneVerification);
  const ok = marketDataOk && pruneVerificationOk;

  return NextResponse.json(
    { ok, steps: { marketData, pruneVerification } },
    { status: ok ? 200 : 500 },
  );
}
