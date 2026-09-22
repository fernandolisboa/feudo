import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/ui/button";

import type { YearMonth } from "@feudo/core";
import { transactionsHref } from "../href";
import { t } from "../strings";

export function MonthSwitcher({
  monthLabel,
  previousMonth,
  nextMonth,
  accountId,
}: {
  monthLabel: string;
  previousMonth: YearMonth;
  nextMonth: YearMonth | null;
  accountId: string | null;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t.monthSwitcher.previous}
        render={<Link href={transactionsHref({ month: previousMonth, accountId, page: 1 })} />}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="font-heading min-w-[9.5rem] text-center text-[15px] capitalize">
        {monthLabel}
      </span>
      {nextMonth ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.monthSwitcher.next}
          render={<Link href={transactionsHref({ month: nextMonth, accountId, page: 1 })} />}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label={t.monthSwitcher.next} disabled>
          <ChevronRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
