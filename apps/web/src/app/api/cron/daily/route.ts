import { NextResponse } from "next/server";

import { getDb } from "@/platform/db/client";
import { isCronRequestAuthorized } from "@/platform/cron-auth";
import { runDailyPruneStep as runAuthPruneStep } from "@/modules/auth";
import { runDailyPruneStep as runHouseholdsPruneStep } from "@/modules/households";
import { runDailyRefreshStep } from "@/modules/market-data";
import { runDailyPruneStep as runSyncPruneStep } from "@/modules/sync";

export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = getDb();
  const pruneVerification = await runAuthPruneStep(db);
  const pruneInvitations = await runHouseholdsPruneStep(db);
  const pruneConsents = await runSyncPruneStep(db);
  const marketData = await runDailyRefreshStep(db);
  const marketDataOk = "error" in marketData ? false : marketData.ok;
  const pruneVerificationOk = !("error" in pruneVerification);
  const pruneInvitationsOk = !("error" in pruneInvitations);
  const pruneConsentsOk = !("error" in pruneConsents);
  const ok = marketDataOk && pruneVerificationOk && pruneInvitationsOk && pruneConsentsOk;

  return NextResponse.json(
    { ok, steps: { pruneVerification, pruneInvitations, pruneConsents, marketData } },
    { status: ok ? 200 : 500 },
  );
}
