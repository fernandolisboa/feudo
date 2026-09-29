// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { KindFilterSelect } from "./kind-filter-select";

afterEach(() => {
  cleanup();
});

describe("KindFilterSelect", () => {
  it("shows the all-kinds label when no kind filter is active", () => {
    render(
      <KindFilterSelect
        month="2026-09"
        accountId={null}
        uncategorizedOnly={false}
        category={null}
        kind={null}
        search={null}
      />,
    );

    expect(within(screen.getByRole("combobox")).queryByText(t.kindFilter.all)).not.toBeNull();
  });

  it("shows the selected kind's label", () => {
    render(
      <KindFilterSelect
        month="2026-09"
        accountId={null}
        uncategorizedOnly={false}
        category={null}
        kind="income"
        search={null}
      />,
    );

    expect(within(screen.getByRole("combobox")).queryByText(t.kinds.income)).not.toBeNull();
  });
});
