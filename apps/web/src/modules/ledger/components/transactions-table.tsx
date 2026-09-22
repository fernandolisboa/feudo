import { formatMoney } from "@feudo/core";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { formatIsoDate } from "@/lib/format-date";

import type { LedgerTransaction } from "../repository";
import { t } from "../strings";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

export function TransactionsTable({ transactions }: { transactions: LedgerTransaction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={HEAD_CLASS}>{t.table.date}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.description}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.account}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{t.table.amount}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id} className="h-[var(--density-row)]">
            <TableCell className="text-muted-foreground tabular-nums">
              {formatIsoDate(transaction.date)}
            </TableCell>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell className="text-muted-foreground">
              {transaction.institutionName} · {transaction.accountName}
            </TableCell>
            <TableCell className="font-heading text-right tabular-nums">
              {formatMoney({
                amountCentavos: transaction.amountCentavos,
                currency: transaction.currency,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
