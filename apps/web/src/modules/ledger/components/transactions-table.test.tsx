// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({
  categorizeTransactionAction: vi.fn(),
  resetTransactionCategoryAction: vi.fn(),
}));

import { TransactionsTable, type TransactionRowView } from "./transactions-table";

afterEach(() => {
  cleanup();
});

function buildRow(overrides: Partial<TransactionRowView> = {}): TransactionRowView {
  return {
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
      suggestedPattern: "COMPRA NO MERCADO",
    },
    ...overrides,
  };
}

describe("TransactionsTable", () => {
  it("shows 'Sem categoria' for a row with no category", () => {
    render(<TransactionsTable transactions={[buildRow({ category: null })]} groups={[]} />);

    expect(screen.getByText(t.category.uncategorized)).not.toBeNull();
  });

  it("shows 'Subcategoria · Categoria' for a categorized row", () => {
    const row = buildRow({
      category: {
        label: t.subcategories["food.groceries"],
        categoryLabel: t.categories.food,
        sourceLabel: t.category.sources.provider,
      },
    });

    render(<TransactionsTable transactions={[row]} groups={[]} />);

    const cells = screen.getAllByRole("cell");
    const categoryCell = cells[2];
    if (!categoryCell) {
      throw new Error("category cell not found");
    }
    expect(categoryCell.textContent.replace(/\s+/g, " ").trim()).toBe(
      `${t.subcategories["food.groceries"]} · ${t.categories.food}`,
    );
  });
});
