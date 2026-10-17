import { describe, expect, it } from "vitest";

import { transactionsHref, transactionsRouteParams, transactionsSpreadsheetHref } from "./href";

const BASE = {
  month: "2026-09",
  range: null,
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

  it("carries de/ate instead of mes once a range is active, and ignores the month entirely", () => {
    expect(transactionsHref({ ...BASE, range: { from: "2026-07-06", to: "2026-10-17" } })).toBe(
      "/transacoes?de=2026-07-06&ate=2026-10-17",
    );
  });

  it("carries a range alongside the other filters, in the same order as the month view", () => {
    expect(
      transactionsHref({
        ...BASE,
        range: { from: "2026-07-06", to: "2026-10-17" },
        accountId: "acc-1",
        category: "housing",
        kind: "fixed",
        search: "condominio",
        page: 2,
      }),
    ).toBe(
      "/transacoes?de=2026-07-06&ate=2026-10-17&conta=acc-1&categoria=housing&tipo=fixed&busca=condominio&pagina=2",
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

  it("omits mes and emits de/ate instead once a range is active", () => {
    const view = { ...BASE, range: { from: "2026-07-06", to: "2026-10-17" } };

    expect(transactionsRouteParams(view)).toEqual([
      ["de", "2026-07-06"],
      ["ate", "2026-10-17"],
    ]);
  });
});

describe("transactionsSpreadsheetHref", () => {
  it("carries the same filters as the page, never a page number, plus the format", () => {
    expect(transactionsSpreadsheetHref(BASE, "xlsx")).toBe(
      "/api/transactions/spreadsheet?mes=2026-09&formato=xlsx",
    );
    expect(
      transactionsSpreadsheetHref(
        { ...BASE, accountId: "acc 1", category: "housing", kind: "fixed", search: "aluguel" },
        "csv",
      ),
    ).toBe(
      "/api/transactions/spreadsheet?mes=2026-09&conta=acc+1&categoria=housing&tipo=fixed&busca=aluguel&formato=csv",
    );
    expect(transactionsSpreadsheetHref({ ...BASE, uncategorizedOnly: true }, "csv")).toBe(
      "/api/transactions/spreadsheet?mes=2026-09&categoria=sem&formato=csv",
    );
  });

  it("carries de/ate instead of mes once a range is active", () => {
    expect(
      transactionsSpreadsheetHref(
        { ...BASE, range: { from: "2026-07-06", to: "2026-10-17" } },
        "xlsx",
      ),
    ).toBe("/api/transactions/spreadsheet?de=2026-07-06&ate=2026-10-17&formato=xlsx");
  });
});
