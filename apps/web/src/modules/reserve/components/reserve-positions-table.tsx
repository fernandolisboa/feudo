import { Badge } from "@/ui/badge";
import { SectionHeader } from "@/ui/section-header";
import { PaginatedTable } from "@/ui/paginated-table";
import { TableCell, TableHead, TableRow } from "@/ui/table";

import type { InstitutionOption, ReservePositionView } from "../page-props";
import { t } from "../strings";
import { ReserveMarkDialog } from "./reserve-mark-dialog";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

const POSITIONS_PAGE_SIZE = 10;

export function ReservePositionsTable({
  positions,
  institutionOptions,
}: {
  positions: ReservePositionView[];
  institutionOptions: InstitutionOption[];
}) {
  return (
    <section className="mb-8">
      <SectionHeader
        title={t.positions.title}
        actions={<span className="text-muted-foreground text-[12px]">{t.positions.meta}</span>}
      />
      {positions.length === 0 ? (
        <p className="font-heading text-[15px]">{t.positions.empty}</p>
      ) : (
        <PaginatedTable
          stackOnNarrow
          pageSize={POSITIONS_PAGE_SIZE}
          labels={t.positions.pagination}
          header={
            <TableRow>
              <TableHead className={HEAD_CLASS}>{t.positions.account}</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>{t.positions.balance}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.positions.liquidity}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.positions.tax}</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>{t.positions.realYield}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.positions.reserve}</TableHead>
              <TableHead className={`${HEAD_CLASS} text-right`}>
                <span className="sr-only">{t.positions.adjust}</span>
              </TableHead>
            </TableRow>
          }
          rows={positions.map((position) => (
            <TableRow key={position.accountId} className="h-[var(--density-row)]">
              <TableCell card="title">
                <span className="block font-medium">{position.name}</span>
                <span className="text-muted-foreground block text-[13px]">
                  {position.institutionLabel}
                </span>
                {position.advice ? (
                  <span
                    className={
                      position.advice.tone === "warning"
                        ? "text-warning block text-[12px]"
                        : "text-muted-foreground block text-[12px]"
                    }
                  >
                    {position.advice.label}
                  </span>
                ) : null}
              </TableCell>
              <TableCell
                card="aside"
                className="font-heading text-right whitespace-nowrap tabular-nums"
              >
                {position.balanceLabel}
              </TableCell>
              <TableCell
                label={t.positions.liquidity}
                className={position.liquidityUnknown ? "text-warning" : undefined}
              >
                {position.liquidityLabel}
              </TableCell>
              <TableCell label={t.positions.tax} className="text-muted-foreground tabular-nums">
                {position.taxLabel}
              </TableCell>
              <TableCell
                label={t.positions.realYield}
                className="text-right whitespace-nowrap tabular-nums"
              >
                {position.realYieldLabel}
              </TableCell>
              <TableCell label={t.positions.reserve}>
                {position.isReserve ? (
                  <Badge>{t.positions.inReserve}</Badge>
                ) : (
                  <span className="text-muted-foreground">{t.positions.notInReserve}</span>
                )}
              </TableCell>
              <TableCell card="actions" className="text-right">
                <ReserveMarkDialog
                  accountId={position.accountId}
                  accountName={position.name}
                  edit={position.edit}
                  institutionOptions={institutionOptions}
                />
              </TableCell>
            </TableRow>
          ))}
        />
      )}
    </section>
  );
}
