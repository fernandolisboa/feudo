import { describe, expect, it } from "vitest";

import { transactionsHref, transactionsRouteParams } from "./href";

const BASE = {
  month: "2026-09",
  accountId: null,
  page: 1,
  uncategorizedOnly: false,
  category: null,
  kind: null,
  search: null,
} as const;

describe("transactionsHref", () => {
  it("always carries the month and only the non-default filters", () => {
    expect(transactionsHref(BASE)).toBe("/transacoes?mes=2026-09");
    expect(
      transactionsHref({ ...BASE, accountId: "acc 1", page: 3, uncategorizedOnly: true }),
    ).toBe("/transacoes?mes=2026-09&conta=acc+1&categoria=sem&pagina=3");
  });

  it("carries a category, a kind and a search term", () => {
    expect(
      transactionsHref({ ...BASE, category: "housing", kind: "fixed", search: "condominio" }),
    ).toBe("/transacoes?mes=2026-09&categoria=housing&tipo=fixed&busca=condominio");
  });

  it("lets the uncategorized filter win over a category, since they share the same param", () => {
    expect(transactionsHref({ ...BASE, uncategorizedOnly: true, category: "housing" })).toBe(
      "/transacoes?mes=2026-09&categoria=sem",
    );
  });
});

describe("transactionsRouteParams", () => {
  it("is the single source transactionsHref builds its query string from", () => {
    const view = {
      ...BASE,
      accountId: "acc-1",
      category: "housing" as const,
      kind: "fixed" as const,
      search: "condominio",
      page: 2,
    };

    expect(transactionsRouteParams(view)).toEqual([
      ["mes", "2026-09"],
      ["conta", "acc-1"],
      ["categoria", "housing"],
      ["tipo", "fixed"],
      ["busca", "condominio"],
      ["pagina", "2"],
    ]);
    expect(transactionsHref(view)).toBe(
      `/transacoes?${new URLSearchParams(transactionsRouteParams(view)).toString()}`,
    );
  });
});
