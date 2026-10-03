import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";
import { transactionsHref, transactionsRouteParams } from "../href";
import type { LedgerAccount } from "../repository";
import { t } from "../strings";
import { AccountFilterSelect } from "./account-filter-select";
import { CategoryFilterSelect } from "./category-filter-select";
import { KindFilterSelect } from "./kind-filter-select";
import type { CategoryFilterOption } from "../page-props";

export function TransactionsFilterBar({
  month,
  accounts,
  selectedAccountId,
  uncategorizedOnly,
  selectedCategory,
  categoryFilterOptions,
  selectedKind,
  searchQuery,
}: {
  month: YearMonth;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
  uncategorizedOnly: boolean;
  selectedCategory: ProductCategoryId | null;
  categoryFilterOptions: CategoryFilterOption[];
  selectedKind: Kind | null;
  searchQuery: string | null;
}) {
  const hasActiveFilters =
    selectedAccountId !== null ||
    uncategorizedOnly ||
    selectedCategory !== null ||
    selectedKind !== null ||
    Boolean(searchQuery);

  const hiddenParams = transactionsRouteParams({
    month,
    accountId: selectedAccountId,
    page: 1,
    uncategorizedOnly,
    category: selectedCategory,
    kind: selectedKind,
    search: null,
  }).filter(([name]) => name !== "busca" && name !== "pagina");

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <form action="/transacoes" method="get" className="w-full md:w-72 md:flex-none">
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
            defaultValue={searchQuery ?? ""}
            placeholder={t.search.placeholder}
            className="w-full pl-8"
          />
        </div>
      </form>
      <div className="grid grid-cols-2 gap-2 md:contents">
        <div className="col-span-2 md:contents">
          <AccountFilterSelect
            month={month}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            uncategorizedOnly={uncategorizedOnly}
            category={selectedCategory}
            kind={selectedKind}
            search={searchQuery}
          />
        </div>
        <KindFilterSelect
          month={month}
          accountId={selectedAccountId}
          uncategorizedOnly={uncategorizedOnly}
          category={selectedCategory}
          kind={selectedKind}
          search={searchQuery}
        />
        <CategoryFilterSelect
          month={month}
          accountId={selectedAccountId}
          options={categoryFilterOptions}
          uncategorizedOnly={uncategorizedOnly}
          selectedCategory={selectedCategory}
          kind={selectedKind}
          search={searchQuery}
        />
      </div>
      {hasActiveFilters ? (
        <Button
          variant="link"
          size="sm"
          render={
            <Link
              href={transactionsHref({
                month,
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
