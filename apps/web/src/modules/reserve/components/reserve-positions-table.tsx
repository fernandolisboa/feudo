import { Badge } from "@/ui/badge";
import { SectionHeader } from "@/ui/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import type { InstitutionOption, ReservePositionView } from "../page-props";
import { t } from "../strings";
import { ReserveMarkDialog } from "./reserve-mark-dialog";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

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
        <Table>
          <TableHeader>
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
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.accountId} className="h-[var(--density-row)]">
                <TableCell>
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
                <TableCell className="font-heading text-right tabular-nums">
                  {position.balanceLabel}
                </TableCell>
                <TableCell className={position.liquidityUnknown ? "text-warning" : undefined}>
                  {position.liquidityLabel}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {position.taxLabel}
                </TableCell>
                <TableCell className="text-right tabular-nums">{position.realYieldLabel}</TableCell>
                <TableCell>
                  {position.isReserve ? (
                    <Badge>{t.positions.inReserve}</Badge>
                  ) : (
                    <span className="text-muted-foreground">{t.positions.notInReserve}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <ReserveMarkDialog
                    accountId={position.accountId}
                    accountName={position.name}
                    edit={position.edit}
                    institutionOptions={institutionOptions}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
