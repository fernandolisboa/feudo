// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { TransactionsPageProps } from "../page-props";
import { TransactionsView } from "./transactions-view";

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
});
