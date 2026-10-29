import { describe, expect, it } from "vitest";

import { banksAnalysisFacts } from "./analysis-facts";
import type { BanksPageProps } from "./page-props";
import { t } from "./strings";

function props(overrides: Partial<BanksPageProps> = {}): BanksPageProps {
  return {
    headline: "",
    canManage: false,
    weightsAreCustom: false,
    weights: [
      {
        criterion: "fees",
        label: "Tarifas",
        help: "",
        level: 5,
        levelLabel: "Muito alto",
        share: 55,
      },
      {
        criterion: "lockIn",
        label: "Aprisionamento",
        help: "",
        level: 4,
        levelLabel: "Alto",
        share: 45,
      },
    ],
    options: { candidateCount: 3, proConMinDifference: 10 },
    accountTypeFilter: {
      jointBanking: "optional",
      jointOnly: false,
      jointInvestment: "optional",
      mei: "optional",
    },
    accountTypeFilterSummary: "Mostrando todos os 13 bancos.",
    hasAccounts: true,
    currentRows: [
      {
        institutionId: "itau",
        name: "Itaú",
        scoreLabel: "60",
        review: { label: "", stale: false },
      },
    ],
    baselineNotice: null,
    unrecognizedNotice: "Não reconhecemos: Conta da Maria.",
    overridesNotice: null,
    candidates: [
      {
        institutionId: "nubank",
        href: "/bancos/nubank",
        rankLabel: "1º",
        name: "Nubank",
        score: 77,
        scoreLabel: "77",
        review: { label: "", stale: false },
        pros: ["Tarifas: 100 contra 40 (Itaú)"],
        cons: [],
        emptyPros: t.candidates.noPros,
        emptyCons: t.candidates.noCons,
        missingEvidence: "Evidência insuficiente em: Segurança.",
      },
      {
        institutionId: "c6",
        href: "/bancos/c6",
        rankLabel: "2º",
        name: "C6 Bank",
        score: null,
        scoreLabel: t.candidates.noScore,
        review: { label: "", stale: false },
        pros: [],
        cons: ["Aprisionamento: 40 contra 60 (Itaú)", "Tarifas: 30 contra 40 (Itaú)"],
        emptyPros: t.candidates.noPros,
        emptyCons: t.candidates.noCons,
        missingEvidence: null,
      },
    ],
    reviewed: [],
    ...overrides,
  };
}

describe("banksAnalysisFacts", () => {
  it("quotes the Bancos page's weight levels, shares, scores, pros and cons", () => {
    expect(banksAnalysisFacts(props())).toEqual([
      {
        key: "banks.weights",
        label: "Pesos dos critérios da casa",
        value: "Tarifas Muito alto (55%); Aprisionamento Alto (45%)",
      },
      {
        key: "banks.account_type_filter",
        label: "Filtro de tipos de conta",
        value: "Mostrando todos os 13 bancos.",
      },
      { key: "banks.current.1", label: "Banco que a casa usa: Itaú", value: "nota 60 de 100" },
      { key: "banks.candidate.1", label: "Banco candidato 1º: Nubank", value: "nota 77 de 100" },
      {
        key: "banks.candidate.1.pros",
        label: "A favor de Nubank",
        value: "Tarifas: 100 contra 40 (Itaú)",
      },
      { key: "banks.candidate.1.cons", label: "Contra Nubank", value: t.candidates.noCons },
      {
        key: "banks.candidate.1.missing_evidence",
        label: "Evidência insuficiente sobre Nubank",
        value: "Evidência insuficiente em: Segurança.",
      },
      {
        key: "banks.candidate.2",
        label: "Banco candidato 2º: C6 Bank",
        value: "evidência insuficiente",
      },
      { key: "banks.candidate.2.pros", label: "A favor de C6 Bank", value: t.candidates.noPros },
      {
        key: "banks.candidate.2.cons",
        label: "Contra C6 Bank",
        value: "Aprisionamento: 40 contra 60 (Itaú); Tarifas: 30 contra 40 (Itaú)",
      },
    ]);
  });

  it("keeps the connection labels a household typed out of the facts", () => {
    expect(JSON.stringify(banksAnalysisFacts(props()))).not.toContain("Maria");
  });

  it("states the comparison baseline when no bank of the household is recognised", () => {
    const facts = banksAnalysisFacts(
      props({ currentRows: [], baselineNotice: t.current.noneRecognized }),
    );

    expect(facts.find((fact) => fact.key === "banks.baseline")?.value).toBe(
      t.current.noneRecognized,
    );
  });

  it("states the account-type filter in plain words", () => {
    const facts = banksAnalysisFacts(
      props({ accountTypeFilterSummary: "Mostrando 9 de 13 bancos: os que têm conta MEI." }),
    );

    expect(facts.find((fact) => fact.key === "banks.account_type_filter")).toEqual({
      key: "banks.account_type_filter",
      label: "Filtro de tipos de conta",
      value: "Mostrando 9 de 13 bancos: os que têm conta MEI.",
    });
  });

  it("lists the banks that miss an account type the household marked as required, when any does", () => {
    const facts = banksAnalysisFacts(
      props({
        reviewed: [
          {
            institutionId: "nubank",
            href: "/bancos/nubank",
            positionLabel: "4º",
            name: "Nubank",
            tag: null,
            unmetLabel: "não tem: conta MEI",
            overriddenLabel: null,
            offeredTypesLine: null,
            score: 77,
            scoreLabel: "77",
            review: { label: "", stale: false },
          },
        ],
      }),
    );

    expect(facts.find((fact) => fact.key === "banks.unmet_requirements")).toEqual({
      key: "banks.unmet_requirements",
      label: "Bancos que não têm um tipo de conta marcado como obrigatório",
      value: "Nubank (não tem: conta MEI)",
    });
  });

  it("tells the analyst which data the household corrected itself, without the household's note", () => {
    const facts = banksAnalysisFacts(
      props({
        reviewed: [
          {
            institutionId: "nubank",
            href: "/bancos/nubank",
            positionLabel: "1º",
            name: "Nubank",
            tag: "candidato",
            unmetLabel: null,
            overriddenLabel: "corrigido pela casa: Tarifas, Conta MEI",
            offeredTypesLine: null,
            score: 90,
            scoreLabel: "90",
            review: { label: "", stale: false },
          },
        ],
      }),
    );

    expect(facts.find((fact) => fact.key === "banks.household_corrections")).toEqual({
      key: "banks.household_corrections",
      label: "Dados corrigidos pela própria casa (não são do Feudo)",
      value: "Nubank (corrigido pela casa: Tarifas, Conta MEI)",
    });
    expect(banksAnalysisFacts(props()).map((fact) => fact.key)).not.toContain(
      "banks.household_corrections",
    );
  });

  it("omits the unmet-requirements fact when nothing fails the filter", () => {
    const keys = banksAnalysisFacts(props()).map((fact) => fact.key);

    expect(keys).not.toContain("banks.unmet_requirements");
  });
});
