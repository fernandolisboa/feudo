import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import { transactionsHref, transactionsRouteParams, type TransactionsRouteBase } from "../href";
import type { LedgerAccount } from "../repository";
import { t } from "../strings";
import { AccountFilterSelect } from "./account-filter-select";
import { CategoryFilterSelect } from "./category-filter-select";
import { KindFilterSelect } from "./kind-filter-select";
import { PeriodFilterForm } from "./period-filter-form";
import type { CategoryFilterOption } from "../page-props";

export function TransactionsFilterBar({
  route,
  accounts,
  categoryFilterOptions,
  todayIso,
}: {
  route: TransactionsRouteBase;
  accounts: LedgerAccount[];
  categoryFilterOptions: CategoryFilterOption[];
  todayIso: string;
}) {
  const hasActiveFilters =
    route.accountId !== null ||
    route.uncategorizedOnly ||
    route.category !== null ||
    route.kind !== null ||
    Boolean(route.search) ||
    route.range !== null;

  const hiddenParams = transactionsRouteParams({ ...route, page: 1, search: null }).filter(
    ([name]) => name !== "busca" && name !== "pagina",
  );

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <form
        action="/transacoes"
        method="get"
        data-offline-read
        className="w-full md:w-72 md:flex-none"
      >
        {hiddenParams.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <div className="relative">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <label htmlFor="transactions-search" className="sr-only">
            {t.search.label}
          </label>
          <Input
            id="transactions-search"
            name="busca"
            type="search"
            defaultValue={route.search ?? ""}
            placeholder={t.search.placeholder}
            className="w-full pl-8"
          />
        </div>
      </form>
      <div className="grid grid-cols-2 gap-2 md:contents">
        <div className="col-span-2 md:contents">
          <AccountFilterSelect route={route} accounts={accounts} />
        </div>
        <KindFilterSelect route={route} />
        <CategoryFilterSelect route={route} options={categoryFilterOptions} />
      </div>
      <PeriodFilterForm route={route} todayIso={todayIso} />
      {hasActiveFilters ? (
        <Button
          variant="link"
          size="sm"
          render={
            <Link
              href={transactionsHref({
                month: route.month,
                range: null,
                accountId: null,
                page: 1,
                uncategorizedOnly: false,
                category: null,
                kind: null,
                search: null,
              })}
            />
          }
        >
          {t.filters.clear}
        </Button>
      ) : null}
    </div>
  );
}
