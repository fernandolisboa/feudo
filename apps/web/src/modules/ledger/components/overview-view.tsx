import Link from "next/link";
import { formatBasisPointsPercent } from "@feudo/core";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { StatTile } from "@/ui/stat-tile";
import { interpolate, interpolateAll } from "@/lib/interpolate";

import { transactionsHref } from "../href";
import { overviewHref } from "../overview-href";
import type { OverviewPageProps } from "../overview-page-props";
import { t } from "../strings";
import { BarList } from "./bar-list";
import { MonthlyBars } from "./monthly-bars";
import { MonthSwitcher } from "./month-switcher";

function withProgress(sentence: string, inProgress: boolean): string {
  if (!inProgress) {
    return sentence;
  }
  return `${sentence.slice(0, -1)} ${t.overview.inProgressSuffix}.`;
}

function headline({
  incomeCentavos,
  savingsRateBasisPoints,
  spendingCentavos,
  monthLabel,
  inProgress,
  tiles,
}: OverviewPageProps): string {
  if (savingsRateBasisPoints === null) {
    if (incomeCentavos === 0 && spendingCentavos <= 0) {
      return withProgress(
        interpolate(t.overview.headline.noActivity, "{month}", monthLabel),
        inProgress,
      );
    }
    if (spendingCentavos <= 0) {
      return withProgress(
        interpolateAll(t.overview.headline.negativeIncome, {
          amount: tiles.income.value,
          month: monthLabel,
        }),
        inProgress,
      );
    }
    return withProgress(
      interpolateAll(t.overview.headline.noIncome, {
        amount: tiles.spending.value,
        month: monthLabel,
      }),
      inProgress,
    );
  }
  if (savingsRateBasisPoints < 0) {
    return withProgress(
      interpolate(t.overview.headline.overspent, "{month}", monthLabel),
      inProgress,
    );
  }
  return withProgress(
    interpolateAll(t.overview.headline.kept, {
      percent: formatBasisPointsPercent(savingsRateBasisPoints),
      month: monthLabel,
    }),
    inProgress,
  );
}

function uncategorizedMessage(count: number, amountLabel: string, monthLabel: string): string {
  const copy = count === 1 ? t.overview.uncategorized.one : t.overview.uncategorized.many;
  return interpolateAll(copy, { count: String(count), amount: amountLabel, month: monthLabel });
}

export function OverviewView(props: OverviewPageProps) {
  const {
    month,
    monthLabel,
    previousMonth,
    nextMonth,
    hasAccounts,
    uncategorized,
    hasOtherCurrencyRows,
    tiles,
    categorySpending,
    series,
  } = props;

  return (
    <>
      <PageHeader
        overline={`${t.overview.overline} · ${monthLabel}`}
        title={headline(props)}
        actions={
          <MonthSwitcher
            monthLabel={monthLabel}
            previousHref={overviewHref(previousMonth)}
            nextHref={nextMonth ? overviewHref(nextMonth) : null}
          />
        }
      />

      {!hasAccounts ? (
        <p className="font-heading text-[18px]">{t.overview.empty.noAccounts}</p>
      ) : (
        <>
          {uncategorized.count > 0 ? (
            <Notice
              action={
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={transactionsHref({
                        month,
                        accountId: null,
                        page: 1,
                        uncategorizedOnly: true,
                        category: null,
                        kind: null,
                        search: null,
                      })}
                    />
                  }
                >
                  {t.overview.uncategorized.action}
                </Button>
              }
            >
              {uncategorizedMessage(uncategorized.count, uncategorized.amountLabel, monthLabel)}
            </Notice>
          ) : null}

          {hasOtherCurrencyRows ? (
            <p className="text-muted-foreground mb-4 text-[13px]">
              {t.overview.otherCurrencyNotice}
            </p>
          ) : null}

          <div className="bg-border mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
            <StatTile {...tiles.income} />
            <StatTile {...tiles.spending} />
            <StatTile {...tiles.savingsRate} />
            <StatTile {...tiles.averageFixedCost} />
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_1.25fr]">
            <section>
              <SectionHeader title={t.overview.categorySpending.title} />
              {categorySpending.length === 0 ? (
                <p className="text-muted-foreground text-[13px]">
                  {t.overview.categorySpending.empty}
                </p>
              ) : (
                <BarList items={categorySpending} />
              )}
            </section>
            <section>
              <SectionHeader title={t.overview.chart.title} />
              <MonthlyBars points={series} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
