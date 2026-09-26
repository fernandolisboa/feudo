import type { YearMonth } from "../year-month";
import { normalizeDescription } from "./description";
import type { Kind, SubcategoryRef, TransactionDirection } from "./taxonomy";

export type RecurringInput = {
  yearMonth: YearMonth;
  description: string;
  type: TransactionDirection;
  amountCentavos: number;
  subcategory: SubcategoryRef;
  kind: Kind;
};

export type FixedSuggestion = {
  subcategory: SubcategoryRef;
  description: string;
  months: YearMonth[];
};

type RecurringGroup = {
  subcategory: SubcategoryRef;
  description: string;
  totalsByMonth: Map<YearMonth, number>;
};

type QualifyingGroup = {
  subcategory: SubcategoryRef;
  description: string;
  median: number;
};

function subcategoryKey(ref: SubcategoryRef): string {
  return `${ref.type}:${ref.id}`;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const isOdd = sorted.length % 2 === 1;
  const middleValues = isOdd
    ? sorted.slice(middle, middle + 1)
    : sorted.slice(middle - 1, middle + 1);
  const sum = middleValues.reduce((total, value) => total + value, 0);
  return Math.round(sum / middleValues.length);
}

function groupKey(ref: SubcategoryRef, normalizedDescription: string): string {
  return `${subcategoryKey(ref)}\u0000${normalizedDescription}`;
}

function betterCandidate(
  candidate: QualifyingGroup,
  current: QualifyingGroup | undefined,
): boolean {
  if (!current) {
    return true;
  }
  if (candidate.median !== current.median) {
    return candidate.median > current.median;
  }
  return candidate.description < current.description;
}

export function suggestFixedSubcategories(
  items: readonly RecurringInput[],
  months: readonly YearMonth[],
): FixedSuggestion[] {
  if (months.length < 3) {
    return [];
  }

  const monthSet = new Set(months);
  const groups = new Map<string, RecurringGroup>();

  for (const item of items) {
    if (item.type !== "debit" || item.kind !== "variable" || !monthSet.has(item.yearMonth)) {
      continue;
    }

    const description = normalizeDescription(item.description);
    const key = groupKey(item.subcategory, description);
    const group = groups.get(key) ?? {
      subcategory: item.subcategory,
      description,
      totalsByMonth: new Map<YearMonth, number>(),
    };
    const currentTotal = group.totalsByMonth.get(item.yearMonth) ?? 0;
    group.totalsByMonth.set(item.yearMonth, currentTotal + Math.abs(item.amountCentavos));
    groups.set(key, group);
  }

  const bestBySubcategory = new Map<string, QualifyingGroup>();

  for (const group of groups.values()) {
    const hasEveryMonth = months.every((month) => group.totalsByMonth.has(month));
    if (!hasEveryMonth) {
      continue;
    }

    const monthlyTotals = [...group.totalsByMonth.values()];
    const monthlyMedian = median(monthlyTotals);
    const withinTolerance = monthlyTotals.every(
      (total) => Math.abs(total - monthlyMedian) * 10 <= monthlyMedian,
    );
    if (!withinTolerance) {
      continue;
    }

    const key = subcategoryKey(group.subcategory);
    const candidate: QualifyingGroup = {
      subcategory: group.subcategory,
      description: group.description,
      median: monthlyMedian,
    };
    if (betterCandidate(candidate, bestBySubcategory.get(key))) {
      bestBySubcategory.set(key, candidate);
    }
  }

  const sortedMonths = [...months].sort();

  return [...bestBySubcategory.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, candidate]) => ({
      subcategory: candidate.subcategory,
      description: candidate.description,
      months: sortedMonths,
    }));
}
