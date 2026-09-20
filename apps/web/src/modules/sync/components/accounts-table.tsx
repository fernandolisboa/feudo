import { formatMoney } from "@feudo/core";

import { Badge } from "@/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { formatShortDateTime } from "@/lib/format-date";

import type { HouseholdAccount } from "../repository";
import { AccountRowActions } from "./account-row-actions";
import { t } from "../strings";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

export function AccountsTable({
  accounts,
  viewerUserId,
  timeZone,
}: {
  accounts: HouseholdAccount[];
  viewerUserId: string;
  timeZone: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.institution}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.account}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.type}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.label}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.connectedBy}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.accounts.table.updated}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{t.accounts.table.balance}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{t.accounts.table.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id} className="h-[var(--density-row)]">
            <TableCell>{account.institutionName}</TableCell>
            <TableCell className="font-medium">{account.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {t.accounts.types[account.type]}
            </TableCell>
            <TableCell>
              <Badge variant={account.label === "shared" ? "default" : "outline"}>
                {t.accounts.labels[account.label]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{account.connectedByName}</TableCell>
            <TableCell className="text-muted-foreground tabular-nums">
              {formatShortDateTime(account.syncedAt, timeZone)}
              {account.lastSyncError ? (
                <span className="text-destructive block text-xs">{t.accounts.syncFailed}</span>
              ) : null}
            </TableCell>
            <TableCell className="font-heading text-right tabular-nums">
              {formatMoney({ amountCentavos: account.balanceCentavos, currency: account.currency })}
            </TableCell>
            <TableCell className="text-right">
              {account.connectedByUserId === viewerUserId ? (
                <AccountRowActions
                  accountId={account.id}
                  accountName={account.name}
                  label={account.label}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
