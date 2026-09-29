import { formatMoney } from "@feudo/core";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { formatIsoDate, formatIsoDateShort } from "@/lib/format-date";

import type { LedgerTransactionRow } from "../repository";
import { t } from "../strings";
import {
  CategorizeTransactionDialog,
  type CategorizableRow,
  type SubcategoryOptionGroup,
} from "./categorize-transaction-dialog";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";
const DESKTOP_ONLY_CLASS = "hidden md:table-cell";

// The three columns a narrow screen drops (date, category, account) are
// still shown, folded into one line under the description, so a mobile row
// loses no information, only the table's rigid columns for it.
function mobileMetaLine(transaction: TransactionRowView): string {
  const categoryLabel = transaction.category
    ? transaction.category.label
    : t.category.uncategorized;
  return [
    formatIsoDateShort(transaction.date),
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={`${HEAD_CLASS} ${DESKTOP_ONLY_CLASS}`}>{t.table.date}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.table.description}</TableHead>
          <TableHead className={`${HEAD_CLASS} ${DESKTOP_ONLY_CLASS}`}>
            {t.table.category}
          </TableHead>
          <TableHead className={`${HEAD_CLASS} ${DESKTOP_ONLY_CLASS}`}>{t.table.account}</TableHead>
          <TableHead className={`${HEAD_CLASS} text-right`}>{t.table.amount}</TableHead>
          <TableHead>
            <span className="sr-only">{t.categorize.action}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id} className="h-[var(--density-row)]">
            <TableCell className={`text-muted-foreground tabular-nums ${DESKTOP_ONLY_CLASS}`}>
              {formatIsoDate(transaction.date)}
            </TableCell>
            <TableCell className="font-medium">
              <div>{transaction.description}</div>
              <div className="text-muted-foreground mt-0.5 text-[12px] font-normal md:hidden">
                {mobileMetaLine(transaction)}
              </div>
            </TableCell>
            <TableCell className={DESKTOP_ONLY_CLASS}>
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
            <TableCell className={`text-muted-foreground ${DESKTOP_ONLY_CLASS}`}>
              {transaction.institutionName} · {transaction.accountName}
            </TableCell>
            <TableCell className="font-heading text-right tabular-nums">
              {formatMoney({
                amountCentavos: transaction.amountCentavos,
                currency: transaction.currency,
              })}
            </TableCell>
            <TableCell className="text-right">
              <CategorizeTransactionDialog transaction={transaction.categorize} groups={groups} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
