import Link from "next/link";

import { Button } from "@/ui/button";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { StatTile } from "@/ui/stat-tile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import type { ReservePageProps } from "../page-props";
import { t } from "../strings";
import { ReserveMultipleSelect } from "./reserve-multiple-select";
import { ReserveNoticePanel } from "./reserve-notice-panel";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

export function ReserveView(props: ReservePageProps) {
  const {
    monthLabel,
    multiple,
    hasAccounts,
    hasHistory,
    headline,
    tiles,
    monthlyFixedCosts,
    notice,
  } = props;

  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${monthLabel}`}
        title={headline}
        actions={<ReserveMultipleSelect multiple={multiple} />}
      />

      {notice ? <ReserveNoticePanel id={notice.id} message={notice.message} /> : null}

      {!hasAccounts ? (
        <>
          <p className="font-heading text-[18px]">{t.empty.noAccounts}</p>
          <Button className="mt-4" render={<Link href="/conectar-banco" />}>
            {t.empty.connectAction}
          </Button>
        </>
      ) : !hasHistory || !tiles ? (
        <>
          <p className="font-heading text-[18px]">{t.empty.noHistory}</p>
          <Button className="mt-4" variant="outline" render={<Link href="/transacoes" />}>
            {t.empty.categorizeAction}
          </Button>
        </>
      ) : (
        <>
          <div className="bg-border mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
            <StatTile {...tiles.target} />
            <StatTile {...tiles.averageFixedCost} />
            <StatTile {...tiles.currentReserve} />
            <StatTile {...tiles.coverage} />
          </div>

          <section>
            <SectionHeader title={t.monthlyTable.title} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={HEAD_CLASS}>{t.monthlyTable.month}</TableHead>
                  <TableHead className={`${HEAD_CLASS} text-right`}>
                    {t.monthlyTable.amount}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyFixedCosts.map((row) => (
                  <TableRow key={row.monthLabel} className="h-[var(--density-row)]">
                    <TableCell className="capitalize">{row.monthLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.amountLabel ?? (
                        <span className="text-muted-foreground">{t.monthlyTable.gap}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </>
  );
}
