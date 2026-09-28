import type { YearMonth } from "@feudo/core";

export function overviewHref(month: YearMonth): string {
  return `/?mes=${month}`;
}
