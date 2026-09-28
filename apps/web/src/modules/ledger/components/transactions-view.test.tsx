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

  it("adds a singular transfers clause when exactly one internal transfer stayed out of the totals", () => {
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

  it("pluralizes the transfers clause for more than one internal transfer", () => {
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
        "Renda R$ 8.500,00 · Gastos R$ 1.192,80 · 2 transferências internas fora dos totais",
      ),
    ).not.toBeNull();
  });

  it("shows no totals line when the household has no connected account", () => {
    render(<TransactionsView {...buildProps({ accounts: [] })} />);

    expect(screen.queryByText(/^Renda/)).toBeNull();
  });
});
