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
      { criterion: "fees", label: "Tarifas", help: "", weight: 5, levelLabel: "Muito alto" },
      { criterion: "lockIn", label: "Aprisionamento", help: "", weight: 4, levelLabel: "Alto" },
    ],
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
    candidates: [
      {
        institutionId: "nubank",
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
    ...overrides,
  };
}

describe("banksAnalysisFacts", () => {
  it("quotes the Bancos page's weights, scores, pros and cons", () => {
    expect(banksAnalysisFacts(props())).toEqual([
      {
        key: "banks.weights",
        label: "Pesos dos critérios da casa (0 a 5)",
        value: "Tarifas 5; Aprisionamento 4",
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
});
