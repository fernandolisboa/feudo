import { describe, expect, it } from "vitest";

import { overviewAnalysisFacts } from "./analysis-facts";
import type { OverviewPageProps } from "./overview-page-props";

function props(overrides: Partial<OverviewPageProps> = {}): OverviewPageProps {
  return {
    month: "2026-09",
    monthLabel: "setembro de 2026",
    previousMonth: "2026-08",
    nextMonth: "2026-10",
    hasAccounts: true,
    inProgress: false,
    incomeCentavos: 1_240_000,
    spendingCentavos: 985_035,
    savingsRateBasisPoints: 2056,
    uncategorized: { count: 4, amountLabel: "R$ 312,90" },
    hasOtherCurrencyRows: false,
    tiles: {
      income: { label: "Renda", value: "R$ 12.400,00", meta: null },
      spending: {
        label: "Gastos",
        value: "R$ 9.850,35",
        meta: "Fixos R$ 6.100,00 · Variáveis R$ 3.750,35",
      },
      savingsRate: { label: "Taxa de poupança", value: "20,6%", meta: null },
      averageFixedCost: {
        label: "Custo fixo médio",
        value: "R$ 6.050,00",
        meta: "média de 6 meses",
      },
    },
    categorySpending: [
      { key: "housing", label: "Moradia", amountLabel: "R$ 4.200,00", fraction: 1 },
    ],
    series: [
      {
        month: "2026-08",
        shortLabel: "ago",
        monthLabel: "agosto de 2026",
        incomeCentavos: 1_200_000,
        spendingCentavos: 1_010_000,
        incomeAmountLabel: "R$ 12.000,00",
        spendingAmountLabel: "R$ 10.100,00",
        incomeCompactLabel: "12 mil",
        spendingCompactLabel: "10,1 mil",
      },
      {
        month: "2026-09",
        shortLabel: "set",
        monthLabel: "setembro de 2026",
        incomeCentavos: 1_240_000,
        spendingCentavos: 985_035,
        incomeAmountLabel: "R$ 12.400,00",
        spendingAmountLabel: "R$ 9.850,35",
        incomeCompactLabel: "12,4 mil",
        spendingCompactLabel: "9,9 mil",
      },
    ],
    ...overrides,
  };
}

describe("overviewAnalysisFacts", () => {
  it("quotes the figures Visão geral shows for the month", () => {
    expect(overviewAnalysisFacts(props())).toEqual([
      { key: "ledger.month", label: "Mês analisado", value: "setembro de 2026" },
      { key: "ledger.income", label: "Renda em setembro de 2026", value: "R$ 12.400,00" },
      { key: "ledger.spending", label: "Gastos em setembro de 2026", value: "R$ 9.850,35" },
      {
        key: "ledger.spending_split",
        label: "Gastos fixos e variáveis em setembro de 2026",
        value: "Fixos R$ 6.100,00 · Variáveis R$ 3.750,35",
      },
      {
        key: "ledger.savings_rate",
        label: "Taxa de poupança em setembro de 2026",
        value: "20,6%",
      },
      {
        key: "ledger.average_fixed_cost",
        label: "Custo fixo médio",
        value: "R$ 6.050,00 (média de 6 meses)",
      },
      {
        key: "ledger.uncategorized",
        label: "Transações sem categoria em setembro de 2026",
        value: "4 transações, R$ 312,90, fora destes números",
      },
      {
        key: "ledger.category.housing",
        label: "Gastos com Moradia em setembro de 2026",
        value: "R$ 4.200,00",
      },
      {
        key: "ledger.series.2026_08.income",
        label: "Renda em agosto de 2026",
        value: "R$ 12.000,00",
      },
      {
        key: "ledger.series.2026_08.spending",
        label: "Gastos em agosto de 2026",
        value: "R$ 10.100,00",
      },
    ]);
  });

  it("has nothing to say for a household without accounts", () => {
    expect(overviewAnalysisFacts(props({ hasAccounts: false }))).toEqual([]);
  });

  it("explains a month without income, history or uncategorized rows in words", () => {
    const facts = overviewAnalysisFacts(
      props({
        savingsRateBasisPoints: null,
        uncategorized: { count: 0, amountLabel: "" },
        hasOtherCurrencyRows: true,
        inProgress: true,
        tiles: {
          ...props().tiles,
          savingsRate: {
            label: "Taxa de poupança",
            value: "—",
            meta: "Sem renda registrada neste mês.",
          },
          averageFixedCost: {
            label: "Custo fixo médio",
            value: "—",
            meta: "Ainda sem histórico de custo fixo.",
          },
        },
      }),
    );
    const byKey = new Map(facts.map((fact) => [fact.key, fact.value]));

    expect(byKey.get("ledger.month")).toBe("setembro de 2026 (em andamento)");
    expect(byKey.get("ledger.savings_rate")).toBe("Sem renda registrada neste mês.");
    expect(byKey.get("ledger.average_fixed_cost")).toBe("Ainda sem histórico de custo fixo.");
    expect(byKey.get("ledger.uncategorized")).toBe("nenhuma");
    expect(byKey.get("ledger.other_currency")).toBe("ficam fora destes números");
  });
});
