import type { YearMonth } from "@feudo/core";

import { MONTH_PARAM } from "./href";

export function overviewHref(month: YearMonth): string {
  return `/?${MONTH_PARAM}=${month}`;
}
