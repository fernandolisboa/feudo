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
        share: 25,
        isRequired: false,
        minimumScore: 60,
        minimumScoreHint: null,
      },
      {
        criterion: "lockIn",
        label: "Aprisionamento",
        help: "",
        level: 4,
        levelLabel: "Alto",
        share: 20,
        isRequired: false,
        minimumScore: 60,
        minimumScoreHint: null,
      },
      {
        criterion: "jointBanking",
        label: "Dinheiro a dois",
        help: "",
        level: "essential",
        levelLabel: "Essencial",
        share: 50,
        isRequired: false,
        minimumScore: 100,
        minimumScoreHint: "100: só conta conjunta · 65: aceita conta compartilhada",
      },
    ],
    options: { candidateCount: 3, proConMinDifference: 10 },
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
        value:
          "Tarifas Muito alto (25%); Aprisionamento Alto (20%); Dinheiro a dois Essencial (50%)",
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

  it("lists a required criterion's minimum score", () => {
    const facts = banksAnalysisFacts(
      props({
        weights: [
          {
            criterion: "jointBanking",
            label: "Dinheiro a dois",
            help: "",
            level: "required",
            levelLabel: "Obrigatório",
            share: 50,
            isRequired: true,
            minimumScore: 100,
            minimumScoreHint: "100: só conta conjunta · 65: aceita conta compartilhada",
          },
        ],
      }),
    );

    expect(facts.find((fact) => fact.key === "banks.required_minimums")).toEqual({
      key: "banks.required_minimums",
      label: "Notas mínimas obrigatórias",
      value: "Dinheiro a dois precisa de pelo menos 100",
    });
  });

  it("lists the banks that miss a required criterion, when any does", () => {
    const facts = banksAnalysisFacts(
      props({
        reviewed: [
          {
            institutionId: "nubank",
            href: "/bancos/nubank",
            positionLabel: "4º",
            name: "Nubank",
            tag: null,
            unmetLabel: "não atende: Dinheiro a dois",
            overriddenLabel: null,
            scoreLabel: "77",
            review: { label: "", stale: false },
          },
        ],
      }),
    );

    expect(facts.find((fact) => fact.key === "banks.unmet_requirements")).toEqual({
      key: "banks.unmet_requirements",
      label: "Bancos que não atendem a um critério obrigatório",
      value: "Nubank (não atende: Dinheiro a dois)",
    });
  });

  it("tells the analyst which scores the household corrected itself, without the household's note", () => {
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
            overriddenLabel: "corrigido pela casa: Dinheiro a dois",
            scoreLabel: "90",
            review: { label: "", stale: false },
          },
        ],
      }),
    );

    expect(facts.find((fact) => fact.key === "banks.household_corrections")).toEqual({
      key: "banks.household_corrections",
      label: "Notas corrigidas pela própria casa (não são do Feudo)",
      value: "Nubank (corrigido pela casa: Dinheiro a dois)",
    });
    expect(banksAnalysisFacts(props()).map((fact) => fact.key)).not.toContain(
      "banks.household_corrections",
    );
  });

  it("omits the required-minimums and unmet-requirements facts when nothing is required", () => {
    const keys = banksAnalysisFacts(props()).map((fact) => fact.key);

    expect(keys).not.toContain("banks.required_minimums");
    expect(keys).not.toContain("banks.unmet_requirements");
  });
});
