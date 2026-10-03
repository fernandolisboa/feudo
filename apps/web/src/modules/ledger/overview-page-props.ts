import {
  buildLedgerDashboard,
  formatBasisPointsPercent,
  formatCompactReais,
  formatMoney,
  formatYearMonth,
  HOUSEHOLD_CURRENCY,
  shiftYearMonth,
  summarizeUncategorized,
  yearMonthDayRange,
  yearMonthOf,
  type AverageFixedCost,
  type CategorySpending,
  type MonthlyPoint,
  type MonthTotals,
  type YearMonth,
} from "@feudo/core";

import { recordFinancialDataAccess } from "@/modules/audit";
import { interpolate, interpolateAll } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import type { HouseholdScope, HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";
import type { StatTileView } from "@/ui/stat-tile";

import { readHouseholdDashboardLines } from "./dashboard-lines";
import { createHouseholdLedgerRepository } from "./repository";
import { t } from "./strings";
import { overviewSearchParamsSchema, type OverviewSearchParams } from "./validation";

export type { StatTileView };

export type CategoryBarView = { key: string; label: string; amountLabel: string; fraction: number };

export type MonthlyBarPointView = {
  month: YearMonth;
  shortLabel: string;
  monthLabel: string;
  incomeCentavos: number;
  spendingCentavos: number;
  incomeAmountLabel: string;
  spendingAmountLabel: string;
  incomeCompactLabel: string;
  spendingCompactLabel: string;
};

export type OverviewPageProps = {
  month: YearMonth;
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  hasAccounts: boolean;
  inProgress: boolean;
  incomeCentavos: number;
  spendingCentavos: number;
  savingsRateBasisPoints: number | null;
  uncategorized: { count: number; amountLabel: string };
  hasOtherCurrencyRows: boolean;
  tiles: {
    income: StatTileView;
    spending: StatTileView;
    savingsRate: StatTileView;
    averageFixedCost: StatTileView;
  };
  categorySpending: CategoryBarView[];
  series: MonthlyBarPointView[];
};

// pt-BR short month names ("set.", "ago.") carry a trailing period Feudo
// never uses in a chart axis (DESIGN.md's formatting rules); UTC keeps the
// month's own first day from shifting into the neighboring month in a
// negative time zone.
function shortMonthLabel(month: YearMonth): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1));
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(date);
  return label.replace(/\.$/, "");
}

function joinMonthLabels(months: readonly YearMonth[]): string {
  const labels = months.map(formatYearMonth);
  if (labels.length <= 1) {
    return labels[0] ?? "";
  }
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1] ?? ""}`;
}

function incomeTile(totals: MonthTotals): StatTileView {
  return {
    label: t.overview.tiles.income,
    value: formatMoney({ amountCentavos: totals.incomeCentavos, currency: HOUSEHOLD_CURRENCY }),
    meta: null,
  };
}

function spendingTile(totals: MonthTotals): StatTileView {
  return {
    label: t.overview.tiles.spending,
    value: formatMoney({ amountCentavos: totals.spendingCentavos, currency: HOUSEHOLD_CURRENCY }),
    meta: interpolateAll(t.overview.tiles.spendingMeta, {
      fixed: formatMoney({ amountCentavos: totals.fixedCentavos, currency: HOUSEHOLD_CURRENCY }),
      variable: formatMoney({
        amountCentavos: totals.variableCentavos,
        currency: HOUSEHOLD_CURRENCY,
      }),
    }),
  };
}

function savingsRateTile(basisPoints: number | null): StatTileView {
  if (basisPoints === null) {
    return {
      label: t.overview.tiles.savingsRate,
      value: "—",
      meta: t.overview.tiles.savingsRateNoIncome,
    };
  }
  return {
    label: t.overview.tiles.savingsRate,
    value: formatBasisPointsPercent(basisPoints),
    meta: null,
  };
}

function averageFixedCostTile(average: AverageFixedCost | null): StatTileView {
  if (average === null) {
    return {
      label: t.overview.tiles.averageFixedCost,
      value: "—",
      meta: t.overview.tiles.averageFixedCostNoHistory,
    };
  }
  const value = formatMoney({
    amountCentavos: average.averageCentavos,
    currency: HOUSEHOLD_CURRENCY,
  });
  const meta = average.isEstimate
    ? interpolate(
        t.overview.tiles.averageFixedCostEstimate,
        "{months}",
        joinMonthLabels(average.monthsUsed),
      )
    : interpolate(
        t.overview.tiles.averageFixedCostAverage,
        "{count}",
        String(average.monthsUsed.length),
      );
  return { label: t.overview.tiles.averageFixedCost, value, meta };
}

function categoryBars(spendingByCategory: readonly CategorySpending[]): CategoryBarView[] {
  const max = spendingByCategory.reduce((top, item) => Math.max(top, item.spendingCentavos), 0);
  return spendingByCategory.map((item) => ({
    key: item.categoryId,
    label: t.categories[item.categoryId],
    amountLabel: formatMoney({
      amountCentavos: item.spendingCentavos,
      currency: HOUSEHOLD_CURRENCY,
    }),
    fraction: max > 0 ? item.spendingCentavos / max : 0,
  }));
}

function seriesPoints(series: readonly MonthlyPoint[]): MonthlyBarPointView[] {
  return series.map((point) => ({
    month: point.month,
    shortLabel: shortMonthLabel(point.month),
    monthLabel: formatYearMonth(point.month),
    incomeCentavos: point.incomeCentavos,
    spendingCentavos: point.spendingCentavos,
    incomeAmountLabel: formatMoney({
      amountCentavos: point.incomeCentavos,
      currency: HOUSEHOLD_CURRENCY,
    }),
    spendingAmountLabel: formatMoney({
      amountCentavos: point.spendingCentavos,
      currency: HOUSEHOLD_CURRENCY,
    }),
    incomeCompactLabel: formatCompactReais(point.incomeCentavos),
    spendingCompactLabel: formatCompactReais(point.spendingCentavos),
  }));
}

// Everything / renders above the accounts table, so the page stays a
// composition of this slice's components (ADR-0011). The month defaults to
// today's in the household's time zone and never moves past it, even from a
// crafted URL. Reads once, through readHouseholdDashboardLines — the same
// entry point the Reserva page and the reserve month-close job call, so the
// three can never disagree over dashboardMonthRange's window (the current
// month plus the six months behind it) — then hands the lines to
// packages/core's buildLedgerDashboard: every number on this page is
// computed there, never guessed at in this file. The audit write (ADR-0008,
// amended 2026-10-03 #27) happens only after the read succeeds, not
// concurrently with it: a failed read records nothing, and a failed write
// still fails this call.
export async function getOverviewPageProps(
  session: HouseholdSession,
  searchParams: OverviewSearchParams,
  now: Date = new Date(),
): Promise<OverviewPageProps> {
  const props = await buildOverviewPageProps(householdScope(session), searchParams, now);
  await recordFinancialDataAccess(session, "overview");
  return props;
}

export async function buildOverviewPageProps(
  scope: HouseholdScope,
  searchParams: OverviewSearchParams,
  now: Date,
): Promise<OverviewPageProps> {
  const db = getDb();
  const repository = createHouseholdLedgerRepository(scope);
  const params = overviewSearchParamsSchema.parse(searchParams);

  const [settings, accounts] = await Promise.all([
    getHouseholdSettings(scope, db),
    repository.listAccounts(db),
  ]);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const currentMonth = yearMonthOf(now, timeZone);
  const requestedMonth = params.mes ?? currentMonth;
  const month = requestedMonth > currentMonth ? currentMonth : requestedMonth;

  const { rows, lines } = await readHouseholdDashboardLines(db, scope, month, timeZone);
  const dashboard = buildLedgerDashboard({ month, lines });

  const monthDays = yearMonthDayRange(month);
  const monthRows = rows.filter((row) => row.date >= monthDays.from && row.date <= monthDays.to);
  // The uncategorized notice counts the same rows the tiles above it do: a
  // foreign-currency row is neither in nor out of these numbers, it simply
  // does not belong to them (ADR-0002), so it stays out of the count too.
  const householdCurrencyMonthRows = monthRows.filter((row) => row.currency === HOUSEHOLD_CURRENCY);
  const hasOtherCurrencyRows = monthRows.some((row) => row.currency !== HOUSEHOLD_CURRENCY);
  const uncategorizedSummary = summarizeUncategorized(
    householdCurrencyMonthRows.map((row) => ({
      categorization: row.categorization,
      amount: { amountCentavos: row.amountCentavos, currency: row.currency },
    })),
  );

  return {
    month,
    monthLabel: formatYearMonth(month),
    previousMonth: shiftYearMonth(month, -1),
    nextMonth: month < currentMonth ? shiftYearMonth(month, 1) : null,
    hasAccounts: accounts.length > 0,
    inProgress: month === currentMonth,
    incomeCentavos: dashboard.totals.incomeCentavos,
    spendingCentavos: dashboard.totals.spendingCentavos,
    savingsRateBasisPoints: dashboard.savingsRateBasisPoints,
    uncategorized: {
      count: uncategorizedSummary.count,
      amountLabel: uncategorizedSummary.totals.map(formatMoney).join(" + "),
    },
    hasOtherCurrencyRows,
    tiles: {
      income: incomeTile(dashboard.totals),
      spending: spendingTile(dashboard.totals),
      savingsRate: savingsRateTile(dashboard.savingsRateBasisPoints),
      averageFixedCost: averageFixedCostTile(dashboard.averageFixedCost),
    },
    categorySpending: categoryBars(dashboard.spendingByCategory),
    series: seriesPoints(dashboard.series),
  };
}
