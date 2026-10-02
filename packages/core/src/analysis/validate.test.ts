import { describe, expect, it } from "vitest";

import { analysisInputSchema, analysisOutputSchema, type AnalysisInput } from "./contract";
import { describeViolations, findAnalysisViolations } from "./validate";

function input(overrides: Record<string, unknown> = {}): AnalysisInput {
  return analysisInputSchema.parse({
    kind: "monthly",
    month: "2026-09",
    monthLabel: "setembro de 2026",
    facts: [
      { key: "reserve.target", label: "Meta da reserva", value: "R$ 36.000,00" },
      { key: "reserve.coverage", label: "Cobertura da reserva", value: "4,6 meses" },
      { key: "savings_rate", label: "Taxa de poupança", value: "13,9%" },
    ],
    ...overrides,
  });
}

function output(overrides: Record<string, unknown> = {}) {
  return analysisOutputSchema.parse({
    reading:
      "Em setembro de 2026, a reserva cobre 4,6 meses, abaixo da meta de R$ 36.000,00, com taxa de poupança de 13,9%.",
    tradeOffs: ["Mais liquidez reduz o rendimento esperado."],
    counterArgument: "Uma meta maior imobiliza recursos que poderiam reduzir dívidas caras.",
    citedKeys: ["reserve.target", "reserve.coverage", "savings_rate"],
    ...overrides,
  });
}

describe("findAnalysisViolations", () => {
  it("accepts an output quoting fact values and the month label year verbatim", () => {
    expect(findAnalysisViolations(input(), output())).toEqual([]);
  });

  it("rejects a fabricated number not present in any input", () => {
    const violations = findAnalysisViolations(
      input(),
      output({
        reading: "A reserva cresceu 3 meses além do esperado.",
      }),
    );
    expect(violations).toEqual([{ kind: "unsupported_number", token: "3", field: "reading" }]);
  });

  it("rejects a fabricated percentage not present in any input", () => {
    const violations = findAnalysisViolations(
      input(),
      output({
        counterArgument: "Um rendimento de 12,5% justificaria o risco.",
      }),
    );
    expect(violations).toEqual([
      { kind: "unsupported_number", token: "12.5", field: "counterArgument" },
    ]);
  });

  it("accepts the same percentage spelled with a trailing zero", () => {
    const violations = findAnalysisViolations(
      input(),
      output({
        reading: "A taxa de poupança ficou em 13,90%.",
      }),
    );
    expect(violations).toEqual([]);
  });

  it("flags an unknown citation key not present in the input facts", () => {
    const violations = findAnalysisViolations(input(), output({ citedKeys: ["reserve.unknown"] }));
    expect(violations).toEqual([{ kind: "unknown_citation", key: "reserve.unknown" }]);
  });

  it("reports a repeated fabricated number in the same field once", () => {
    const violations = findAnalysisViolations(
      input(),
      output({
        reading: "A reserva cresceu 3 meses, depois mais 3 meses.",
      }),
    );
    expect(violations).toEqual([{ kind: "unsupported_number", token: "3", field: "reading" }]);
  });

  it("reports a repeated unknown citation key once", () => {
    const violations = findAnalysisViolations(
      input(),
      output({ citedKeys: ["reserve.unknown", "reserve.unknown"] }),
    );
    expect(violations).toEqual([{ kind: "unknown_citation", key: "reserve.unknown" }]);
  });

  it("does not allow a number that appears only in a fact key", () => {
    const violations = findAnalysisViolations(
      input({
        facts: [{ key: "reserve.target_12", label: "Meta da reserva", value: "coberta" }],
      }),
      output({
        reading: "A meta 12 está coberta.",
        citedKeys: ["reserve.target_12"],
      }),
    );
    expect(violations).toEqual([{ kind: "unsupported_number", token: "12", field: "reading" }]);
  });

  it("reports violations for both a fabricated number and an unknown citation", () => {
    const violations = findAnalysisViolations(
      input(),
      output({
        reading: "A reserva cresceu 3 meses.",
        citedKeys: ["reserve.unknown"],
      }),
    );
    expect(violations).toEqual([
      { kind: "unsupported_number", token: "3", field: "reading" },
      { kind: "unknown_citation", key: "reserve.unknown" },
    ]);
  });
});

describe("describeViolations", () => {
  it("returns an empty string for no violations", () => {
    expect(describeViolations([])).toBe("");
  });

  it("describes fabricated numbers and unknown keys deterministically", () => {
    const message = describeViolations([
      { kind: "unsupported_number", token: "3", field: "reading" },
      { kind: "unsupported_number", token: "12.5", field: "counterArgument" },
      { kind: "unknown_citation", key: "reserve.foo" },
    ]);
    expect(message).toBe(
      "Numbers not present in the inputs: 3, 12.5. Unknown input keys: reserve.foo.",
    );
  });

  it("dedupes the same fabricated number reported for two different fields", () => {
    const message = describeViolations([
      { kind: "unsupported_number", token: "3", field: "reading" },
      { kind: "unsupported_number", token: "3", field: "tradeOffs" },
    ]);
    expect(message).toBe("Numbers not present in the inputs: 3.");
  });

  it("omits the unknown-keys sentence when there are none", () => {
    const message = describeViolations([
      { kind: "unsupported_number", token: "3", field: "reading" },
    ]);
    expect(message).toBe("Numbers not present in the inputs: 3.");
  });

  it("dedupes the same unknown key reported twice", () => {
    const message = describeViolations([
      { kind: "unknown_citation", key: "reserve.foo" },
      { kind: "unknown_citation", key: "reserve.foo" },
    ]);
    expect(message).toBe("Unknown input keys: reserve.foo.");
  });

  it("omits the numbers sentence when there are none", () => {
    const message = describeViolations([{ kind: "unknown_citation", key: "reserve.foo" }]);
    expect(message).toBe("Unknown input keys: reserve.foo.");
  });
});
