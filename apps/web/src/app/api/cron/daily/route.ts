import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { isCronRequestAuthorized } from "@/lib/cron-auth";
import { refreshMarketData } from "@/lib/market-data";
import { pruneExpiredVerifications } from "@/modules/auth";

import type { Database } from "@/db/client";

type MarketDataStep = Awaited<ReturnType<typeof refreshMarketData>> | { error: string };
type PruneVerificationStep = { deleted: number } | { error: string };

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

async function runPruneVerificationStep(db: Database): Promise<PruneVerificationStep> {
  try {
    const deleted = await pruneExpiredVerifications(db);
    return { deleted };
  } catch (error) {
    return { error: errorName(error) };
  }
}

async function runMarketDataStep(db: Database): Promise<MarketDataStep> {
  try {
    return await refreshMarketData(db);
  } catch (error) {
    return { error: errorName(error) };
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = getDb();
  const pruneVerification = await runPruneVerificationStep(db);
  const marketData = await runMarketDataStep(db);
  const marketDataOk = "error" in marketData ? false : marketData.ok;
  const pruneVerificationOk = !("error" in pruneVerification);
  const ok = marketDataOk && pruneVerificationOk;

  return NextResponse.json(
    { ok, steps: { marketData, pruneVerification } },
    { status: ok ? 200 : 500 },
  );
}
