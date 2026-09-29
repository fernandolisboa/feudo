import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";
import { transactionsHref, UNCATEGORIZED_FILTER } from "../href";
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

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form action="/transacoes" method="get" className="w-full md:w-72 md:flex-none">
        <input type="hidden" name="mes" value={month} />
        {selectedAccountId ? <input type="hidden" name="conta" value={selectedAccountId} /> : null}
        {uncategorizedOnly ? (
          <input type="hidden" name="categoria" value={UNCATEGORIZED_FILTER} />
        ) : selectedCategory ? (
          <input type="hidden" name="categoria" value={selectedCategory} />
        ) : null}
        {selectedKind ? <input type="hidden" name="tipo" value={selectedKind} /> : null}
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
            className="h-11 w-full pl-8 md:h-9"
          />
        </div>
      </form>
      {accounts.length > 0 ? (
        <AccountFilterSelect
          month={month}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          uncategorizedOnly={uncategorizedOnly}
          category={selectedCategory}
          kind={selectedKind}
          search={searchQuery}
        />
      ) : null}
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
