import Link from "next/link";
import { Landmark, Tags } from "lucide-react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { interpolate } from "@/lib/interpolate";

import { transactionsHref } from "../href";
import type { TransactionsPageProps } from "../page-props";
import { MonthSwitcher } from "./month-switcher";
import { TransactionsFilterBar } from "./transactions-filter-bar";
import { TransactionsTable } from "./transactions-table";
import { t } from "../strings";

function headline(
  total: number,
  monthLabel: string,
  uncategorizedOnly: boolean,
  hasOtherFilters: boolean,
): string {
  const copy = hasOtherFilters
    ? t.headline.found
    : uncategorizedOnly
      ? t.uncategorizedHeadline
      : t.headline;
  if (total === 0) {
    return interpolate(copy.none, "{month}", monthLabel);
  }
  if (total === 1) {
    return interpolate(copy.one, "{month}", monthLabel);
  }
  return interpolate(interpolate(copy.many, "{count}", String(total)), "{month}", monthLabel);
}

function emptyStateMessage(
  hasOtherFilters: boolean,
  uncategorizedOnly: boolean,
  monthHasTransactions: boolean,
  monthLabel: string,
): string | null {
  if (hasOtherFilters && monthHasTransactions) {
    return interpolate(t.empty.noMatches, "{month}", monthLabel);
  }
  if (uncategorizedOnly && monthHasTransactions) {
    return null;
  }
  return interpolate(t.empty.noTransactions, "{month}", monthLabel);
}

function uncategorizedMessage(count: number, amountLabel: string, monthLabel: string): string {
  const copy = count === 1 ? t.uncategorized.one : t.uncategorized.many;
  return interpolate(
    interpolate(interpolate(copy, "{count}", String(count)), "{amount}", amountLabel),
    "{month}",
    monthLabel,
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
  hasMore,
}: TransactionsPageProps) {
  const hasOtherFilters =
    selectedCategory !== null || selectedKind !== null || searchQuery !== null;
  const activeFilters = {
    uncategorizedOnly,
    category: selectedCategory,
    kind: selectedKind,
    search: searchQuery,
  };
  const emptyMessage =
    transactions.length === 0
      ? emptyStateMessage(hasOtherFilters, uncategorizedOnly, monthHasTransactions, monthLabel)
      : null;

  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${monthLabel}`}
        title={headline(total, monthLabel, uncategorizedOnly, hasOtherFilters)}
        actions={
          <>
            <MonthSwitcher
              tourTarget="transactions.month"
              monthLabel={monthLabel}
              previousHref={transactionsHref({
                month: previousMonth,
                accountId: selectedAccountId,
                page: 1,
                ...activeFilters,
              })}
              nextHref={
                nextMonth
                  ? transactionsHref({
                      month: nextMonth,
                      accountId: selectedAccountId,
                      page: 1,
                      ...activeFilters,
                    })
                  : null
              }
            />
            <Button variant="ghost" size="sm" render={<Link href="/categorias" />}>
              <Tags className="size-4" />
              {t.categoriesLink}
            </Button>
          </>
        }
      />
      {accounts.length > 0 ? (
        <TransactionsFilterBar
          month={month}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          uncategorizedOnly={uncategorizedOnly}
          selectedCategory={selectedCategory}
          categoryFilterOptions={categoryFilterOptions}
          selectedKind={selectedKind}
          searchQuery={searchQuery}
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
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={transactionsHref({
                    month,
                    accountId: selectedAccountId,
                    page: 1,
                    uncategorizedOnly: true,
                    category: null,
                    kind: null,
                    search: null,
                  })}
                />
              }
            >
              {t.uncategorized.show}
            </Button>
          }
        >
          {uncategorizedMessage(uncategorized.count, uncategorized.amountLabel, monthLabel)}
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
            <nav
              aria-label={t.pagination.label}
              className="mt-3 flex items-center justify-between gap-2"
            >
              <span className="text-muted-foreground text-xs tabular-nums">
                {interpolate(t.pagination.page, "{page}", String(page))}
              </span>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={transactionsHref({
                          month,
                          accountId: selectedAccountId,
                          page: page - 1,
                          ...activeFilters,
                        })}
                      />
                    }
                  >
                    {t.pagination.newer}
                  </Button>
                ) : null}
                {hasMore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={transactionsHref({
                          month,
                          accountId: selectedAccountId,
                          page: page + 1,
                          ...activeFilters,
                        })}
                      />
                    }
                  >
                    {t.pagination.older}
                  </Button>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
