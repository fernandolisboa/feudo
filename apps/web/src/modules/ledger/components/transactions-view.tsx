import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button } from "@/ui/button";
import { PageHeader } from "@/ui/page-header";
import { interpolate } from "@/lib/interpolate";

import { transactionsHref } from "../href";
import type { TransactionsPageProps } from "../page-props";
import { AccountFilterSelect } from "./account-filter-select";
import { MonthSwitcher } from "./month-switcher";
import { TransactionsTable } from "./transactions-table";
import { t } from "../strings";

function headline(total: number, monthLabel: string): string {
  if (total === 0) {
    return interpolate(t.headline.none, "{month}", monthLabel);
  }
  if (total === 1) {
    return interpolate(t.headline.one, "{month}", monthLabel);
  }
  return interpolate(interpolate(t.headline.many, "{count}", String(total)), "{month}", monthLabel);
}

export function TransactionsView({
  month,
  monthLabel,
  previousMonth,
  nextMonth,
  accounts,
  selectedAccountId,
  transactions,
  total,
  page,
  hasMore,
}: TransactionsPageProps) {
  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${monthLabel}`}
        title={headline(total, monthLabel)}
        actions={
          <>
            <MonthSwitcher
              monthLabel={monthLabel}
              previousMonth={previousMonth}
              nextMonth={nextMonth}
              accountId={selectedAccountId}
            />
            {accounts.length > 0 ? (
              <AccountFilterSelect
                month={month}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
              />
            ) : null}
          </>
        }
      />
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
          <TransactionsTable transactions={transactions} />
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
