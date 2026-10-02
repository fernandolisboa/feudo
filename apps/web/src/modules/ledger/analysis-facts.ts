import type { AnalysisFact, YearMonth } from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import { buildOverviewPageProps, type OverviewPageProps } from "./overview-page-props";
import { t } from "./strings";

function seriesKey(month: YearMonth): string {
  return month.replace("-", "_");
}

// The analyst reads the same strings Visão geral shows for the month, so a
// figure it quotes is always one the household can find on screen.
export function overviewAnalysisFacts(props: OverviewPageProps): AnalysisFact[] {
  if (!props.hasAccounts) {
    return [];
  }
  const month = props.monthLabel;
  const strings = t.analysisFacts;
  const { tiles } = props;
  const facts: AnalysisFact[] = [
    {
      key: "ledger.month",
      label: strings.month,
      value: props.inProgress ? interpolate(strings.inProgress, "{month}", month) : month,
    },
    {
      key: "ledger.income",
      label: interpolate(strings.income, "{month}", month),
      value: tiles.income.value,
    },
    {
      key: "ledger.spending",
      label: interpolate(strings.spending, "{month}", month),
      value: tiles.spending.value,
    },
  ];
  if (tiles.spending.meta !== null) {
    facts.push({
      key: "ledger.spending_split",
      label: interpolate(strings.spendingSplit, "{month}", month),
      value: tiles.spending.meta,
    });
  }
  facts.push({
    key: "ledger.savings_rate",
    label: interpolate(strings.savingsRate, "{month}", month),
    value:
      props.savingsRateBasisPoints === null
        ? (tiles.savingsRate.meta ?? tiles.savingsRate.value)
        : tiles.savingsRate.value,
  });
  facts.push({
    key: "ledger.average_fixed_cost",
    label: strings.averageFixedCost,
    value:
      tiles.averageFixedCost.meta === null
        ? tiles.averageFixedCost.value
        : tiles.averageFixedCost.value === "—"
          ? tiles.averageFixedCost.meta
          : interpolateAll(strings.averageFixedCostValue, {
              value: tiles.averageFixedCost.value,
              meta: tiles.averageFixedCost.meta,
            }),
  });
  facts.push({
    key: "ledger.uncategorized",
    label: interpolate(strings.uncategorized, "{month}", month),
    value:
      props.uncategorized.count === 0
        ? strings.uncategorizedNone
        : interpolateAll(strings.uncategorizedValue, {
            count: String(props.uncategorized.count),
            amount: props.uncategorized.amountLabel,
          }),
  });
  for (const category of props.categorySpending) {
    facts.push({
      key: `ledger.category.${category.key}`,
      label: interpolateAll(strings.category, { category: category.label, month }),
      value: category.amountLabel,
    });
  }
  for (const point of props.series) {
    if (point.month === props.month) {
      continue;
    }
    facts.push(
      {
        key: `ledger.series.${seriesKey(point.month)}.income`,
        label: interpolate(strings.seriesIncome, "{month}", point.monthLabel),
        value: point.incomeAmountLabel,
      },
      {
        key: `ledger.series.${seriesKey(point.month)}.spending`,
        label: interpolate(strings.seriesSpending, "{month}", point.monthLabel),
        value: point.spendingAmountLabel,
      },
    );
  }
  if (props.hasOtherCurrencyRows) {
    facts.push({
      key: "ledger.other_currency",
      label: strings.otherCurrency,
      value: strings.otherCurrencyValue,
    });
  }
  return facts;
}

export async function getLedgerAnalysisFacts(
  scope: HouseholdScope,
  month: YearMonth,
  now: Date,
): Promise<AnalysisFact[]> {
  return overviewAnalysisFacts(await buildOverviewPageProps(scope, { mes: month }, now));
}
