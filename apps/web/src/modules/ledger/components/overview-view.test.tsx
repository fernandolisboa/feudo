// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import type { OverviewPageProps } from "../overview-page-props";
import { t } from "../strings";
import { OverviewHeader, OverviewSummary } from "./overview-view";

function Overview(props: OverviewPageProps) {
  return (
    <>
      <OverviewHeader {...props} />
      <OverviewSummary {...props} />
    </>
  );
}

function buildProps(overrides: Partial<OverviewPageProps> = {}): OverviewPageProps {
  return {
    month: "2026-09",
    monthLabel: "setembro de 2026",
    previousMonth: "2026-08",
    nextMonth: null,
    latestMonth: "2026-09",
    hasAccounts: true,
    inProgress: false,
    incomeCentavos: 850000,
    spendingCentavos: 119280,
    savingsRateBasisPoints: 8597,
    uncategorized: { count: 0, amountLabel: "R$ 0,00" },
    hasOtherCurrencyRows: false,
    tiles: {
      income: { label: t.overview.tiles.income, value: "R$ 8.500,00", meta: null },
      spending: {
        label: t.overview.tiles.spending,
        value: "R$ 1.192,80",
        meta: "Fixos R$ 980,50 · Variáveis R$ 212,30",
      },
      savingsRate: { label: t.overview.tiles.savingsRate, value: "86%", meta: null },
      averageFixedCost: {
        label: t.overview.tiles.averageFixedCost,
        value: "R$ 980,50",
        meta: "média de 3 meses",
      },
    },
    categorySpending: [
      { key: "housing", label: "Moradia", amountLabel: "R$ 980,50", fraction: 1 },
      { key: "food", label: "Alimentação", amountLabel: "R$ 212,30", fraction: 0.22 },
    ],
    series: [
      {
        month: "2026-09",
        shortLabel: "set",
        monthLabel: "setembro de 2026",
        incomeCentavos: 850000,
        spendingCentavos: 119280,
        incomeAmountLabel: "R$ 8.500,00",
        spendingAmountLabel: "R$ 1.192,80",
        incomeCompactLabel: "8,5 mil",
        spendingCompactLabel: "1,2 mil",
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("OverviewHeader and OverviewSummary", () => {
  it("shows the empty state and no tiles when the household has no accounts", () => {
    render(<Overview {...buildProps({ hasAccounts: false })} />);

    expect(screen.getByText(t.overview.empty.noAccounts)).not.toBeNull();
    expect(screen.getByRole("link", { name: /conectar banco/i }).getAttribute("href")).toBe(
      "/conectar-banco",
    );
    expect(screen.queryByText(t.overview.tiles.income)).toBeNull();
  });

  it("states how much of the income the household kept, with a percentage tile", () => {
    render(<Overview {...buildProps()} />);

    expect(
      screen.getByRole("heading", {
        name: "A casa guardou 86% da renda em setembro de 2026.",
      }),
    ).not.toBeNull();
    expect(screen.getByText("86%")).not.toBeNull();
  });

  it("says the household spent more than it received when the savings rate is negative", () => {
    render(<Overview {...buildProps({ savingsRateBasisPoints: -500 })} />);

    expect(
      screen.getByRole("heading", {
        name: "A casa gastou mais do que recebeu em setembro de 2026.",
      }),
    ).not.toBeNull();
  });

  it("names the spending with no income when the household has none registered", () => {
    render(
      <Overview
        {...buildProps({
          savingsRateBasisPoints: null,
          incomeCentavos: 0,
          spendingCentavos: 119280,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "A casa gastou R$ 1.192,80 em setembro de 2026 sem nenhuma renda registrada.",
      }),
    ).not.toBeNull();
  });

  it("says nothing was registered when there is no income and no spending", () => {
    render(
      <Overview
        {...buildProps({ savingsRateBasisPoints: null, incomeCentavos: 0, spendingCentavos: 0 })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nada foi registrado em setembro de 2026." }),
    ).not.toBeNull();
  });

  it("names the negative income when income is negative and there is no spending", () => {
    render(
      <Overview
        {...buildProps({
          savingsRateBasisPoints: null,
          incomeCentavos: -50000,
          spendingCentavos: 0,
          tiles: {
            income: { label: t.overview.tiles.income, value: "-R$ 500,00", meta: null },
            spending: { label: t.overview.tiles.spending, value: "R$ 0,00", meta: null },
            savingsRate: {
              label: t.overview.tiles.savingsRate,
              value: "—",
              meta: t.overview.tiles.savingsRateNoIncome,
            },
            averageFixedCost: {
              label: t.overview.tiles.averageFixedCost,
              value: "—",
              meta: t.overview.tiles.averageFixedCostNoHistory,
            },
          },
        })}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "A renda da casa ficou negativa em setembro de 2026 (-R$ 500,00), sem gastos registrados.",
      }),
    ).not.toBeNull();
  });

  it("appends the in-progress suffix for the current month", () => {
    render(<Overview {...buildProps({ inProgress: true })} />);

    expect(
      screen.getByRole("heading", {
        name: "A casa guardou 86% da renda em setembro de 2026 até agora.",
      }),
    ).not.toBeNull();
  });

  it("leaves the uncategorized notice to the app-wide one", () => {
    render(<Overview {...buildProps({ uncategorized: { count: 2, amountLabel: "R$ 150,00" } })} />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a calm sentence instead of an empty bar list when nothing was categorized", () => {
    render(<Overview {...buildProps({ categorySpending: [] })} />);

    expect(screen.getByText(t.overview.categorySpending.empty)).not.toBeNull();
  });

  it("shows the other-currency notice when the month has rows in another currency", () => {
    render(<Overview {...buildProps({ hasOtherCurrencyRows: true })} />);

    expect(screen.getByText(t.overview.otherCurrencyNotice)).not.toBeNull();
  });

  it("does not show the other-currency notice when every row is in the household's currency", () => {
    render(<Overview {...buildProps({ hasOtherCurrencyRows: false })} />);

    expect(screen.queryByText(t.overview.otherCurrencyNotice)).toBeNull();
  });
});
