import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/ui/button";

import { t } from "../strings";

export function MonthSwitcher({
  monthLabel,
  previousHref,
  nextHref,
  tourTarget,
}: {
  monthLabel: string;
  previousHref: string;
  nextHref: string | null;
  tourTarget?: string;
}) {
  return (
    <div className="flex items-center gap-1" data-tour={tourTarget}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.monthSwitcher.previous}
        render={<Link href={previousHref} />}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="font-heading min-w-[9.5rem] text-center text-[15px]">{monthLabel}</span>
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
