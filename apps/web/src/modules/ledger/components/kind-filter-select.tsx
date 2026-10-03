"use client";

import { useRouter } from "next/navigation";

import { KINDS } from "@feudo/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";
import { transactionsHref } from "../href";
import { t } from "../strings";

const ALL_KINDS = "all";

export function KindFilterSelect({
  month,
  accountId,
  uncategorizedOnly,
  category,
  kind,
  search,
}: {
  month: YearMonth;
  accountId: string | null;
  uncategorizedOnly: boolean;
  category: ProductCategoryId | null;
  kind: Kind | null;
  search: string | null;
}) {
  const router = useRouter();
  const value = kind ?? ALL_KINDS;

  function handleValueChange(next: string | null) {
    if (next === null || next === value) {
      return;
    }
    router.push(
      transactionsHref({
        month,
        accountId,
        page: 1,
        uncategorizedOnly,
        category,
        kind: next === ALL_KINDS ? null : (next as Kind),
        search,
      }),
    );
  }

  const items = [
    { value: ALL_KINDS, label: t.kindFilter.all },
    ...KINDS.map((kindOption) => ({ value: kindOption, label: t.kinds[kindOption] })),
  ];

  return (
    <Select items={items} value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t.kindFilter.label}
        className="w-full max-w-none md:w-auto md:max-w-40"
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
