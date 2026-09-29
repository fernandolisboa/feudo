import { describe, expect, it } from "vitest";

import { transactionsHref } from "./href";

describe("transactionsHref", () => {
  it("always carries the month and only the non-default filters", () => {
    expect(
      transactionsHref({ month: "2026-09", accountId: null, page: 1, uncategorizedOnly: false }),
    ).toBe("/transacoes?mes=2026-09");
    expect(
      transactionsHref({ month: "2026-09", accountId: "acc 1", page: 3, uncategorizedOnly: true }),
    ).toBe("/transacoes?mes=2026-09&conta=acc+1&categoria=sem&pagina=3");
  });

  it("carries a category, a kind and a search term", () => {
    expect(
      transactionsHref({
        month: "2026-09",
        accountId: null,
        page: 1,
        uncategorizedOnly: false,
        category: "housing",
        kind: "fixed",
        search: "condominio",
      }),
    ).toBe("/transacoes?mes=2026-09&categoria=housing&tipo=fixed&busca=condominio");
  });

  it("lets the uncategorized filter win over a category, since they share the same param", () => {
    expect(
      transactionsHref({
        month: "2026-09",
        accountId: null,
        page: 1,
        uncategorizedOnly: true,
        category: "housing",
      }),
    ).toBe("/transacoes?mes=2026-09&categoria=sem");
  });
});
