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

  return (
    <Select value={selectedAccountId ?? ALL_ACCOUNTS} onValueChange={handleValueChange}>
      <SelectTrigger aria-label={t.accountFilter.label} className="max-w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_ACCOUNTS}>{t.accountFilter.all}</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.institutionName} · {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
