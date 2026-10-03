import { formatYearMonth, groupConsecutiveMonths, type YearMonth } from "@feudo/core";

import { interpolateAll } from "@/lib/interpolate";

import { t } from "./strings";

export function describeMonths(months: readonly YearMonth[]): string {
  const parts = groupConsecutiveMonths(months).map((range) =>
    range.from === range.to
      ? formatYearMonth(range.from)
      : interpolateAll(t.months.range, {
          from: formatYearMonth(range.from),
          to: formatYearMonth(range.to),
        }),
  );
  const last = parts.pop();
  if (last === undefined) {
    return "";
  }
  return parts.length === 0 ? last : `${parts.join(", ")}${t.months.and}${last}`;
}
