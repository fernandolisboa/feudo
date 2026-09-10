import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { isCronRequestAuthorized } from "@/lib/cron-auth";
import { refreshMarketData } from "@/lib/market-data";
import { pruneExpiredVerifications } from "@/modules/auth";
import { pruneExpiredInvitations } from "@/modules/households";

import type { Database } from "@/db/client";

export const maxDuration = 60;

type MarketDataStep = Awaited<ReturnType<typeof refreshMarketData>> | { error: string };
type PruneVerificationStep = { deleted: number } | { error: string };
type PruneInvitationsStep = { deleted: number } | { error: string };

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

async function runPruneInvitationsStep(db: Database): Promise<PruneInvitationsStep> {
  try {
    const deleted = await pruneExpiredInvitations(db);
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
  const pruneInvitations = await runPruneInvitationsStep(db);
  const marketData = await runMarketDataStep(db);
  const marketDataOk = "error" in marketData ? false : marketData.ok;
  const pruneVerificationOk = !("error" in pruneVerification);
  const pruneInvitationsOk = !("error" in pruneInvitations);
  const ok = marketDataOk && pruneVerificationOk && pruneInvitationsOk;

  return NextResponse.json(
    { ok, steps: { pruneVerification, pruneInvitations, marketData } },
    { status: ok ? 200 : 500 },
  );
}
