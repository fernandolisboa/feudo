"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";
import { transactionsHref, UNCATEGORIZED_FILTER } from "../href";
import { t } from "../strings";
import type { CategoryFilterOption } from "../page-props";

const ALL_CATEGORIES = "all";

export function CategoryFilterSelect({
  month,
  accountId,
  options,
  uncategorizedOnly,
  selectedCategory,
  kind,
  search,
}: {
  month: YearMonth;
  accountId: string | null;
  options: CategoryFilterOption[];
  uncategorizedOnly: boolean;
  selectedCategory: ProductCategoryId | null;
  kind: Kind | null;
  search: string | null;
}) {
  const router = useRouter();
  const value = uncategorizedOnly ? UNCATEGORIZED_FILTER : (selectedCategory ?? ALL_CATEGORIES);

  function handleValueChange(next: string | null) {
    if (next === null || next === value) {
      return;
    }
    router.push(
      transactionsHref({
        month,
        accountId,
        page: 1,
        uncategorizedOnly: next === UNCATEGORIZED_FILTER,
        category:
          next === ALL_CATEGORIES || next === UNCATEGORIZED_FILTER
            ? null
            : (next as ProductCategoryId),
        kind,
        search,
      }),
    );
  }

  const items = [
    { value: ALL_CATEGORIES, label: t.categoryFilter.all },
    { value: UNCATEGORIZED_FILTER, label: t.categoryFilter.uncategorized },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <Select items={items} value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t.categoryFilter.label}
        className="h-11 w-full max-w-none md:h-9 md:w-auto md:max-w-48"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
