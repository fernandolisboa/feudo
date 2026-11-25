import { cache } from "react";

import {
  dashboardMonthRange,
  formatYearMonth,
  HOUSEHOLD_CURRENCY,
  yearMonthOf,
  type KindContext,
} from "@feudo/core";

import type { HouseholdScope, HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";
import { getDb, type Database } from "@/platform/db/client";

import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { readHouseholdDashboardLines } from "./dashboard-lines";

export type UncategorizedWindow = {
  sinceLabel: string;
  kinds: KindContext;
  rows: ResolvedLedgerRow[];
};

// The same window and currency as the overview's numbers (dashboardMonthRange
// through readHouseholdDashboardLines, household currency only per
// ADR-0002): what is uncategorized here is exactly what keeps Visão geral and
// the reserve target incomplete. A foreign-currency row is in no number, so
// counting it would claim an incompleteness that categorizing cannot fix.
// Scope-only (no session) so analysis's category-suggestions service — which
// only ever holds a HouseholdScope, never a full session — can read the same
// window a press would send (ledger/ai-suggestion-candidates.ts). Not cached:
// that caller is its own request, with nothing else reading this window
// alongside it.
export async function readCategorizationWindowForScope(
  scope: HouseholdScope,
  db: Database,
  now: Date,
): Promise<UncategorizedWindow> {
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const month = yearMonthOf(now, timeZone);
  const { kinds, rows } = await readHouseholdDashboardLines(db, scope, month, timeZone);
  return {
    sinceLabel: formatYearMonth(dashboardMonthRange(month).from),
    kinds,
    rows: rows.filter((row) => row.currency === HOUSEHOLD_CURRENCY),
  };
}

// Shared by guided-categorization.ts and link-suggestions.ts: link
// suggestions need this same window and currency, every resolved row, not
// only the uncategorized ones. Wrapped in React's cache() (same pattern as
// auth/session.ts's getCurrentSession) so the Categorias and Vínculos tabs of
// one /categorizar request, called with the same `now`, share one DB round
// trip instead of reading the window twice; outside a request (and this
// module's own tests) cache() is a no-op and every call runs fresh.
async function readCategorizationWindowUncached(
  session: HouseholdSession,
  now: Date,
): Promise<UncategorizedWindow> {
  return readCategorizationWindowForScope(householdScope(session), getDb(), now);
}

export const readCategorizationWindow = cache(readCategorizationWindowUncached);
