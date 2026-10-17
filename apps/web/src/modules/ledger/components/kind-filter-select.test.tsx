// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";
import { transactionsRouteFixture as route } from "../test/transactions-route";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { KindFilterSelect } from "./kind-filter-select";

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
