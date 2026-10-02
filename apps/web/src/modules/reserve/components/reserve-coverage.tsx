import { Progress } from "@/ui/progress";
import { SectionHeader } from "@/ui/section-header";

import type { ReserveCoverageView } from "../page-props";
import { t } from "../strings";

export function ReserveCoverage({ coverage }: { coverage: ReserveCoverageView }) {
  return (
    <section className="mb-8">
      <SectionHeader title={t.coverage.title} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-heading text-[18px] tabular-nums">{coverage.summaryLabel}</p>
          <p className="text-muted-foreground text-[13px] tabular-nums">
            {[coverage.percentLabel, coverage.monthsLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Progress
          value={coverage.progressPercent}
          aria-label={t.coverage.progressLabel}
          className="[&_[data-slot=progress-indicator]]:bg-chart-1 [&_[data-slot=progress-track]]:h-2"
        />
      </div>
    </section>
  );
}
