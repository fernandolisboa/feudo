import { categorize, orderRules, type Categorization, type CategorizationRule } from "@feudo/core";

import type { LedgerTransactionRow } from "./repository";

export type CategorizedRow = LedgerTransactionRow & { categorization: Categorization | null };

export function categorizeRows(
  rows: readonly LedgerTransactionRow[],
  rules: readonly CategorizationRule[],
): CategorizedRow[] {
  const ordered = orderRules(rules);
  return rows.map((row) => ({
    ...row,
    categorization: categorize(
      {
        description: row.description,
        type: row.type,
        providerCategory: row.providerCategory,
        manual: row.manual,
      },
      ordered,
    ),
  }));
}
