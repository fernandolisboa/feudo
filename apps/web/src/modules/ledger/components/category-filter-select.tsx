"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { ProductCategoryId } from "@feudo/core";
import { transactionsHref, UNCATEGORIZED_FILTER, type TransactionsRouteBase } from "../href";
import { t } from "../strings";
import type { CategoryFilterOption } from "../page-props";

const ALL_CATEGORIES = "all";

export function CategoryFilterSelect({
  route,
  options,
}: {
  route: TransactionsRouteBase;
  options: CategoryFilterOption[];
}) {
  const router = useRouter();
  const value = route.uncategorizedOnly ? UNCATEGORIZED_FILTER : (route.category ?? ALL_CATEGORIES);

  function handleValueChange(next: string | null) {
    if (next === null || next === value) {
      return;
    }
    router.push(
      transactionsHref({
        ...route,
        page: 1,
        uncategorizedOnly: next === UNCATEGORIZED_FILTER,
        category:
          next === ALL_CATEGORIES || next === UNCATEGORIZED_FILTER
            ? null
            : (next as ProductCategoryId),
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
        className="w-full max-w-none md:w-auto md:max-w-48"
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
