// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
    range: null,
    periodLabel: null,
    todayIso: "2026-10-17",
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
    pageCount: 1,
    hasMore: false,
    ...overrides,
  };
}

describe("TransactionsView", () => {
  it("leads the uncategorized notice to guided categorization, whatever filters are active", () => {
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
    const link = within(notice).getByRole("link", { name: "Categorizar uma a uma" });
    expect(link.getAttribute("href")).toBe("/categorizar");
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

  it("uses the 'found' headline, not the uncategorized one, when uncategorizedOnly is combined with a kind or search filter", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          uncategorizedOnly: true,
          selectedKind: "income",
          total: 0,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nenhuma transação encontrada em setembro de 2026" }),
    ).not.toBeNull();
  });

  it("keeps the uncategorized headline when uncategorizedOnly is the only active filter, even with a zero total", () => {
    render(
      <TransactionsView
        {...buildProps({ accounts: oneAccount, uncategorizedOnly: true, total: 0 })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tudo categorizado em setembro de 2026" }),
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

  it("shows the 'no matches' empty state, not the uncategorized silence, when uncategorizedOnly is combined with a kind filter", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          uncategorizedOnly: true,
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
  it("offers the listed transactions as a spreadsheet, with the screen's filters, in Excel and CSV", async () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          selectedAccountId: "acc-1",
          selectedKind: "fixed",
          searchQuery: "aluguel",
          total: 12,
          page: 2,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Exportar 12 transações" }));

    const excel = await screen.findByRole("menuitem", { name: "Planilha do Excel (.xlsx)" });
    const csv = screen.getByRole("menuitem", { name: "Arquivo CSV (.csv)" });
    expect(excel.getAttribute("href")).toBe(
      "/api/transactions/spreadsheet?mes=2026-09&conta=acc-1&tipo=fixed&busca=aluguel&formato=xlsx",
    );
    expect(csv.getAttribute("href")).toBe(
      "/api/transactions/spreadsheet?mes=2026-09&conta=acc-1&tipo=fixed&busca=aluguel&formato=csv",
    );
    expect(excel.hasAttribute("download")).toBe(false);
  });

  it("offers no spreadsheet when nothing is listed", () => {
    render(<TransactionsView {...buildProps({ accounts: oneAccount, total: 0 })} />);

    expect(screen.queryByRole("button", { name: /Exportar/ })).toBeNull();
  });

  it("shows the range headline and replaces the month switcher with the period label and a Ver por mês link, once a range is active", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          range: { from: "2026-07-06", to: "2026-10-17" },
          periodLabel: "06/07/2026 a 17/10/2026",
          total: 3,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "3 transações de 06/07/2026 a 17/10/2026" }),
    ).not.toBeNull();
    expect(screen.getByText("06/07/2026 a 17/10/2026")).not.toBeNull();
    expect(screen.queryByRole("link", { name: t.monthSwitcher.previous })).toBeNull();
    const backToMonth = screen.getByRole("link", { name: t.period.viewByMonth });
    expect(backToMonth.getAttribute("href")).toBe("/transacoes?mes=2026-09");
  });

  it("shows the range empty state when nothing matches", () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          range: { from: "2026-07-06", to: "2026-10-17" },
          periodLabel: "06/07/2026 a 17/10/2026",
          total: 0,
        })}
      />,
    );

    expect(screen.getByText("Nada registrado de 06/07/2026 a 17/10/2026.")).not.toBeNull();
  });

  it("carries the active range, not the month, through pagination and the spreadsheet links", async () => {
    render(
      <TransactionsView
        {...buildProps({
          accounts: oneAccount,
          range: { from: "2026-07-06", to: "2026-10-17" },
          periodLabel: "06/07/2026 a 17/10/2026",
          total: 60,
          pageCount: 2,
          hasMore: true,
          transactions: [
            {
              id: "tx-1",
              date: "2026-09-15",
              description: "COMPRA NO MERCADO",
              amountCentavos: -5000,
              currency: "BRL",
              accountName: "Conta corrente",
              institutionName: "Banco Fixture",
              category: null,
              categorize: {
                id: "tx-1",
                description: "COMPRA NO MERCADO",
                amountLabel: "R$ 50,00",
                type: "debit",
                subcategoryValue: null,
                isManual: false,
                isInternalTransfer: false,
                hasTransferMark: false,
                suggestedPattern: "COMPRA NO MERCADO",
              },
            },
          ],
        })}
      />,
    );

    const older = screen.getByRole("link", { name: t.pagination.older });
    expect(older.getAttribute("href")).toBe("/transacoes?de=2026-07-06&ate=2026-10-17&pagina=2");
    expect(screen.getByText("Página 1 de 2 · 60 transações")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Exportar 60 transações" }));
    const excel = await screen.findByRole("menuitem", { name: "Planilha do Excel (.xlsx)" });
    expect(excel.getAttribute("href")).toBe(
      "/api/transactions/spreadsheet?de=2026-07-06&ate=2026-10-17&formato=xlsx",
    );
  });
});
