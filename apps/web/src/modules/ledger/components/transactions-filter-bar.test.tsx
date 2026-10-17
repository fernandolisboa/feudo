// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { transactionsRouteParams } from "../href";
import { t } from "../strings";
import { transactionsRouteFixture as route } from "../test/transactions-route";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { TransactionsFilterBar } from "./transactions-filter-bar";

const accounts = [{ id: "acc-1", name: "Conta corrente", institutionName: "Banco Fixture" }];
const TODAY_ISO = "2026-10-17";

afterEach(() => {
  cleanup();
});

describe("TransactionsFilterBar", () => {
  it("renders exactly the hidden inputs transactionsRouteParams would produce for the same filters, minus busca and pagina", () => {
    const { container } = render(
      <TransactionsFilterBar
        route={route({
          accountId: "acc-1",
          category: "housing",
          kind: "fixed",
          search: "condominio",
        })}
        accounts={accounts}
        categoryFilterOptions={[{ id: "housing", label: t.categories.housing }]}
        todayIso={TODAY_ISO}
      />,
    );

    const forms = container.querySelectorAll("form");
    const searchForm = forms[0];
    expect(searchForm?.getAttribute("action")).toBe("/transacoes");
    const hiddenInputs = [...(searchForm?.querySelectorAll('input[type="hidden"]') ?? [])].map(
      (input) => [input.getAttribute("name"), input.getAttribute("value")],
    );
    const expected = transactionsRouteParams({
      month: "2026-09",
      range: null,
      accountId: "acc-1",
      page: 1,
      uncategorizedOnly: false,
      category: "housing",
      kind: "fixed",
      search: null,
    }).filter(([name]) => name !== "busca" && name !== "pagina");
    expect(hiddenInputs).toEqual(expected);
    expect(hiddenInputs).toEqual([
      ["mes", "2026-09"],
      ["conta", "acc-1"],
      ["categoria", "housing"],
      ["tipo", "fixed"],
    ]);
    expect(screen.getByLabelText(t.search.label).getAttribute("value")).toBe("condominio");
  });

  it("shows no clear-filters link when nothing is filtered", () => {
    render(
      <TransactionsFilterBar
        route={route()}
        accounts={accounts}
        categoryFilterOptions={[]}
        todayIso={TODAY_ISO}
      />,
    );

    expect(screen.queryByRole("link", { name: t.filters.clear })).toBeNull();
  });

  it("shows a clear-filters link once any filter is active", () => {
    render(
      <TransactionsFilterBar
        route={route({ search: "mercado" })}
        accounts={accounts}
        categoryFilterOptions={[]}
        todayIso={TODAY_ISO}
      />,
    );

    const link = screen.getByRole("link", { name: t.filters.clear });
    expect(link.getAttribute("href")).toBe("/transacoes?mes=2026-09");
  });

  it("shows a clear-filters link once a range is active, and it drops the range", () => {
    render(
      <TransactionsFilterBar
        route={route({ range: { from: "2026-07-06", to: "2026-10-17" } })}
        accounts={accounts}
        categoryFilterOptions={[]}
        todayIso={TODAY_ISO}
      />,
    );

    const link = screen.getByRole("link", { name: t.filters.clear });
    expect(link.getAttribute("href")).toBe("/transacoes?mes=2026-09");
  });

  it("renders the period form with De/Até inputs prefilled from the active range", () => {
    render(
      <TransactionsFilterBar
        route={route({ range: { from: "2026-07-06", to: "2026-10-17" } })}
        accounts={accounts}
        categoryFilterOptions={[]}
        todayIso={TODAY_ISO}
      />,
    );

    const from = screen.getByLabelText(t.period.from);
    const to = screen.getByLabelText(t.period.to);
    expect(from.getAttribute("value")).toBe("2026-07-06");
    expect(to.getAttribute("value")).toBe("2026-10-17");
    expect(from.getAttribute("max")).toBe(TODAY_ISO);
    expect(to.getAttribute("max")).toBe(TODAY_ISO);
    expect(screen.getByRole("button", { name: t.period.apply })).not.toBeNull();
  });

  it("carries mes and the other active filters as hidden inputs on the period form, but never pagina", () => {
    const { container } = render(
      <TransactionsFilterBar
        route={route({
          accountId: "acc-1",
          category: "housing",
          kind: "fixed",
          search: "condominio",
        })}
        accounts={accounts}
        categoryFilterOptions={[{ id: "housing", label: t.categories.housing }]}
        todayIso={TODAY_ISO}
      />,
    );

    const forms = container.querySelectorAll("form");
    const periodForm = forms[forms.length - 1];
    const hiddenInputs = [...(periodForm?.querySelectorAll('input[type="hidden"]') ?? [])].map(
      (input) => [input.getAttribute("name"), input.getAttribute("value")],
    );
    expect(hiddenInputs).toEqual([
      ["mes", "2026-09"],
      ["conta", "acc-1"],
      ["categoria", "housing"],
      ["tipo", "fixed"],
      ["busca", "condominio"],
    ]);
  });

  it("marks the De input required, so a half-filled period submit cannot drop it silently", () => {
    render(
      <TransactionsFilterBar
        route={route()}
        accounts={accounts}
        categoryFilterOptions={[]}
        todayIso={TODAY_ISO}
      />,
    );

    const from = screen.getByLabelText(t.period.from);
    expect(from.getAttribute("required")).not.toBeNull();
  });
});
