// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TransactionsRouteBase } from "../href";
import { t } from "../strings";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { KindFilterSelect } from "./kind-filter-select";

function route(overrides: Partial<TransactionsRouteBase> = {}): TransactionsRouteBase {
  return {
    month: "2026-09",
    range: null,
    accountId: null,
    uncategorizedOnly: false,
    category: null,
    kind: null,
    search: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("KindFilterSelect", () => {
  it("shows the all-kinds label when no kind filter is active", () => {
    render(<KindFilterSelect route={route()} />);

    expect(within(screen.getByRole("combobox")).queryByText(t.kindFilter.all)).not.toBeNull();
  });

  it("shows the selected kind's label", () => {
    render(<KindFilterSelect route={route({ kind: "income" })} />);

    expect(within(screen.getByRole("combobox")).queryByText(t.kinds.income)).not.toBeNull();
  });
});
