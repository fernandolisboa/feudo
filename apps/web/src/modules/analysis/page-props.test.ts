import { describe, expect, it } from "vitest";

import { readingView } from "./page-props";
import type { StoredAnalysis } from "./repository";
import { FIXTURE_INPUT, FIXTURE_OUTPUT } from "./test/fixtures";

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
    expect(view?.paragraphs).toHaveLength(2);
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
