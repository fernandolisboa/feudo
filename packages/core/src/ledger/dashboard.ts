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

export type AverageFixedCostMonth = { month: YearMonth; fixedCentavos: number | null };

export type AverageFixedCostDetail = {
  average: AverageFixedCost | null;
  months: AverageFixedCostMonth[];
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

// Public (unlike the rest of this file's helpers) so the reserve target and
// the Visão geral tile read the exact same number from the exact same
// window: six months strictly before `month`, filtered to the household's
// own currency (ADR-0002). `months` names every window month whether or not
// it counted, `fixedCentavos: null` marking a gap (a month with nothing
// categorized yet) rather than a silent zero that would pull the average
// down (CONTEXT.md, "Average fixed cost").
export function averageFixedCost(input: {
  month: YearMonth;
  lines: readonly DashboardLine[];
}): AverageFixedCostDetail {
  const lines = input.lines.filter((line) => line.currency === HOUSEHOLD_CURRENCY);
  const windowMonths = Array.from({ length: AVERAGE_WINDOW_MONTHS }, (_, index) =>
    shiftYearMonth(input.month, index - AVERAGE_WINDOW_MONTHS),
  );

  const months = windowMonths.map((windowMonth) => {
    const monthLines = linesInMonth(lines, windowMonth);
    const isGap = !monthLines.some((monthLine) => monthLine.kind !== null);
    return {
      month: windowMonth,
      fixedCentavos: isGap ? null : netForKind(monthLines, "fixed", "debit"),
    };
  });

  const monthsUsed = months.filter(
    (entry): entry is { month: YearMonth; fixedCentavos: number } => entry.fixedCentavos !== null,
  );
  if (monthsUsed.length === 0) {
    return { average: null, months };
  }

  const sumCentavos = monthsUsed.reduce((total, entry) => total + entry.fixedCentavos, 0);
  const averageCentavos = roundHalfAwayFromZero(sumCentavos / monthsUsed.length);
  return {
    average: {
      averageCentavos,
      monthsUsed: monthsUsed.map((entry) => entry.month),
      isEstimate: monthsUsed.length < MINIMUM_MONTHS_FOR_AVERAGE,
    },
    months,
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
    averageFixedCost: averageFixedCost({ month, lines }).average,
  };
}
