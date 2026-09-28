import { HOUSEHOLD_CURRENCY, roundHalfAwayFromZero } from "../money/money";
import {
  PRODUCT_CATEGORY_IDS,
  type Kind,
  type ProductCategoryId,
  type TransactionDirection,
} from "./categories/taxonomy";
import { netForKind } from "./totals";
import { shiftYearMonth, type YearMonth } from "./year-month";

export type DashboardLine = {
  month: YearMonth;
  kind: Kind | null;
  type: TransactionDirection;
  amountCentavos: number;
  categoryId: ProductCategoryId | null;
  currency: string;
};

export type MonthTotals = {
  incomeCentavos: number;
  fixedCentavos: number;
  variableCentavos: number;
  spendingCentavos: number;
};

export type CategorySpending = { categoryId: ProductCategoryId; spendingCentavos: number };

export type MonthlyPoint = { month: YearMonth; incomeCentavos: number; spendingCentavos: number };

export type AverageFixedCost = {
  averageCentavos: number;
  monthsUsed: YearMonth[];
  isEstimate: boolean;
};

export type LedgerDashboard = {
  totals: MonthTotals;
  savingsRateBasisPoints: number | null;
  spendingByCategory: CategorySpending[];
  series: MonthlyPoint[];
  averageFixedCost: AverageFixedCost | null;
};

const SERIES_MONTHS = 6;
const AVERAGE_WINDOW_MONTHS = 6;
const MINIMUM_MONTHS_FOR_AVERAGE = 3;

function categoryPosition(categoryId: ProductCategoryId): number {
  return (PRODUCT_CATEGORY_IDS as readonly ProductCategoryId[]).indexOf(categoryId);
}

function linesInMonth(lines: readonly DashboardLine[], month: YearMonth): DashboardLine[] {
  return lines.filter((line) => line.month === month);
}

function monthTotals(lines: readonly DashboardLine[]): MonthTotals {
  const incomeCentavos = netForKind(lines, "income", "credit");
  const fixedCentavos = netForKind(lines, "fixed", "debit");
  const variableCentavos = netForKind(lines, "variable", "debit");
  return {
    incomeCentavos,
    fixedCentavos,
    variableCentavos,
    spendingCentavos: fixedCentavos + variableCentavos,
  };
}

function computeSavingsRateBasisPoints(totals: MonthTotals): number | null {
  if (totals.incomeCentavos <= 0) return null;
  const netCentavos = totals.incomeCentavos - totals.spendingCentavos;
  return roundHalfAwayFromZero((netCentavos * 10000) / totals.incomeCentavos);
}

function computeSpendingByCategory(lines: readonly DashboardLine[]): CategorySpending[] {
  const totalsByCategory = new Map<ProductCategoryId, number>();

  for (const line of lines) {
    if (line.kind !== "fixed" && line.kind !== "variable") continue;
    if (line.categoryId === null) continue;
    const magnitude = Math.abs(line.amountCentavos);
    const signed = line.type === "debit" ? magnitude : -magnitude;
    totalsByCategory.set(line.categoryId, (totalsByCategory.get(line.categoryId) ?? 0) + signed);
  }

  return [...totalsByCategory.entries()]
    .filter(([, spendingCentavos]) => spendingCentavos > 0)
    .map(([categoryId, spendingCentavos]) => ({ categoryId, spendingCentavos }))
    .sort((a, b) => {
      if (a.spendingCentavos !== b.spendingCentavos) {
        return b.spendingCentavos - a.spendingCentavos;
      }
      return categoryPosition(a.categoryId) - categoryPosition(b.categoryId);
    });
}

function computeSeries(lines: readonly DashboardLine[], month: YearMonth): MonthlyPoint[] {
  const months = Array.from({ length: SERIES_MONTHS }, (_, index) =>
    shiftYearMonth(month, index - (SERIES_MONTHS - 1)),
  );
  return months.map((pointMonth) => {
    const totals = monthTotals(linesInMonth(lines, pointMonth));
    return {
      month: pointMonth,
      incomeCentavos: totals.incomeCentavos,
      spendingCentavos: totals.spendingCentavos,
    };
  });
}

function computeAverageFixedCost(
  lines: readonly DashboardLine[],
  month: YearMonth,
): AverageFixedCost | null {
  const windowMonths = Array.from({ length: AVERAGE_WINDOW_MONTHS }, (_, index) =>
    shiftYearMonth(month, index - AVERAGE_WINDOW_MONTHS),
  );
  const monthsUsed = windowMonths.filter((windowMonth) =>
    lines.some((line) => line.month === windowMonth && line.kind !== null),
  );
  if (monthsUsed.length === 0) return null;

  const sumCentavos = monthsUsed.reduce(
    (total, usedMonth) => total + netForKind(linesInMonth(lines, usedMonth), "fixed", "debit"),
    0,
  );
  const averageCentavos = roundHalfAwayFromZero(sumCentavos / monthsUsed.length);
  return {
    averageCentavos,
    monthsUsed,
    isEstimate: monthsUsed.length < MINIMUM_MONTHS_FOR_AVERAGE,
  };
}

export function dashboardMonthRange(month: YearMonth): { from: YearMonth; to: YearMonth } {
  return { from: shiftYearMonth(month, -AVERAGE_WINDOW_MONTHS), to: month };
}

// A household aggregates only its own currency (ADR-0002); a line synced
// from a foreign-currency account never reaches monthTotals, the category
// bars or the series, whatever the caller passed in.
export function buildLedgerDashboard(input: {
  month: YearMonth;
  lines: readonly DashboardLine[];
}): LedgerDashboard {
  const { month } = input;
  const lines = input.lines.filter((line) => line.currency === HOUSEHOLD_CURRENCY);
  const range = dashboardMonthRange(month);
  const linesInRange = lines.filter((line) => line.month >= range.from && line.month <= range.to);
  const currentMonthLines = linesInMonth(linesInRange, month);
  const totals = monthTotals(currentMonthLines);

  return {
    totals,
    savingsRateBasisPoints: computeSavingsRateBasisPoints(totals),
    spendingByCategory: computeSpendingByCategory(currentMonthLines),
    series: computeSeries(linesInRange, month),
    averageFixedCost: computeAverageFixedCost(linesInRange, month),
  };
}
