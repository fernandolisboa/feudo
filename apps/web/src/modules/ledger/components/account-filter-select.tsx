"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import { transactionsHref, type TransactionsRouteBase } from "../href";
import type { LedgerAccount } from "../repository";
import { t } from "../strings";

const ALL_ACCOUNTS = "all";

export function AccountFilterSelect({
  route,
  accounts,
}: {
  route: TransactionsRouteBase;
  accounts: LedgerAccount[];
}) {
  const router = useRouter();

  function handleValueChange(value: string | null) {
    const accountId = value === null || value === ALL_ACCOUNTS ? null : value;
    if (accountId === route.accountId) {
      return;
    }
    router.push(transactionsHref({ ...route, accountId, page: 1 }));
  }

  const items = [
    { value: ALL_ACCOUNTS, label: t.accountFilter.all },
    ...accounts.map((account) => ({
      value: account.id,
      label: `${account.institutionName} · ${account.name}`,
    })),
  ];

  return (
    <Select items={items} value={route.accountId ?? ALL_ACCOUNTS} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t.accountFilter.label}
        data-tour="transactions.account"
        className="w-full max-w-none md:w-auto md:max-w-64"
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
