"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { YearMonth } from "@feudo/core";
import { transactionsHref } from "../href";
import type { LedgerAccount } from "../repository";
import { t } from "../strings";

const ALL_ACCOUNTS = "all";

export function AccountFilterSelect({
  month,
  accounts,
  selectedAccountId,
}: {
  month: YearMonth;
  accounts: LedgerAccount[];
  selectedAccountId: string | null;
}) {
  const router = useRouter();

  function handleValueChange(value: string | null) {
    const accountId = value === null || value === ALL_ACCOUNTS ? null : value;
    if (accountId === selectedAccountId) {
      return;
    }
    router.push(transactionsHref({ month, accountId, page: 1 }));
  }

  const items = [
    { value: ALL_ACCOUNTS, label: t.accountFilter.all },
    ...accounts.map((account) => ({
      value: account.id,
      label: `${account.institutionName} · ${account.name}`,
    })),
  ];

  return (
    <Select
      items={items}
      value={selectedAccountId ?? ALL_ACCOUNTS}
      onValueChange={handleValueChange}
    >
      <SelectTrigger aria-label={t.accountFilter.label} className="max-w-64">
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
