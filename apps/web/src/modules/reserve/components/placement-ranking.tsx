import { SectionHeader } from "@/ui/section-header";

import type { PlacementRankingView, PlacementRowView } from "../page-props";
import { t } from "../strings";

function RealYield({ label, valueClassName }: { label: string; valueClassName: string }) {
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className={`${valueClassName} tabular-nums`}>{label}</span>
      <span className="text-muted-foreground text-[12px]">{t.ranking.realYieldCaption}</span>
    </span>
  );
}

function PlacementDetails({ row }: { row: PlacementRowView }) {
  return (
    <p className="text-muted-foreground text-[13px] tabular-nums">
      {[
        row.netYieldLabel,
        row.taxLabel === t.tax.none ? "" : `${t.positions.tax} ${row.taxLabel}`,
        row.guaranteeLabel,
      ]
        .filter(Boolean)
        .join(" · ")}
    </p>
  );
}

export function PlacementRanking({ ranking }: { ranking: PlacementRankingView }) {
  const hasOthers = ranking.alsoRanked.length > 0 || ranking.excluded.length > 0;

  return (
    <section className="mb-8">
      <SectionHeader
        title={t.ranking.title}
        actions={<span className="text-muted-foreground text-[12px]">{t.ranking.meta}</span>}
      />

      {ranking.top.length === 0 ? (
        <p className="font-heading text-[15px]">{t.ranking.empty}</p>
      ) : (
        <ol aria-label={t.ranking.title} className="divide-border flex flex-col divide-y">
          {ranking.top.map((row) => (
            <li key={row.accountId} className="flex items-start gap-4 py-3">
              <span className="font-heading w-8 shrink-0 text-[22px] tabular-nums">
                {row.placeLabel}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="font-medium">{row.name}</p>
                <p className="text-muted-foreground text-[13px]">{row.institutionLabel}</p>
                <PlacementDetails row={row} />
              </div>
              <RealYield label={row.realYieldLabel} valueClassName="font-heading text-[18px]" />
            </li>
          ))}
        </ol>
      )}

      {hasOthers ? (
        <div className="mt-6">
          <h3 className="text-muted-foreground mb-2 text-[11px] tracking-wide uppercase">
            {t.ranking.alsoTitle}
          </h3>
          <ul aria-label={t.ranking.alsoTitle} className="divide-border flex flex-col divide-y">
            {ranking.alsoRanked.map((row) => (
              <li key={row.accountId} className="flex items-start gap-4 py-2 text-[13px]">
                <span className="w-8 shrink-0 tabular-nums">{row.placeLabel}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>
                    {row.name}{" "}
                    <span className="text-muted-foreground">· {row.institutionLabel}</span>
                  </span>
                  <PlacementDetails row={row} />
                </div>
                <RealYield label={row.realYieldLabel} valueClassName="" />
              </li>
            ))}
            {ranking.excluded.map((row) => (
              <li key={row.accountId} className="flex items-start gap-4 py-2 text-[13px]">
                <span className="text-muted-foreground w-8 shrink-0">
                  {t.ranking.excludedLabel}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>
                    {row.name}{" "}
                    <span className="text-muted-foreground">· {row.institutionLabel}</span>
                  </span>
                  <span className="text-muted-foreground">{row.reasonsLabel}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-muted-foreground mt-4 text-[12px] tabular-nums">
        {ranking.indicatorsLabel}
      </p>
      <p className="text-muted-foreground text-[12px]">{t.ranking.footnote}</p>
    </section>
  );
}
