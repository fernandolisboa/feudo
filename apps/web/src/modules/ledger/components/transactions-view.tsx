import Link from "next/link";
import { Landmark, Tags } from "lucide-react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { PageNav, paginationStatus } from "@/ui/page-nav";
import { interpolate } from "@/lib/interpolate";

import { GUIDED_CATEGORIZATION_PATH, transactionsHref, type TransactionsRouteBase } from "../href";
import type { TransactionsPageProps } from "../page-props";
import { MonthSwitcher } from "./month-switcher";
import { PeriodSwitcher } from "./period-switcher";
import { SpreadsheetMenu } from "./spreadsheet-menu";
import { TransactionsFilterBar } from "./transactions-filter-bar";
import { TransactionsTable } from "./transactions-table";
import { t } from "../strings";

function scopeToken(isRange: boolean): "{month}" | "{period}" {
  return isRange ? "{period}" : "{month}";
}

function headline(
  total: number,
  scopeLabel: string,
  isRange: boolean,
  uncategorizedOnly: boolean,
  hasOtherFilters: boolean,
): string {
  const token = scopeToken(isRange);
  const table = isRange ? t.headline.range : t.headline;
  const uncategorizedTable = isRange ? t.uncategorizedHeadlineRange : t.uncategorizedHeadline;
  const copy = hasOtherFilters ? table.found : uncategorizedOnly ? uncategorizedTable : table;
  if (total === 0) {
    return interpolate(copy.none, token, scopeLabel);
  }
  if (total === 1) {
    return interpolate(copy.one, token, scopeLabel);
  }
  return interpolate(interpolate(copy.many, "{count}", String(total)), token, scopeLabel);
}

function emptyStateMessage(
  hasOtherFilters: boolean,
  uncategorizedOnly: boolean,
  monthHasTransactions: boolean,
  scopeLabel: string,
  isRange: boolean,
): string | null {
  const token = scopeToken(isRange);
  if (hasOtherFilters && monthHasTransactions) {
    return interpolate(isRange ? t.empty.noMatchesRange : t.empty.noMatches, token, scopeLabel);
  }
  if (uncategorizedOnly && monthHasTransactions) {
    return null;
  }
  return interpolate(
    isRange ? t.empty.noTransactionsRange : t.empty.noTransactions,
    token,
    scopeLabel,
  );
}

function uncategorizedMessage(
  count: number,
  amountLabel: string,
  scopeLabel: string,
  isRange: boolean,
): string {
  const token = scopeToken(isRange);
  const table = isRange ? t.uncategorizedRange : t.uncategorized;
  const copy = count === 1 ? table.one : table.many;
  return interpolate(
    interpolate(interpolate(copy, "{count}", String(count)), "{amount}", amountLabel),
    token,
    scopeLabel,
  );
}

function totalsLine(totals: TransactionsPageProps["totals"]): string {
  const parts = [
    interpolate(t.totals.income, "{amount}", totals.incomeLabel),
    interpolate(t.totals.spending, "{amount}", totals.spendingLabel),
  ];
  if (totals.transferCount > 0) {
    parts.push(
      totals.transferCount === 1
        ? t.totals.transfersOne
        : interpolate(t.totals.transfersMany, "{count}", String(totals.transferCount)),
    );
  }
  return parts.join(" · ");
}

export function TransactionsView({
  month,
  monthLabel,
  previousMonth,
  nextMonth,
  range,
  periodLabel,
  todayIso,
  accounts,
  selectedAccountId,
  uncategorizedOnly,
  selectedCategory,
  categoryFilterOptions,
  selectedKind,
  searchQuery,
  monthHasTransactions,
  uncategorized,
  totals,
  categoryGroups,
  transactions,
  total,
  page,
  pageCount,
  hasMore,
}: TransactionsPageProps) {
  const isRange = range !== null;
  const hasOtherFilters =
    selectedCategory !== null || selectedKind !== null || searchQuery !== null;
  const route: TransactionsRouteBase = {
    month,
    range,
    accountId: selectedAccountId,
    uncategorizedOnly,
    category: selectedCategory,
    kind: selectedKind,
    search: searchQuery,
  };
  const scopeLabel = periodLabel ?? monthLabel;
  const emptyMessage =
    transactions.length === 0
      ? emptyStateMessage(
          hasOtherFilters,
          uncategorizedOnly,
          monthHasTransactions,
          scopeLabel,
          isRange,
        )
      : null;

  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${scopeLabel}`}
        title={headline(total, scopeLabel, isRange, uncategorizedOnly, hasOtherFilters)}
        actions={
          <>
            {range ? (
              <PeriodSwitcher
                tourTarget="transactions.month"
                periodLabel={periodLabel ?? ""}
                viewByMonthHref={transactionsHref({ ...route, range: null, page: 1 })}
              />
            ) : (
              <MonthSwitcher
                tourTarget="transactions.month"
                monthLabel={monthLabel}
                previousHref={transactionsHref({ ...route, month: previousMonth, page: 1 })}
                nextHref={
                  nextMonth ? transactionsHref({ ...route, month: nextMonth, page: 1 }) : null
                }
              />
            )}
            <Button variant="ghost" size="sm" render={<Link href="/categorias" />}>
              <Tags className="size-4" />
              {t.categoriesLink}
            </Button>
            {total > 0 ? <SpreadsheetMenu view={route} total={total} /> : null}
          </>
        }
      />
      {accounts.length > 0 ? (
        <TransactionsFilterBar
          route={route}
          accounts={accounts}
          categoryFilterOptions={categoryFilterOptions}
          todayIso={todayIso}
        />
      ) : null}
      {accounts.length > 0 ? (
        <p
          className="text-muted-foreground mb-3 text-[13px] tabular-nums"
          data-tour="transactions.totals"
        >
          {totalsLine(totals)}
        </p>
      ) : null}
      {uncategorized.count > 0 && !uncategorizedOnly ? (
        <Notice
          action={
            <Button size="sm" render={<Link href={GUIDED_CATEGORIZATION_PATH} />}>
              {t.uncategorized.show}
            </Button>
          }
        >
          {uncategorizedMessage(
            uncategorized.count,
            uncategorized.amountLabel,
            scopeLabel,
            isRange,
          )}
        </Notice>
      ) : null}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="font-heading text-[18px]">{t.empty.noAccounts}</p>
          <Button render={<Link href="/conectar-banco" />}>
            <Landmark className="size-4" />
            {t.empty.connectAction}
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        emptyMessage !== null ? (
          <p className="font-heading text-[18px]">{emptyMessage}</p>
        ) : null
      ) : (
        <>
          <TransactionsTable transactions={transactions} groups={categoryGroups} />
          {page > 1 || hasMore ? (
            <PageNav
              label={t.pagination.label}
              status={paginationStatus(t.pagination.page, page, pageCount, total)}
              previous={
                page > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={transactionsHref({ ...route, page: page - 1 })} />}
                  >
                    {t.pagination.newer}
                  </Button>
                ) : null
              }
              next={
                hasMore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={transactionsHref({ ...route, page: page + 1 })} />}
                  >
                    {t.pagination.older}
                  </Button>
                ) : null
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
