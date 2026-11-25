import { PageHeader } from "@/ui/page-header";
import { PaginatedTable } from "@/ui/paginated-table";
import { TableCell, TableHead, TableRow } from "@/ui/table";
import { interpolate, interpolateAll } from "@/lib/interpolate";
import type { PageSize } from "@/lib/page-size";

import { confirmAllLinksAction, confirmLinkAction, dismissLinkAction } from "../actions";
import type { LinkSuggestionRow, LinkSuggestionsProps } from "../link-suggestions-page-props";
import { t } from "../strings";
import { FormActionButton } from "./form-action-button";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";
const LINKS_PAGE_SIZE: PageSize = 20;

function ariaLabelFor(template: string, item: LinkSuggestionRow): string {
  return interpolateAll(template, {
    description: item.debitDescription,
    counterpartDescription: item.creditDescription,
  });
}

function confirmAllLabel(kind: "offset" | "funding", count: number): string {
  const template = kind === "offset" ? t.links.confirmAllOffset : t.links.confirmAllFunding;
  return interpolate(template, "{count}", String(count));
}

function title(pendingCount: number): string {
  if (pendingCount === 0) {
    return t.links.title.none;
  }
  if (pendingCount === 1) {
    return t.links.title.one;
  }
  return interpolate(t.links.title.many, "{count}", String(pendingCount));
}

export function TransactionLinksView({ items, pendingCount }: LinkSuggestionsProps) {
  const header = <PageHeader overline={t.links.overline} title={title(pendingCount)} />;

  if (items.length === 0) {
    return header;
  }

  const byKind = {
    offset: items.filter((item) => item.kind === "offset"),
    funding: items.filter((item) => item.kind === "funding"),
  };

  return (
    <>
      {header}
      {(["offset", "funding"] as const).map((kind) =>
        byKind[kind].length > 1 ? (
          <div key={kind} className="mb-3">
            <FormActionButton
              action={confirmAllLinksAction}
              fields={{
                kind,
                debitTransactionIds: byKind[kind].map((item) => item.debitTransactionId).join(","),
                creditTransactionIds: byKind[kind]
                  .map((item) => item.creditTransactionId)
                  .join(","),
              }}
              label={confirmAllLabel(kind, byKind[kind].length)}
              ariaLabel={confirmAllLabel(kind, byKind[kind].length)}
            />
          </div>
        ) : null,
      )}
      <PaginatedTable
        stackOnNarrow
        pageSize={LINKS_PAGE_SIZE}
        labels={t.links.table.pagination}
        header={
          <TableRow>
            <TableHead className={HEAD_CLASS}>{t.table.date}</TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>{t.table.amount}</TableHead>
            <TableHead className={HEAD_CLASS}>{t.table.account}</TableHead>
            <TableHead className={HEAD_CLASS}>{t.links.table.transactions}</TableHead>
            <TableHead className={HEAD_CLASS}>{t.links.table.kind}</TableHead>
            <TableHead>
              <span className="sr-only">{t.links.confirm}</span>
            </TableHead>
          </TableRow>
        }
        rows={items.map((item) => (
          <TableRow
            key={`${item.debitTransactionId}:${item.creditTransactionId}`}
            className="h-[var(--density-row)]"
          >
            <TableCell
              card="hidden"
              className="text-muted-foreground whitespace-nowrap tabular-nums"
            >
              {item.dateLabel}
            </TableCell>
            <TableCell
              card="aside"
              className="font-heading text-right whitespace-nowrap tabular-nums"
            >
              {item.amountLabel}
            </TableCell>
            <TableCell label={t.table.account} className="text-muted-foreground">
              {item.accountLabel}
            </TableCell>
            <TableCell card="title">
              <div>{item.debitDescription}</div>
              <div className="text-muted-foreground">{item.creditDescription}</div>
            </TableCell>
            <TableCell label={t.links.table.kind}>{item.kindLabel}</TableCell>
            <TableCell card="actions" className="text-right">
              <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                <FormActionButton
                  action={confirmLinkAction}
                  fields={{
                    debitTransactionId: item.debitTransactionId,
                    creditTransactionId: item.creditTransactionId,
                    kind: item.kind,
                  }}
                  label={t.links.confirm}
                  ariaLabel={ariaLabelFor(t.links.confirmFor, item)}
                />
                <FormActionButton
                  action={dismissLinkAction}
                  fields={{
                    debitTransactionId: item.debitTransactionId,
                    creditTransactionId: item.creditTransactionId,
                  }}
                  label={t.links.dismiss}
                  ariaLabel={ariaLabelFor(t.links.dismissFor, item)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      />
    </>
  );
}
