import { describe, expect, it } from "vitest";

import { analysisDetailView, historyItem, readingView } from "./page-props";
import type { StoredAnalysis } from "./repository";
import { FIXTURE_INPUT, FIXTURE_OUTPUT } from "./test/fixtures";

const V1_OUTPUT = {
  reading: FIXTURE_OUTPUT.reading,
  tradeOffs: FIXTURE_OUTPUT.tradeOffs,
  counterArgument: FIXTURE_OUTPUT.counterArgument,
  citedKeys: FIXTURE_OUTPUT.citedKeys,
};

function stored(overrides: Partial<StoredAnalysis> = {}): StoredAnalysis {
  return {
    id: "a-1",
    kind: "monthly",
    period: "2026-09",
    promptVersion: "analyst-v1",
    model: "claude-opus-5-5",
    input: FIXTURE_INPUT,
    output: FIXTURE_OUTPUT,
    completedAt: new Date("2026-10-01T11:12:00.000Z"),
    ...overrides,
  };
}

describe("readingView", () => {
  it("shows the reading with the figures it cited, its model and its prompt version", () => {
    const view = readingView(stored(), "America/Sao_Paulo");

    expect(view?.title).toBe("Leitura mensal de setembro de 2026");
    expect(view?.paragraphs).toEqual([
      "Em setembro de 2026 a casa recebeu R$ 12.400,00 e gastou R$ 9.850,35, guardando 20,6% da renda.",
      "A reserva cobre 46,7% da meta de R$ 36.600,00, o equivalente a 2,8 meses de custo fixo.",
      FIXTURE_OUTPUT.banks,
    ]);
    expect(view?.tradeOffs).toEqual(FIXTURE_OUTPUT.tradeOffs);
    expect(view?.counterArgument).toBe(FIXTURE_OUTPUT.counterArgument);
    expect(view?.inputsUsed[0]).toEqual({
      key: "ledger.income",
      label: "Renda em setembro de 2026",
      value: "R$ 12.400,00",
    });
    expect(view?.inputsUsed).toHaveLength(FIXTURE_OUTPUT.citedKeys.length);
    expect(view?.meta).toEqual([
      "gerada em 01/10/2026, 08:12",
      "Claude Opus 5.5",
      "prompt analyst-v1",
    ]);
  });

  it("names an on-demand reading and an unknown model as they are", () => {
    const view = readingView(
      stored({ kind: "on_demand", model: "claude-opus-4-8", completedAt: null }),
      "America/Sao_Paulo",
    );

    expect(view?.title).toBe("Leitura pedida sobre setembro de 2026");
    expect(view?.meta).toEqual(["claude-opus-4-8", "prompt analyst-v1"]);
  });

  it("lists a cited figure once even when the model cited it twice", () => {
    const view = readingView(
      stored({ output: { ...FIXTURE_OUTPUT, citedKeys: ["ledger.income", "ledger.income"] } }),
      "America/Sao_Paulo",
    );

    expect(view?.inputsUsed).toHaveLength(1);
  });

  it("hides a stored reading that no longer meets the contract", () => {
    expect(readingView(stored({ output: { reading: "" } }), "America/Sao_Paulo")).toBeNull();
    expect(readingView(stored({ input: {} }), "America/Sao_Paulo")).toBeNull();
  });
});

describe("analysisDetailView", () => {
  it("keeps the summary, the reading and the bank paragraph apart", () => {
    const view = analysisDetailView(stored({ promptVersion: "analyst-v2" }), "America/Sao_Paulo");

    expect(view?.id).toBe("a-1");
    expect(view?.summary).toBe(FIXTURE_OUTPUT.summary);
    expect(view?.reading).toHaveLength(2);
    expect(view?.banks).toEqual([FIXTURE_OUTPUT.banks]);
    expect(view?.inputsUsed).toHaveLength(FIXTURE_OUTPUT.citedKeys.length);
    expect(view?.meta).toContain("prompt analyst-v2");
  });

  it("shows an analyst-v1 reading whole, with no summary and no bank paragraph", () => {
    const view = analysisDetailView(stored({ output: V1_OUTPUT }), "America/Sao_Paulo");

    expect(view?.summary).toBeNull();
    expect(view?.reading).toHaveLength(2);
    expect(view?.banks).toEqual([]);
  });

  it("hides a stored reading that no longer meets the contract", () => {
    expect(analysisDetailView(stored({ output: { reading: "" } }), "America/Sao_Paulo")).toBeNull();
  });
});

describe("readingView with an analyst-v1 reading", () => {
  it("shows the paragraphs it has", () => {
    expect(
      readingView(stored({ output: V1_OUTPUT }), "America/Sao_Paulo")?.paragraphs,
    ).toHaveLength(2);
  });
});

describe("historyItem", () => {
  const row = {
    id: "0b7c9a52-4a8e-4d47-9a9f-3c1f1e2b7d10",
    kind: "on_demand" as const,
    period: "2026-09",
    model: "claude-sonnet-5-5",
    completedAt: new Date("2026-10-12T15:30:00.000Z"),
  };

  it("links to the reading on Análises and says when and by which model it was written", () => {
    expect(historyItem(row, "America/Sao_Paulo", null)).toEqual({
      id: row.id,
      title: "Leitura pedida sobre setembro de 2026",
      meta: "gerada em 12/10/2026, 12:30 · Claude Sonnet 5.5",
      href: `/analises?leitura=${row.id}`,
      current: false,
    });
  });

  it("marks the reading on screen", () => {
    expect(historyItem(row, "America/Sao_Paulo", row.id).current).toBe(true);
  });
});
