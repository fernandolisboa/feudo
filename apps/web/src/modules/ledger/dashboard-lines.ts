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

export type HouseholdDashboardLines = {
  rows: ResolvedLedgerRow[];
  kinds: KindContext;
  lines: DashboardLine[];
};

// The one read path behind every household-currency calculation keyed off
// packages/core's dashboardMonthRange (Visão geral's tiles, the Reserva
// page's live numbers, the reserve month-close job all call this, never
// their own copy of the window math): reads the household's ledger over the
// six-month window ending on `month`, through readHouseholdLedger (design
// contract's #16 shared read path), and maps each row the one way every
// caller agrees on. Callers that only need the computed lines destructure
// `lines`; the overview also needs the raw `rows` for its own uncategorized
// count, and `kinds` is returned alongside for a caller that needs to map
// more rows the same way later.
export async function readHouseholdDashboardLines(
  db: Database,
  scope: HouseholdScope,
  month: YearMonth,
  timeZone: string,
): Promise<HouseholdDashboardLines> {
  const readRange = dashboardMonthRange(month);
  const dayRange = {
    from: yearMonthDayRange(readRange.from).from,
    to: yearMonthDayRange(month).to,
  };
  const { kinds, rows } = await readHouseholdLedger(db, scope, dayRange, null, timeZone);
  return { rows, kinds, lines: toDashboardLines(rows, kinds) };
}

// Whether the household has any bank account at all, the same check the
// overview and the Reserva page use for their own empty state (ADR-0011:
// one entry point, not a repeated query per slice).
export async function householdHasAccounts(db: Database, scope: HouseholdScope): Promise<boolean> {
  const accounts = await createHouseholdLedgerRepository(scope).listAccounts(db);
  return accounts.length > 0;
}
