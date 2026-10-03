import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import type { RecentAccessRowView } from "../page-props";
import { t } from "../strings";

export function RecentAccessTable({ entries }: { entries: RecentAccessRowView[] }) {
  if (entries.length === 0) {
    return <p className="font-heading text-sm">{t.recentAccess.empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.recentAccess.table.kind}
          </TableHead>
          <TableHead className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.recentAccess.table.when}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id} className="h-[var(--density-row)]">
            <TableCell className="font-medium">{entry.kindLabel}</TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{entry.whenLabel}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
