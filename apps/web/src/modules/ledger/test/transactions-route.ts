import type { TransactionsRouteBase } from "../href";

export function transactionsRouteFixture(
  overrides: Partial<TransactionsRouteBase> = {},
): TransactionsRouteBase {
  return {
    month: "2026-09",
    range: null,
    accountId: null,
    uncategorizedOnly: false,
    category: null,
    kind: null,
    search: null,
    ...overrides,
  };
}
