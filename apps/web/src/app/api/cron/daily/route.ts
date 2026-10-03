import { NextResponse } from "next/server";

import { getDb } from "@/platform/db/client";
import { isCronRequestAuthorized } from "@/platform/cron-auth";
import { runDailyPruneStep as runAuditPruneStep } from "@/modules/audit";
import { runDailyPruneStep as runAuthPruneStep } from "@/modules/auth";
import {
  runDailyPruneStep as runHouseholdsPruneStep,
  runHouseholdPurgeStep,
} from "@/modules/households";
import { runDailyRefreshStep } from "@/modules/market-data";
import { runAccountPurgeStep } from "@/modules/privacy";
import { runReserveMonthCloseStep } from "@/modules/reserve";
import { runDailyPruneStep as runSyncPruneStep } from "@/modules/sync";

export const maxDuration = 60;

// Mirrors sync's own RUN_HEADROOM_MS (sync/service.ts): what the month-close
// step's in-flight household write (which does not observe the deadline, so
// it must be short) and this route's own JSON response need back once the
// last household's close returns.
const RESERVE_RUN_HEADROOM_MS = 15_000;

// Accounts past their deletion grace are normally none or a handful; this
// caps how much of the route's budget a backlog can take from the steps
// after it, and what is left over waits for tomorrow's run.
const ACCOUNT_PURGE_BUDGET_MS = 20_000;

export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Stamped once, before any step runs: the reserve step's deadline is this
  // route's own real time budget (maxDuration), not a fresh clock reset to
  // whatever is left once the three prune steps and market data have already
  // run ahead of it.
  const requestStartedAt = Date.now();
  const db = getDb();
  const pruneVerification = await runAuthPruneStep(db);
  const pruneInvitations = await runHouseholdsPruneStep(db);
  const pruneConsents = await runSyncPruneStep(db);
  const pruneAuditLog = await runAuditPruneStep(db);
  const purgeAccounts = await runAccountPurgeStep(
    db,
    new Date(),
    new Date(requestStartedAt + ACCOUNT_PURGE_BUDGET_MS),
  );
  const purgeHouseholds = await runHouseholdPurgeStep(db, new Date());
  const marketData = await runDailyRefreshStep(db);
  const reserveMonthClose = await runReserveMonthCloseStep(
    db,
    new Date(),
    new Date(requestStartedAt + maxDuration * 1000 - RESERVE_RUN_HEADROOM_MS),
  );
  const marketDataOk = "error" in marketData ? false : marketData.ok;
  const pruneVerificationOk = !("error" in pruneVerification);
  const pruneInvitationsOk = !("error" in pruneInvitations);
  const pruneConsentsOk = !("error" in pruneConsents);
  const pruneAuditLogOk = !("error" in pruneAuditLog);
  const reserveMonthCloseOk = "error" in reserveMonthClose ? false : reserveMonthClose.ok;
  const purgeAccountsOk = "error" in purgeAccounts ? false : purgeAccounts.ok;
  const purgeHouseholdsOk = !("error" in purgeHouseholds);
  const ok =
    marketDataOk &&
    pruneVerificationOk &&
    pruneInvitationsOk &&
    pruneConsentsOk &&
    pruneAuditLogOk &&
    purgeAccountsOk &&
    purgeHouseholdsOk &&
    reserveMonthCloseOk;

  return NextResponse.json(
    {
      ok,
      steps: {
        pruneVerification,
        pruneInvitations,
        pruneConsents,
        pruneAuditLog,
        purgeAccounts,
        purgeHouseholds,
        marketData,
        reserveMonthClose,
      },
    },
    { status: ok ? 200 : 500 },
  );
}
