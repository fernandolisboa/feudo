// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { interpolate } from "@/lib/interpolate";

vi.mock("../actions", () => ({
  addSubcategoryAction: vi.fn(),
  changeSubcategoryKindAction: vi.fn(),
  removeRuleAction: vi.fn(),
}));

import type { RuleRow } from "../categories-page-props";
import { t } from "../strings";
import { CategoriesView } from "./categories-view";

afterEach(() => {
  cleanup();
});

function rule(overrides: Partial<RuleRow>): RuleRow {
  return {
    id: "rule-1",
    pattern: "PIX JOAO SILVA",
    amountLabel: null,
    appliesTo: t.categoriesPage.ruleTable.debit,
    target: "Moradia · Aluguel",
    ...overrides,
  };
}

describe("CategoriesView rules", () => {
  it("shows the amount a rule is bound to next to its text, and names it in the remove action", () => {
    render(
      <CategoriesView
        categories={[]}
        suggestions={[]}
        rules={[rule({ id: "bound", amountLabel: "R$ 1.500,00" }), rule({ id: "any" })]}
      />,
    );

    expect(screen.getByText("PIX JOAO SILVA · R$ 1.500,00")).toBeTruthy();
    expect(screen.getByText("PIX JOAO SILVA")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: interpolate(
          t.categoriesPage.removeRuleFor,
          "{pattern}",
          "PIX JOAO SILVA · R$ 1.500,00",
        ),
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: interpolate(t.categoriesPage.removeRuleFor, "{pattern}", "PIX JOAO SILVA"),
      }),
    ).toBeTruthy();
  });
});
