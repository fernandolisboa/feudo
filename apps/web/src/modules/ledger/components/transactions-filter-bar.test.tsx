// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { TransactionsFilterBar } from "./transactions-filter-bar";

const accounts = [{ id: "acc-1", name: "Conta corrente", institutionName: "Banco Fixture" }];

afterEach(() => {
  cleanup();
});

describe("TransactionsFilterBar", () => {
  it("carries the month and the active filters as hidden inputs on the search form", () => {
    const { container } = render(
      <TransactionsFilterBar
        month="2026-09"
        accounts={accounts}
        selectedAccountId="acc-1"
        uncategorizedOnly={false}
        selectedCategory="housing"
        categoryFilterOptions={[{ id: "housing", label: t.categories.housing }]}
        selectedKind="fixed"
        searchQuery="condominio"
      />,
    );

    const form = container.querySelector("form");
    expect(form?.getAttribute("action")).toBe("/transacoes");
    expect(form?.querySelector('input[name="mes"]')?.getAttribute("value")).toBe("2026-09");
    expect(form?.querySelector('input[name="conta"]')?.getAttribute("value")).toBe("acc-1");
    expect(form?.querySelector('input[name="categoria"]')?.getAttribute("value")).toBe("housing");
    expect(form?.querySelector('input[name="tipo"]')?.getAttribute("value")).toBe("fixed");
    expect(screen.getByLabelText(t.search.label).getAttribute("value")).toBe("condominio");
  });

  it("shows no clear-filters link when nothing is filtered", () => {
    render(
      <TransactionsFilterBar
        month="2026-09"
        accounts={accounts}
        selectedAccountId={null}
        uncategorizedOnly={false}
        selectedCategory={null}
        categoryFilterOptions={[]}
        selectedKind={null}
        searchQuery={null}
      />,
    );

    expect(screen.queryByRole("link", { name: t.filters.clear })).toBeNull();
  });

  it("shows a clear-filters link once any filter is active", () => {
    render(
      <TransactionsFilterBar
        month="2026-09"
        accounts={accounts}
        selectedAccountId={null}
        uncategorizedOnly={false}
        selectedCategory={null}
        categoryFilterOptions={[]}
        selectedKind={null}
        searchQuery="mercado"
      />,
    );

    const link = screen.getByRole("link", { name: t.filters.clear });
    expect(link.getAttribute("href")).toBe("/transacoes?mes=2026-09");
  });
});
