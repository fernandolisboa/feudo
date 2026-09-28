// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { MonthlyBarPointView } from "../overview-page-props";
import { MonthlyBars } from "./monthly-bars";

function point(overrides: Partial<MonthlyBarPointView>): MonthlyBarPointView {
  return {
    month: "2026-09",
    shortLabel: "set",
    monthLabel: "setembro de 2026",
    incomeCentavos: 850000,
    spendingCentavos: 119280,
    incomeAmountLabel: "R$ 8.500,00",
    spendingAmountLabel: "R$ 1.192,80",
    incomeCompactLabel: "8,5 mil",
    spendingCompactLabel: "1,2 mil",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("MonthlyBars", () => {
  it("names the series it summarizes in the chart's accessible name", () => {
    render(
      <MonthlyBars
        points={[
          point({ month: "2026-08", shortLabel: "ago", monthLabel: "agosto de 2026" }),
          point({ month: "2026-09", shortLabel: "set", monthLabel: "setembro de 2026" }),
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Renda e gastos de agosto de 2026 a setembro de 2026" }),
    ).not.toBeNull();
  });

  it("shows a direct compact value label only for the last month", () => {
    render(
      <MonthlyBars
        points={[
          point({
            month: "2026-08",
            shortLabel: "ago",
            monthLabel: "agosto de 2026",
            incomeCompactLabel: "7 mil",
            spendingCompactLabel: "900",
          }),
          point({
            month: "2026-09",
            shortLabel: "set",
            monthLabel: "setembro de 2026",
            incomeCompactLabel: "8,5 mil",
            spendingCompactLabel: "1,2 mil",
          }),
        ]}
      />,
    );

    expect(screen.getByText("8,5 mil")).not.toBeNull();
    expect(screen.getByText("1,2 mil")).not.toBeNull();
    expect(screen.queryByText("7 mil")).toBeNull();
    expect(screen.queryByText("900")).toBeNull();
  });

  it("carries every point's full amounts in a visually hidden table", () => {
    render(<MonthlyBars points={[point({ month: "2026-09", monthLabel: "setembro de 2026" })]} />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table.className).toContain("sr-only");
    expect(table.textContent).toContain("R$ 8.500,00");
    expect(table.textContent).toContain("R$ 1.192,80");
  });

  it("shows a short, undotted month label on the axis", () => {
    render(<MonthlyBars points={[point({ shortLabel: "ago" })]} />);

    expect(screen.getByText("ago")).not.toBeNull();
  });
});
