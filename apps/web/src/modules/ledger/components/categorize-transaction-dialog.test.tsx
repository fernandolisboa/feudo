// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { interpolate } from "@/lib/interpolate";

import { t } from "../strings";

vi.mock("../actions", () => ({
  categorizeTransactionAction: vi.fn(),
  resetTransactionCategoryAction: vi.fn(),
  setTransferMarkAction: vi.fn(),
  clearTransferMarkAction: vi.fn(),
}));

import {
  CategorizeTransactionDialog,
  type CategorizableRow,
  type SubcategoryOptionGroup,
} from "./categorize-transaction-dialog";

afterEach(() => {
  cleanup();
});

const transaction: CategorizableRow = {
  id: "tx-1",
  description: "PIX ENVIADO CONDOMINIO",
  amountLabel: "R$ 100,00",
  type: "debit",
  subcategoryValue: null,
  isManual: false,
  isInternalTransfer: false,
  hasTransferMark: false,
  suggestedPattern: "PIX ENVIADO CONDOMINIO",
};

const groups: SubcategoryOptionGroup[] = [
  { label: "Moradia", options: [{ value: "product:housing.condo", label: "Condomínio" }] },
  { label: "Alimentação", options: [{ value: "product:food.groceries", label: "Mercado" }] },
];

function openDialog() {
  fireEvent.click(
    screen.getByRole("button", {
      name: interpolate(t.categorize.actionFor, "{description}", transaction.description),
    }),
  );
}

describe("CategorizeTransactionDialog", () => {
  it("opens and shows the subcategory options grouped by category", async () => {
    render(<CategorizeTransactionDialog transaction={transaction} groups={groups} />);

    openDialog();
    expect(await screen.findByRole("dialog")).not.toBeNull();

    fireEvent.click(screen.getByRole("combobox", { name: t.categorize.label }));

    expect(await screen.findByText("Moradia")).not.toBeNull();
    expect(screen.getByText("Condomínio")).not.toBeNull();
    expect(screen.getByText("Alimentação")).not.toBeNull();
    expect(screen.getByText("Mercado")).not.toBeNull();
  });

  it("reveals the pattern input prefilled with the suggested pattern once 'criar regra' is checked", async () => {
    render(<CategorizeTransactionDialog transaction={transaction} groups={groups} />);

    openDialog();
    await screen.findByRole("dialog");

    expect(screen.queryByLabelText(t.categorize.patternLabel)).toBeNull();

    fireEvent.click(screen.getByRole("checkbox"));

    const patternInput = await screen.findByLabelText<HTMLInputElement>(t.categorize.patternLabel);
    expect(patternInput.value).toBe(transaction.suggestedPattern);
  });

  it("offers to mark a transaction that is not an internal transfer as one, with no automatic-detection link", async () => {
    render(<CategorizeTransactionDialog transaction={transaction} groups={groups} />);
    openDialog();

    expect(await screen.findByRole("button", { name: t.categorize.transfer.mark })).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.categorize.transfer.unmark })).toBeNull();
    expect(
      screen.queryByRole("button", { name: t.categorize.transfer.backToAutomatic }),
    ).toBeNull();
  });

  it("offers to unmark an internal transfer and to go back to automatic detection once it carries a mark", async () => {
    render(
      <CategorizeTransactionDialog
        transaction={{ ...transaction, isInternalTransfer: true, hasTransferMark: true }}
        groups={groups}
      />,
    );
    openDialog();

    expect(
      await screen.findByRole("button", { name: t.categorize.transfer.unmark }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.categorize.transfer.mark })).toBeNull();
    expect(
      screen.getByRole("button", { name: t.categorize.transfer.backToAutomatic }),
    ).not.toBeNull();
  });

  it("offers to unmark a detected pair even without a mark of its own, but not the automatic-detection link", async () => {
    render(
      <CategorizeTransactionDialog
        transaction={{ ...transaction, isInternalTransfer: true, hasTransferMark: false }}
        groups={groups}
      />,
    );
    openDialog();

    expect(
      await screen.findByRole("button", { name: t.categorize.transfer.unmark }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: t.categorize.transfer.backToAutomatic }),
    ).toBeNull();
  });
});
