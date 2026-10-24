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
  it("summarizes the reading with its counter-argument, figures used, provenance and a link to Análises", () => {
    const view = readingView(stored({ promptVersion: "analyst-v2" }), "America/Sao_Paulo");

    const { inputsUsed, ...rest } = view ?? { inputsUsed: [] };
    expect(rest).toEqual({
      title: "Leitura mensal de setembro de 2026",
      summary: FIXTURE_OUTPUT.summary,
      counterArgument: FIXTURE_OUTPUT.counterArgument,
      meta: ["gerada em 01/10/2026, 08:12", "Opus 5.5"],
      href: "/analises?leitura=a-1",
    });
    expect(inputsUsed).toHaveLength(FIXTURE_OUTPUT.citedKeys.length);
    expect(inputsUsed[0]).toEqual({
      key: "ledger.income",
      label: "Renda em setembro de 2026",
      value: "R$ 12.400,00",
    });
  });

  it("lists each cited figure once and drops a citation with no matching fact", () => {
    const view = readingView(
      stored({
        output: {
          ...FIXTURE_OUTPUT,
          citedKeys: ["ledger.income", "ledger.income", "ledger.unknown"],
        },
      }),
      "America/Sao_Paulo",
    );

    expect(view?.inputsUsed.map((input) => input.key)).toEqual(["ledger.income"]);
  });

  it("renders a version this deploy has never pinned as Family X.Y", () => {
    const view = readingView(
      stored({ kind: "on_demand", model: "claude-opus-4-8", completedAt: null }),
      "America/Sao_Paulo",
    );

    expect(view?.title).toBe("Leitura pedida sobre setembro de 2026");
    expect(view?.meta).toEqual(["Opus 4.8"]);
  });

  it("renders a dated id (claude-<family>-X-Y-YYYYMMDD) as Family X.Y, dropping the date", () => {
    const view = readingView(
      stored({ kind: "on_demand", model: "claude-haiku-4-5-20251001", completedAt: null }),
      "America/Sao_Paulo",
    );

    expect(view?.meta).toEqual(["Haiku 4.5"]);
  });

  it("leaves a model id outside the claude-<family>-X-Y shape as it is", () => {
    const view = readingView(
      stored({ kind: "on_demand", model: "gpt-4-turbo", completedAt: null }),
      "America/Sao_Paulo",
    );

    expect(view?.meta).toEqual(["gpt-4-turbo"]);
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
    expect(view?.inputsUsed[0]).toEqual({
      key: "ledger.income",
      label: "Renda em setembro de 2026",
      value: "R$ 12.400,00",
    });
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
  it("stands its first paragraph in for the summary it does not have", () => {
    expect(readingView(stored({ output: V1_OUTPUT }), "America/Sao_Paulo")?.summary).toBe(
      "Em setembro de 2026 a casa recebeu R$ 12.400,00 e gastou R$ 9.850,35, guardando 20,6% da renda.",
    );
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
      meta: "gerada em 12/10/2026, 12:30 · Sonnet 5.5",
      href: `/analises?leitura=${row.id}`,
      current: false,
    });
  });

  it("marks the reading on screen", () => {
    expect(historyItem(row, "America/Sao_Paulo", row.id).current).toBe(true);
  });
});
