import { describe, expect, it } from "vitest";

import {
  ANALYSIS_KINDS,
  analysisFactSchema,
  analysisInputSchema,
  analysisOutputSchema,
} from "./contract";

const fixtureFacts = [
  { key: "reserve.target", label: "Meta da reserva", value: "R$ 36.000,00" },
  { key: "reserve.coverage", label: "Cobertura da reserva", value: "4,6 meses" },
  { key: "savings_rate", label: "Taxa de poupança", value: "13,9%" },
];

function fixtureInput(overrides: Record<string, unknown> = {}) {
  return {
    kind: "monthly",
    month: "2026-09",
    monthLabel: "setembro de 2026",
    facts: fixtureFacts,
    ...overrides,
  };
}

function fixtureOutput(overrides: Record<string, unknown> = {}) {
  return {
    reading: "A reserva está em 4,6 meses, abaixo da meta de R$ 36.000,00.",
    tradeOffs: ["Mais liquidez reduz o rendimento esperado."],
    counterArgument: "Uma meta maior imobiliza recursos que poderiam reduzir dívidas caras.",
    citedKeys: ["reserve.target", "reserve.coverage"],
    ...overrides,
  };
}

describe("analysisFactSchema", () => {
  it("accepts a realistic fact", () => {
    expect(() => analysisFactSchema.parse(fixtureFacts[0])).not.toThrow();
  });

  it("rejects a key with uppercase letters", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "Reserve.Target", label: "x", value: "y" }),
    ).toThrow();
  });

  it("rejects a key with a leading dot", () => {
    expect(() =>
      analysisFactSchema.parse({ key: ".reserve.target", label: "x", value: "y" }),
    ).toThrow();
  });

  it("rejects a key with a double dot", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "reserve..target", label: "x", value: "y" }),
    ).toThrow();
  });

  it("rejects a key over 80 characters", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "a".repeat(81), label: "x", value: "y" }),
    ).toThrow();
  });

  it("rejects a whitespace-only label", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "reserve.target", label: "   ", value: "y" }),
    ).toThrow();
  });

  it("rejects a whitespace-only value", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "reserve.target", label: "x", value: "   " }),
    ).toThrow();
  });

  it("rejects a value over 600 characters", () => {
    expect(() =>
      analysisFactSchema.parse({ key: "reserve.target", label: "x", value: "y".repeat(601) }),
    ).toThrow();
  });
});

describe("analysisInputSchema", () => {
  it("accepts a realistic fixture", () => {
    expect(() => analysisInputSchema.parse(fixtureInput())).not.toThrow();
  });

  it("exposes both analysis kinds", () => {
    expect(ANALYSIS_KINDS).toEqual(["monthly", "on_demand"]);
  });

  it("rejects an unknown kind", () => {
    expect(() => analysisInputSchema.parse(fixtureInput({ kind: "yearly" }))).toThrow();
  });

  it("rejects a malformed month", () => {
    expect(() => analysisInputSchema.parse(fixtureInput({ month: "2026-9" }))).toThrow();
  });

  it("rejects an out-of-range month", () => {
    expect(() => analysisInputSchema.parse(fixtureInput({ month: "2026-13" }))).toThrow();
  });

  it("rejects a whitespace-only month label", () => {
    expect(() => analysisInputSchema.parse(fixtureInput({ monthLabel: "   " }))).toThrow();
  });

  it("rejects empty facts", () => {
    expect(() => analysisInputSchema.parse(fixtureInput({ facts: [] }))).toThrow();
  });

  it("rejects more than 250 facts", () => {
    const facts = Array.from({ length: 251 }, (_, index) => ({
      key: `fact_${String(index)}`,
      label: "x",
      value: "y",
    }));
    expect(() => analysisInputSchema.parse(fixtureInput({ facts }))).toThrow();
  });

  it("rejects duplicate fact keys with a message naming the key", () => {
    const facts = [
      { key: "reserve.target", label: "Meta", value: "R$ 1,00" },
      { key: "reserve.target", label: "Meta repetida", value: "R$ 2,00" },
    ];
    expect(() => analysisInputSchema.parse(fixtureInput({ facts }))).toThrow(/reserve\.target/);
  });
});

describe("analysisOutputSchema", () => {
  it("accepts a realistic fixture", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput())).not.toThrow();
  });

  it("rejects a whitespace-only reading", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput({ reading: "   " }))).toThrow();
  });

  it("rejects a reading over 2400 characters", () => {
    expect(() =>
      analysisOutputSchema.parse(fixtureOutput({ reading: "a".repeat(2401) })),
    ).toThrow();
  });

  it("rejects an empty tradeOffs array", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput({ tradeOffs: [] }))).toThrow();
  });

  it("rejects more than four tradeOffs", () => {
    expect(() =>
      analysisOutputSchema.parse(fixtureOutput({ tradeOffs: ["a", "b", "c", "d", "e"] })),
    ).toThrow();
  });

  it("rejects a whitespace-only trade-off entry", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput({ tradeOffs: ["   "] }))).toThrow();
  });

  it("rejects a whitespace-only counterArgument", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput({ counterArgument: "   " }))).toThrow();
  });

  it("rejects an empty citedKeys array", () => {
    expect(() => analysisOutputSchema.parse(fixtureOutput({ citedKeys: [] }))).toThrow();
  });

  it("rejects more than 40 citedKeys", () => {
    const citedKeys = Array.from({ length: 41 }, (_, index) => `fact_${String(index)}`);
    expect(() => analysisOutputSchema.parse(fixtureOutput({ citedKeys }))).toThrow();
  });
});
