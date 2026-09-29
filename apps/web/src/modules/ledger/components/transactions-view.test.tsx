// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { TransactionsPageProps } from "../page-props";
import { t } from "../strings";
import { TransactionsView } from "./transactions-view";

const oneAccount = [{ id: "acc-1", name: "Conta corrente", institutionName: "Banco Fixture" }];

afterEach(() => {
  cleanup();
});

function buildProps(overrides: Partial<TransactionsPageProps> = {}): TransactionsPageProps {
  return {
    month: "2026-09",
    monthLabel: "setembro de 2026",
    previousMonth: "2026-08",
    nextMonth: null,
    accounts: [],
    selectedAccountId: null,
    uncategorizedOnly: false,
    selectedCategory: null,
    categoryFilterOptions: [],
    selectedKind: null,
    searchQuery: null,
    monthHasTransactions: true,
    uncategorized: { count: 0, amountLabel: "R$ 0,00" },
    totals: { incomeLabel: "R$ 0,00", spendingLabel: "R$ 0,00", transferCount: 0 },
    categoryGroups: [],
    transactions: [],
    total: 0,
    page: 1,
    hasMore: false,
    ...overrides,
  };
}

describe("TransactionsView", () => {
  it("shows the uncategorized notice with a link to the uncategorized filter when there are uncategorized rows", () => {
    render(
      <TransactionsView
        {...buildProps({ uncategorized: { count: 2, amountLabel: "R$ 150,00" } })}
      />,
    );

    const notice = screen.getByRole("status");
    const link = within(notice).getByRole("link");
    expect(link.getAttribute("href")).toContain("categoria=sem");
  });

  it("drops any active category, kind or search filter from the uncategorized notice's link, since its count is month-wide", () => {
    render(
      <TransactionsView
        {...buildProps({
          uncategorized: { count: 2, amountLabel: "R$ 150,00" },
          selectedAccountId: "acc-1",
          selectedKind: "income",
          searchQuery: "mercado",
        })}
      />,
    );

    const notice = screen.getByRole("status");
    const link = within(notice).getByRole("link");
    expect(link.getAttribute("href")).toBe("/transacoes?mes=2026-09&conta=acc-1&categoria=sem");
  });

  it("does not show the notice when there are no uncategorized rows", () => {
    render(
      <TransactionsView {...buildProps({ uncategorized: { count: 0, amountLabel: "R$ 0,00" } })} />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not show the notice when already filtered to uncategorized rows, even if the count is positive", () => {
    render(
      <TransactionsView
        {...buildProps({
          uncategorized: { count: 2, amountLabel: "R$ 150,00" },
          uncategorizedOnly: true,
        })}
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows income and spending but hides the transfers clause when there are none", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          totals: { incomeLabel: "R$ 8.500,00", spendingLabel: "R$ 1.192,80", transferCount: 0 },
        })}
      />,
    );

    expect(screen.getByText("Renda R$ 8.500,00 · Gastos R$ 1.192,80")).not.toBeNull();
  });

  it("adds a singular transfers clause when exactly one transfer transaction stayed out of the totals", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          totals: { incomeLabel: "R$ 8.500,00", spendingLabel: "R$ 1.192,80", transferCount: 1 },
        })}
      />,
    );

    expect(
      screen.getByText(`Renda R$ 8.500,00 · Gastos R$ 1.192,80 · ${t.totals.transfersOne}`),
    ).not.toBeNull();
  });

  it("pluralizes the transfers clause for more than one transfer transaction", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          totals: { incomeLabel: "R$ 8.500,00", spendingLabel: "R$ 1.192,80", transferCount: 2 },
        })}
      />,
    );

    expect(
      screen.getByText(
        "Renda R$ 8.500,00 · Gastos R$ 1.192,80 · 2 transações de transferência ficaram fora dos totais",
      ),
    ).not.toBeNull();
  });

  it("shows no totals line when the household has no connected account", () => {
    render(<TransactionsView {...buildProps({ accounts: [] })} />);

    expect(screen.queryByText(/^Renda/)).toBeNull();
  });

  it("uses the 'found' headline once a category, kind or search filter is active", () => {
    render(
      <TransactionsView
        {...buildProps({ accounts: oneAccount, selectedKind: "income", total: 1 })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "1 transação encontrada em setembro de 2026" }),
    ).not.toBeNull();
  });

  it("keeps the plain headline when only the account filter is active", () => {
    render(
      <TransactionsView {...buildProps({ accounts: oneAccount, selectedAccountId: "acc-1" })} />,
    );

    expect(
      screen.getByRole("heading", { name: "Nenhuma transação em setembro de 2026" }),
    ).not.toBeNull();
  });

  it("shows the 'no matches' empty state, with the filter bar's own clear-filters link, when a category/kind/search filter empties an otherwise non-empty month", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          selectedKind: "income",
          monthHasTransactions: true,
          transactions: [],
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByText("Nenhuma transação de setembro de 2026 com esses filtros."),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: t.filters.clear })).not.toBeNull();
  });

  it("shows nothing under the headline when the uncategorized-only filter alone empties an otherwise non-empty month", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          uncategorizedOnly: true,
          monthHasTransactions: true,
          transactions: [],
          total: 0,
        })}
      />,
    );

    expect(screen.queryByText("Nada registrado em setembro de 2026.")).toBeNull();
    expect(
      screen.queryByText("Nenhuma transação de setembro de 2026 com esses filtros."),
    ).toBeNull();
  });

  it("shows the plain 'nothing recorded' empty state when the month itself has no transactions, even with a filter set", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          selectedKind: "income",
          monthHasTransactions: false,
          transactions: [],
          total: 0,
        })}
      />,
    );

    expect(screen.getByText("Nada registrado em setembro de 2026.")).not.toBeNull();
  });
});
