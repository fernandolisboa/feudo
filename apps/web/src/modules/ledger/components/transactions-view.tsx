import Link from "next/link";
import { Landmark, Tags } from "lucide-react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { interpolate } from "@/lib/interpolate";

import { transactionsHref } from "../href";
import type { TransactionsPageProps } from "../page-props";
import { AccountFilterSelect } from "./account-filter-select";
import { MonthSwitcher } from "./month-switcher";
import { TransactionsTable } from "./transactions-table";
import { t } from "../strings";

function headline(total: number, monthLabel: string, uncategorizedOnly: boolean): string {
  const copy = uncategorizedOnly ? t.uncategorizedHeadline : t.headline;
  if (total === 0) {
    return interpolate(copy.none, "{month}", monthLabel);
  }
  if (total === 1) {
    return interpolate(copy.one, "{month}", monthLabel);
  }
  return interpolate(interpolate(copy.many, "{count}", String(total)), "{month}", monthLabel);
}

function uncategorizedMessage(count: number, amountLabel: string, monthLabel: string): string {
  const copy = count === 1 ? t.uncategorized.one : t.uncategorized.many;
  return interpolate(
    interpolate(interpolate(copy, "{count}", String(count)), "{amount}", amountLabel),
    "{month}",
    monthLabel,
  );
}

export function TransactionsView({
  month,
  monthLabel,
  previousMonth,
  nextMonth,
  accounts,
  selectedAccountId,
  uncategorizedOnly,
  uncategorized,
  categoryGroups,
  transactions,
  total,
  page,
  hasMore,
}: TransactionsPageProps) {
  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${monthLabel}`}
        title={headline(total, monthLabel, uncategorizedOnly)}
        actions={
          <>
            <MonthSwitcher
              monthLabel={monthLabel}
              previousMonth={previousMonth}
              nextMonth={nextMonth}
              accountId={selectedAccountId}
              uncategorizedOnly={uncategorizedOnly}
            />
            {accounts.length > 0 ? (
              <AccountFilterSelect
                month={month}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                uncategorizedOnly={uncategorizedOnly}
              />
            ) : null}
            <Button variant="ghost" size="sm" render={<Link href="/categorias" />}>
              <Tags className="size-4" />
              {t.categoriesLink}
            </Button>
          </>
        }
      />
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
      {uncategorizedOnly ? (
        <p className="mb-4 text-[13px]">
          <Link
            className="text-brand underline-offset-4 hover:underline"
            href={transactionsHref({
              month,
              accountId: selectedAccountId,
              page: 1,
              uncategorizedOnly: false,
            })}
          >
            {t.uncategorized.showAll}
          </Link>
        </p>
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
        <p className="font-heading text-[18px]">
          {interpolate(t.empty.noTransactions, "{month}", monthLabel)}
        </p>
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
                          uncategorizedOnly,
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
                          uncategorizedOnly,
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
