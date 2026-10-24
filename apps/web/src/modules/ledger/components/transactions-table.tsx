import { formatMoney } from "@feudo/core";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { formatIsoDate } from "@/lib/format-date";

import type { LedgerTransactionRow } from "../repository";
import { t } from "../strings";
import {
  CategorizeTransactionDialog,
  type CategorizableRow,
  type SubcategoryOptionGroup,
} from "./categorize-transaction-dialog";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";
function cardMetaLine(transaction: TransactionRowView): string {
  const categoryLabel = transaction.category
    ? transaction.category.label
    : t.category.uncategorized;
  return [
    formatIsoDate(transaction.date),
    categoryLabel,
    transaction.institutionName,
    transaction.accountName,
  ].join(" · ");
}

export type TransactionRowView = Pick<
  LedgerTransactionRow,
  "id" | "date" | "description" | "amountCentavos" | "currency" | "accountName" | "institutionName"
> & {
  category: { label: string; categoryLabel: string; sourceLabel: string } | null;
  categorize: CategorizableRow;
};

export function TransactionsTable({
  transactions,
  groups,
}: {
  transactions: TransactionRowView[];
  groups: SubcategoryOptionGroup[];
}) {
  return (
    <Table stackOnNarrow>
      <TableHeader>
        <TableRow>
          <TableHead className={HEAD_CLASS}>{t.table.date}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.description}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.category}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.account}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{t.table.amount}</TableHead>
          <TableHead>
            <span className="sr-only">{t.categorize.action}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => (
          <TableRow key={transaction.id} className="h-[var(--density-row)]">
            <TableCell
              card="hidden"
              className="text-muted-foreground whitespace-nowrap tabular-nums"
            >
              {formatIsoDate(transaction.date)}
            </TableCell>
            <TableCell card="title" className="font-medium">
              <div>{transaction.description}</div>
              <div data-card-only className="text-muted-foreground mt-0.5 text-[12px] font-normal">
                {cardMetaLine(transaction)}
              </div>
            </TableCell>
            <TableCell card="hidden">
              {transaction.category ? (
                <Tooltip>
                  <TooltipTrigger render={<span tabIndex={0} />}>
                    {transaction.category.label}
                    <span className="text-muted-foreground">
                      {" "}
                      · {transaction.category.categoryLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{transaction.category.sourceLabel}</TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-warning">{t.category.uncategorized}</span>
              )}
            </TableCell>
            <TableCell card="hidden" className="text-muted-foreground">
              {transaction.institutionName} · {transaction.accountName}
            </TableCell>
            <TableCell
              card="aside"
              className="font-heading text-right whitespace-nowrap tabular-nums"
            >
              {formatMoney({
                amountCentavos: transaction.amountCentavos,
                currency: transaction.currency,
              })}
            </TableCell>
            <TableCell
              card="actions"
              className="text-right"
              data-tour={index === 0 ? "transactions.category" : undefined}
            >
              <CategorizeTransactionDialog transaction={transaction.categorize} groups={groups} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
