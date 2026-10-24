import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/ui/button";
import { PageHeader } from "@/ui/page-header";
import { PageTabs, type PageTab } from "@/ui/page-tabs";
import { SectionHeader } from "@/ui/section-header";
import { StatTile } from "@/ui/stat-tile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import { interpolate } from "@/lib/interpolate";
import type { ReservePageProps } from "../page-props";
import { t } from "../strings";
import { PlacementRanking } from "./placement-ranking";
import { ReserveCoverage } from "./reserve-coverage";
import { ReserveMultipleSelect } from "./reserve-multiple-select";
import { ReserveNoticePanel } from "./reserve-notice-panel";
import { ReservePositionsTable } from "./reserve-positions-table";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

function ReserveMultipleActions({ multiple, canManage }: { multiple: number; canManage: boolean }) {
  if (!canManage) {
    return (
      <span className="text-[14px] tabular-nums" aria-label={t.multipleSelect.label}>
        {interpolate(t.multipleSelect.readOnly, "{multiple}", String(multiple))}
      </span>
    );
  }
  return <ReserveMultipleSelect multiple={multiple} />;
}

function MonthlyFixedCostTable({ rows }: { rows: ReservePageProps["monthlyFixedCosts"] }) {
  return (
    <section>
      <SectionHeader title={t.monthlyTable.title} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={HEAD_CLASS}>{t.monthlyTable.month}</TableHead>
            <TableHead className={`${HEAD_CLASS} text-right`}>{t.monthlyTable.amount}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.monthLabel} className="h-[var(--density-row)]">
              <TableCell>{row.monthLabel}</TableCell>
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
  );
}

export function ReserveView(
  props: ReservePageProps & { initialTab?: string; analystReading?: ReactNode },
) {
  const {
    monthLabel,
    multiple,
    canManage,
    hasAccounts,
    hasHistory,
    headline,
    tiles,
    coverage,
    monthlyFixedCosts,
    notice,
    positions,
    ranking,
    institutionOptions,
    initialTab,
    analystReading,
  } = props;

  const summary = (
    <>
      {!hasHistory || !tiles ? (
        <Button className="mb-8" variant="outline" render={<Link href="/transacoes" />}>
          {t.empty.categorizeAction}
        </Button>
      ) : (
        <div className="bg-border mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
          <StatTile {...tiles.target} />
          <StatTile {...tiles.averageFixedCost} />
          <StatTile {...tiles.currentReserve} />
          <StatTile {...tiles.coverage} />
        </div>
      )}
      {coverage ? <ReserveCoverage coverage={coverage} /> : null}
      {hasHistory && tiles ? <MonthlyFixedCostTable rows={monthlyFixedCosts} /> : null}
    </>
  );

  const tabs: PageTab[] = [
    { value: "resumo", label: t.tabs.summary, content: summary },
    {
      value: "onde-guardar",
      label: t.tabs.placement,
      content: ranking ? <PlacementRanking ranking={ranking} /> : null,
    },
    {
      value: "contas",
      label: t.tabs.accounts,
      content: (
        <ReservePositionsTable positions={positions} institutionOptions={institutionOptions} />
      ),
    },
    ...(analystReading
      ? [{ value: "leitura", label: t.tabs.reading, content: analystReading }]
      : []),
  ];

  return (
    <>
      <PageHeader
        overline={`${t.overline} · ${monthLabel}`}
        title={headline}
        actions={<ReserveMultipleActions multiple={multiple} canManage={canManage} />}
      />

      {notice ? <ReserveNoticePanel id={notice.id} message={notice.message} /> : null}

      {!hasAccounts ? (
        <Button className="mt-4" render={<Link href="/conectar-banco" />}>
          {t.empty.connectAction}
        </Button>
      ) : (
        <PageTabs label={t.tabs.label} tabs={tabs} initialTab={initialTab} />
      )}
    </>
  );
}
