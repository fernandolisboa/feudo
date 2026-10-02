import { describe, expect, it } from "vitest";

import { reserveAnalysisFacts } from "./analysis-facts";
import type { PlacementRowView, ReservePageProps, ReservePositionView } from "./page-props";

function rankedRow(overrides: Partial<PlacementRowView> = {}): PlacementRowView {
  return {
    accountId: "acc-1",
    placeLabel: "1º",
    name: "CDB LIQUIDEZ DIARIA 110% CDI",
    product: "cdb",
    institutionName: "Banco Inter",
    institutionLabel: "Banco Inter",
    realYieldLabel: "6,1% a.a.",
    netYieldLabel: "12,4% a.a. depois do IR",
    taxLabel: "17,5%",
    guaranteeLabel: "FGC: ainda cabem R$ 230.000,00",
    ...overrides,
  };
}

function position(tone: "suggest" | "warning" | null): ReservePositionView {
  return {
    accountId: crypto.randomUUID(),
    name: "Conta",
    institutionLabel: "Inter",
    balanceLabel: "R$ 1,00",
    liquidityLabel: "até D+1",
    liquidityUnknown: false,
    taxLabel: "—",
    realYieldLabel: "—",
    isReserve: false,
    advice: tone === null ? null : { label: "x", tone },
    edit: {
      isReserve: false,
      liquidity: "unknown",
      institutionChoice: "auto",
      asksLiquidity: false,
      asksInstitution: false,
      automaticInstitutionName: null,
    },
  };
}

function props(overrides: Partial<ReservePageProps> = {}): ReservePageProps {
  return {
    monthLabel: "outubro de 2026",
    multiple: 6,
    canManage: false,
    hasAccounts: true,
    hasHistory: true,
    headline: "Sua meta é R$ 36.600,00.",
    tiles: {
      target: { label: "Meta da reserva", value: "R$ 36.600,00", meta: "6 meses de custo fixo" },
      averageFixedCost: {
        label: "Custo fixo médio",
        value: "R$ 6.100,00",
        meta: "média de 6 meses",
      },
      currentReserve: {
        label: "Reserva atual",
        value: "R$ 17.100,00",
        meta: "2 contas na reserva",
      },
      coverage: { label: "Cobertura", value: "46,7%", meta: "2,8 meses de custo fixo" },
    },
    coverage: null,
    monthlyFixedCosts: [],
    notice: null,
    positions: [position("suggest"), position("warning"), position(null)],
    ranking: {
      top: [rankedRow()],
      alsoRanked: [
        rankedRow({
          accountId: "acc-2",
          placeLabel: "2º",
          product: "savings_account",
          institutionName: null,
          institutionLabel: "Conta da Maria",
        }),
      ],
      excluded: [{ accountId: "acc-3", name: "x", institutionLabel: "y", reasonsLabel: "z" }],
      indicatorsLabel: "Taxas ao ano: CDI 14,9% · Selic 15% · IPCA em 12 meses 5,1%",
    },
    institutionOptions: [],
    ...overrides,
  };
}

describe("reserveAnalysisFacts", () => {
  it("quotes the Reserva page's figures and ranking, never an account's own name", () => {
    const facts = reserveAnalysisFacts(props());

    expect(facts).toEqual([
      { key: "reserve.multiple", label: "Meses de reserva", value: "6 meses de custo fixo" },
      {
        key: "reserve.target",
        label: "Meta da reserva",
        value: "R$ 36.600,00 (6 meses de custo fixo)",
      },
      {
        key: "reserve.average_fixed_cost",
        label: "Custo fixo médio usado na meta",
        value: "R$ 6.100,00 (média de 6 meses)",
      },
      {
        key: "reserve.current",
        label: "Reserva atual",
        value: "R$ 17.100,00 (2 contas na reserva)",
      },
      {
        key: "reserve.coverage",
        label: "Cobertura da reserva",
        value: "46,7% (2,8 meses de custo fixo)",
      },
      {
        key: "reserve.suggested_positions",
        label: "Contas líquidas e protegidas que ainda não estão na reserva",
        value: "1",
      },
      {
        key: "reserve.positions_needing_attention",
        label: "Posições da reserva sem liquidez diária ou com liquidez desconhecida",
        value: "1",
      },
      {
        key: "reserve.ranking.1",
        label: "Ranking da reserva, 1º lugar",
        value:
          "CDB em Banco Inter; rendimento real 6,1% a.a.; 12,4% a.a. depois do IR; IR 17,5%; FGC: ainda cabem R$ 230.000,00",
      },
      {
        key: "reserve.ranking.2",
        label: "Ranking da reserva, 2º lugar",
        value:
          "Poupança em instituição não identificada; rendimento real 6,1% a.a.; 12,4% a.a. depois do IR; IR 17,5%; FGC: ainda cabem R$ 230.000,00",
      },
      { key: "reserve.excluded", label: "Contas avaliadas e fora do ranking", value: "1" },
      {
        key: "reserve.indicators",
        label: "Indicadores do Banco Central",
        value: "Taxas ao ano: CDI 14,9% · Selic 15% · IPCA em 12 meses 5,1%",
      },
    ]);
    expect(JSON.stringify(facts)).not.toContain("LIQUIDEZ DIARIA");
    expect(JSON.stringify(facts)).not.toContain("Maria");
  });

  it("says in words when the target is not computed yet and nothing is ranked", () => {
    const facts = reserveAnalysisFacts(
      props({
        tiles: null,
        positions: [],
        ranking: { top: [], alsoRanked: [], excluded: [], indicatorsLabel: "Indisponíveis" },
      }),
    );

    expect(facts.map((fact) => fact.key)).toEqual([
      "reserve.multiple",
      "reserve.target",
      "reserve.ranking",
      "reserve.indicators",
    ]);
    expect(facts[1]?.value).toBe("ainda sem cálculo: nenhum mês com gastos categorizados");
  });

  it("uses a tile's explanation when it has no value", () => {
    const base = props();
    const facts = reserveAnalysisFacts(
      props({
        tiles: base.tiles && {
          ...base.tiles,
          currentReserve: { label: "Reserva atual", value: "—", meta: "Aparece quando..." },
        },
      }),
    );

    expect(facts.find((fact) => fact.key === "reserve.current")?.value).toBe("Aparece quando...");
  });

  it("has nothing to say for a household without accounts", () => {
    expect(reserveAnalysisFacts(props({ hasAccounts: false }))).toEqual([]);
  });
});
