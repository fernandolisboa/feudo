import {
  categoryOf,
  dashboardMonthRange,
  parseYearMonth,
  yearMonthDayRange,
  type DashboardLine,
  type KindContext,
  type YearMonth,
} from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { readHouseholdLedger } from "./ledger-read";
import { createHouseholdLedgerRepository } from "./repository";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";

function monthOfDate(date: string): YearMonth {
  return parseYearMonth(date.slice(0, 7));
}

export function toDashboardLine(row: ResolvedLedgerRow, kinds: KindContext): DashboardLine {
  return {
    month: monthOfDate(row.date),
    kind: row.kind,
    type: row.type,
    amountCentavos: row.amountCentavos,
    categoryId: row.categorization ? categoryOf(row.categorization.subcategory, kinds) : null,
    currency: row.currency,
  };
}

export function toDashboardLines(
  rows: readonly ResolvedLedgerRow[],
  kinds: KindContext,
): DashboardLine[] {
  return rows.map((row) => toDashboardLine(row, kinds));
}

// The one read path behind every household-currency calculation keyed off
// packages/core's dashboardMonthRange (Visão geral's tiles, the Reserva
// page's live numbers, the reserve month-close job): reads the household's
// ledger over the six-month window ending on `month`, through
// readHouseholdLedger (design contract's #16 shared read path), and maps
// each row the one way every caller agrees on.
export async function readHouseholdDashboardLines(
  db: Database,
  scope: HouseholdScope,
  month: YearMonth,
  timeZone: string,
): Promise<DashboardLine[]> {
  const readRange = dashboardMonthRange(month);
  const dayRange = {
    from: yearMonthDayRange(readRange.from).from,
    to: yearMonthDayRange(month).to,
  };
  const { kinds, rows } = await readHouseholdLedger(db, scope, dayRange, null, timeZone);
  return toDashboardLines(rows, kinds);
}

// Whether the household has any bank account at all, the same check the
// overview and the Reserva page use for their own empty state (ADR-0011:
// one entry point, not a repeated query per slice).
export async function householdHasAccounts(db: Database, scope: HouseholdScope): Promise<boolean> {
  const accounts = await createHouseholdLedgerRepository(scope).listAccounts(db);
  return accounts.length > 0;
}
