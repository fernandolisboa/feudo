import { formatMoney } from "@feudo/core";

import { Badge } from "@/ui/badge";
import { PaginatedTable } from "@/ui/paginated-table";
import { TableCell, TableHead, TableRow } from "@/ui/table";
import { closedLabel, describeFreshness, freshnessLabel, isStale } from "../freshness";
import type { HouseholdAccount } from "../repository";
import { AccountRowActions } from "./account-row-actions";
import { t } from "../strings";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

export const ACCOUNTS_PAGE_SIZE = 10;

export function AccountsTable({
  accounts,
  viewerUserId,
  timeZone,
  now,
}: {
  accounts: HouseholdAccount[];
  viewerUserId: string;
  timeZone: string;
  now: Date;
}) {
  const columns = t.accounts.table;
  return (
    <PaginatedTable
      stackOnNarrow
      pageSize={ACCOUNTS_PAGE_SIZE}
      labels={t.accounts.pagination}
      header={
        <TableRow>
          <TableHead className={HEAD_CLASS}>{columns.account}</TableHead>
          <TableHead className={HEAD_CLASS}>{columns.label}</TableHead>
          <TableHead className={HEAD_CLASS}>{columns.connectedBy}</TableHead>
          <TableHead className={HEAD_CLASS}>{columns.updated}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{columns.balance}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{columns.actions}</TableHead>
        </TableRow>
      }
      rows={accounts.map((account) => {
        const updated =
          account.closedAt === null
            ? freshnessLabel(describeFreshness(account.syncedAt, now, timeZone))
            : closedLabel(account.closedAt, timeZone);
        return (
          <TableRow key={account.id} className="h-[var(--density-row)]">
            <TableCell card="title">
              <span className="block font-medium">{account.name}</span>
              <span className="text-muted-foreground block text-[12px]">
                {account.institutionName} · {t.accounts.types[account.type]}
              </span>
            </TableCell>
            <TableCell label={columns.label}>
              <Badge variant={account.label === "shared" ? "default" : "outline"}>
                {t.accounts.labels[account.label]}
              </Badge>
            </TableCell>
            <TableCell label={columns.connectedBy} className="text-muted-foreground">
              {account.connectedByName}
            </TableCell>
            <TableCell
              label={columns.updated}
              className={
                isStale(account, now)
                  ? "text-warning tabular-nums"
                  : "text-muted-foreground tabular-nums"
              }
            >
              {updated}
              {account.lastSyncError ? (
                <span className="text-destructive block text-xs">{t.accounts.syncFailed}</span>
              ) : null}
            </TableCell>
            <TableCell
              label={columns.balance}
              className="font-heading text-right whitespace-nowrap tabular-nums"
            >
              {formatMoney({
                amountCentavos: account.balanceCentavos,
                currency: account.currency,
              })}
            </TableCell>
            <TableCell card="actions" className="text-right">
              {account.connectedByUserId === viewerUserId ? (
                <AccountRowActions
                  accountId={account.id}
                  accountName={account.name}
                  label={account.label}
                />
              ) : null}
            </TableCell>
          </TableRow>
        );
      })}
    />
  );
}
