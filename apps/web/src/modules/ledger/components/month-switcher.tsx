import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { YearMonth } from "@feudo/core";

import { Button } from "@/ui/button";

import { t } from "../strings";
import { MonthPicker } from "./month-picker";

export function MonthSwitcher({
  month,
  monthLabel,
  latestMonth,
  monthHref,
  previousHref,
  nextHref,
  tourTarget,
}: {
  month: YearMonth;
  monthLabel: string;
  latestMonth: YearMonth;
  monthHref: string;
  previousHref: string;
  nextHref: string | null;
  tourTarget?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1" data-tour={tourTarget}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.monthSwitcher.previous}
        render={<Link href={previousHref} />}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <MonthPicker
        month={month}
        monthLabel={monthLabel}
        latestMonth={latestMonth}
        monthHref={monthHref}
      />
      {nextHref ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t.monthSwitcher.next}
          render={<Link href={nextHref} />}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" aria-label={t.monthSwitcher.next} disabled>
          <ChevronRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
