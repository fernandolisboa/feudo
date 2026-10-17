// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CategoryFilterOption } from "../page-props";
import { t } from "../strings";
import { transactionsRouteFixture as route } from "../test/transactions-route";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { CategoryFilterSelect } from "./category-filter-select";

const options: CategoryFilterOption[] = [
  { id: "housing", label: t.categories.housing },
  { id: "food", label: t.categories.food },
];

afterEach(() => {
  cleanup();
});

describe("CategoryFilterSelect", () => {
  it("shows the all-categories label when no category filter is active", () => {
    render(<CategoryFilterSelect route={route()} options={options} />);

    expect(within(screen.getByRole("combobox")).queryByText(t.categoryFilter.all)).not.toBeNull();
  });

  it("shows the uncategorized label when categoria=sem is active", () => {
    render(<CategoryFilterSelect route={route({ uncategorizedOnly: true })} options={options} />);

    expect(
      within(screen.getByRole("combobox")).queryByText(t.categoryFilter.uncategorized),
    ).not.toBeNull();
  });

  it("shows the selected top-level category's label", () => {
    render(<CategoryFilterSelect route={route({ category: "food" })} options={options} />);

    expect(within(screen.getByRole("combobox")).queryByText(t.categories.food)).not.toBeNull();
  });
});
