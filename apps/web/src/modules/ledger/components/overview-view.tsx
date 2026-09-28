import Link from "next/link";
import { Landmark } from "lucide-react";
import { formatBasisPointsPercent, formatMoney } from "@feudo/core";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { interpolate, interpolateAll } from "@/lib/interpolate";
import { HOUSEHOLD_CURRENCY } from "@/modules/sync";

import { transactionsHref } from "../href";
import { overviewHref } from "../overview-href";
import type { OverviewPageProps } from "../overview-page-props";
import { t } from "../strings";
import { BarList } from "./bar-list";
import { MonthlyBars } from "./monthly-bars";
import { MonthSwitcher } from "./month-switcher";
import { StatTile } from "./stat-tile";

function withProgress(sentence: string, inProgress: boolean): string {
  if (!inProgress) {
    return sentence;
  }
  return `${sentence.slice(0, -1)} ${t.overview.inProgressSuffix}.`;
}

function headline({
  savingsRateBasisPoints,
  spendingCentavos,
  monthLabel,
  inProgress,
}: OverviewPageProps): string {
  if (savingsRateBasisPoints === null) {
    if (spendingCentavos <= 0) {
      return withProgress(
        interpolate(t.overview.headline.noActivity, "{month}", monthLabel),
        inProgress,
      );
    }
    return withProgress(
      interpolateAll(t.overview.headline.noIncome, {
        amount: formatMoney({ amountCentavos: spendingCentavos, currency: HOUSEHOLD_CURRENCY }),
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
        <div className="flex flex-col items-start gap-3">
          <p className="font-heading text-[18px]">{t.overview.empty.noAccounts}</p>
          <Button render={<Link href="/conectar-banco" />}>
            <Landmark className="size-4" />
            {t.overview.empty.connectAction}
          </Button>
        </div>
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
