"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatShortMonth,
  formatYearMonth,
  monthsOfYear,
  yearOf,
  type YearMonth,
} from "@feudo/core";

import { Button } from "@/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/ui/popover";
import { interpolate } from "@/lib/interpolate";

import { MIN_YEAR_MONTH_YEAR, withMonth } from "../href";
import { t } from "../strings";

export function MonthPicker({
  month,
  monthLabel,
  latestMonth,
  monthHref,
}: {
  month: YearMonth;
  monthLabel: string;
  latestMonth: YearMonth;
  monthHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => yearOf(month));
  const latestYear = yearOf(latestMonth);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setYear(yearOf(month));
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            aria-label={interpolate(t.monthSwitcher.choose, "{month}", monthLabel)}
            className="font-heading min-w-[12rem] text-[15px] font-normal"
          />
        }
      >
        {monthLabel}
        <CalendarDays aria-hidden="true" className="text-muted-foreground size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        collisionPadding={16}
        className="w-[min(18rem,calc(100vw-2rem))] gap-3 rounded-[var(--radius)] p-3 shadow-[var(--elevation)] motion-reduce:animate-none"
      >
        <PopoverTitle className="sr-only">{t.monthSwitcher.pickerTitle}</PopoverTitle>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.monthSwitcher.previousYear}
            disabled={year <= MIN_YEAR_MONTH_YEAR}
            onClick={() => {
              setYear(year - 1);
            }}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="font-heading text-[15px] tabular-nums" aria-live="polite">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.monthSwitcher.nextYear}
            disabled={year >= latestYear}
            onClick={() => {
              setYear(year + 1);
            }}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <ul className="grid grid-cols-3 gap-1">
          {monthsOfYear(year).map((candidate) => {
            const label = formatYearMonth(candidate);
            const selected = candidate === month;
            return (
              <li key={candidate}>
                {candidate > latestMonth ? (
                  <Button variant="ghost" aria-label={label} disabled className="w-full">
                    {formatShortMonth(candidate)}
                  </Button>
                ) : (
                  <Button
                    variant={selected ? "default" : "ghost"}
                    aria-label={label}
                    aria-current={selected ? "page" : undefined}
                    className="w-full"
                    render={
                      <Link
                        href={withMonth(monthHref, candidate)}
                        onClick={() => {
                          setOpen(false);
                        }}
                      />
                    }
                  >
                    {formatShortMonth(candidate)}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
