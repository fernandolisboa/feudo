import Link from "next/link";

import { Button } from "@/ui/button";

import { t } from "../strings";

export function PeriodSwitcher({
  periodLabel,
  viewByMonthHref,
  tourTarget,
}: {
  periodLabel: string;
  viewByMonthHref: string;
  tourTarget?: string;
}) {
  return (
    <div className="flex items-center gap-2" data-tour={tourTarget}>
      <span className="font-heading text-[15px] tabular-nums">{periodLabel}</span>
      <Button variant="ghost" size="sm" render={<Link href={viewByMonthHref} />}>
        {t.period.viewByMonth}
      </Button>
    </div>
  );
}
