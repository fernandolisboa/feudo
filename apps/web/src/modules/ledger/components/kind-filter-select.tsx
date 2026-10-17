"use client";

import { useRouter } from "next/navigation";

import { KINDS } from "@feudo/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { Kind } from "@feudo/core";
import { transactionsHref, type TransactionsRouteBase } from "../href";
import { t } from "../strings";

const ALL_KINDS = "all";

export function KindFilterSelect({ route }: { route: TransactionsRouteBase }) {
  const router = useRouter();
  const value = route.kind ?? ALL_KINDS;

  function handleValueChange(next: string | null) {
    if (next === null || next === value) {
      return;
    }
    router.push(
      transactionsHref({ ...route, page: 1, kind: next === ALL_KINDS ? null : (next as Kind) }),
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
