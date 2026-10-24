import { PaginatedTable } from "@/ui/paginated-table";
import { TableCell, TableHead, TableRow } from "@/ui/table";

import type { RecentAccessRowView } from "../page-props";
import { t } from "../strings";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

const RECENT_ACCESS_PAGE_SIZE = 10;

export function RecentAccessTable({ entries }: { entries: RecentAccessRowView[] }) {
  if (entries.length === 0) {
    return <p className="font-heading text-sm">{t.recentAccess.empty}</p>;
  }

  return (
    <PaginatedTable
      stackOnNarrow
      pageSize={RECENT_ACCESS_PAGE_SIZE}
      labels={t.recentAccess.pagination}
      header={
        <TableRow>
          <TableHead className={HEAD_CLASS}>{t.recentAccess.table.kind}</TableHead>
          <TableHead className={HEAD_CLASS}>{t.recentAccess.table.when}</TableHead>
        </TableRow>
      }
      rows={entries.map((entry) => (
        <TableRow key={entry.id} className="h-[var(--density-row)]">
          <TableCell card="title" className="font-medium">
            {entry.kindLabel}
          </TableCell>
          <TableCell card="aside" className="text-muted-foreground whitespace-nowrap tabular-nums">
            {entry.whenLabel}
          </TableCell>
        </TableRow>
      ))}
    />
  );
}
