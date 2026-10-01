// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../actions", () => ({
  addSubcategoryAction: vi.fn(),
  categorizeTransactionAction: vi.fn(),
  changeSubcategoryKindAction: vi.fn(),
  clearTransferMarkAction: vi.fn(),
  removeRuleAction: vi.fn(),
  resetTransactionCategoryAction: vi.fn(),
  setTransferMarkAction: vi.fn(),
}));

import { TOURS } from "@/modules/shell";

import type { TransactionsPageProps } from "../page-props";
import { CategoriesView } from "./categories-view";
import { TransactionsView } from "./transactions-view";

afterEach(() => {
  cleanup();
});

function expectEveryTarget(container: HTMLElement, targets: string[]): void {
  for (const target of targets) {
    expect(container.querySelector(`[data-tour="${target}"]`), target).not.toBeNull();
  }
}

const transactionsProps: TransactionsPageProps = {
  month: "2026-09",
  monthLabel: "setembro de 2026",
  previousMonth: "2026-08",
  nextMonth: null,
  accounts: [{ id: "acc-1", name: "Conta corrente", institutionName: "Banco Fixture" }],
  selectedAccountId: null,
  uncategorizedOnly: false,
  selectedCategory: null,
  categoryFilterOptions: [],
  selectedKind: null,
  searchQuery: null,
  monthHasTransactions: true,
  uncategorized: { count: 0, amountLabel: "R$ 0,00" },
  totals: { incomeLabel: "R$ 0,00", spendingLabel: "R$ 50,00", transferCount: 0 },
  categoryGroups: [],
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
  total: 1,
  page: 1,
  hasMore: false,
};

describe("guided tour targets", () => {
  it("renders every target of the transactions tour on a month with transactions", () => {
    const { container } = render(<TransactionsView {...transactionsProps} />);

    expectEveryTarget(
      container,
      TOURS.transactions.steps.map((step) => step.target),
    );
  });

  it("renders every target of the categories tour, even before the household has rules", () => {
    const { container } = render(
      <CategoriesView
        rules={[]}
        suggestions={[]}
        categories={[
          {
            categoryId: "food",
            label: "Alimentação",
            subcategories: [
              {
                value: "product:food.groceries",
                ref: { type: "product", id: "food.groceries" },
                label: "Mercado",
                kind: "variable",
                defaultKind: "variable",
              },
            ],
          },
        ]}
      />,
    );

    expectEveryTarget(
      container,
      TOURS.categories.steps.map((step) => step.target),
    );
  });
});
