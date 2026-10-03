import { describe, expect, it } from "vitest";

import { describeMonths } from "./describe-months";

describe("describeMonths", () => {
  it("is empty for no months", () => {
    expect(describeMonths([])).toBe("");
  });

  it("names a single month", () => {
    expect(describeMonths(["2026-09"])).toBe("setembro de 2026");
  });

  it("collapses consecutive months into a range", () => {
    expect(describeMonths(["2025-10", "2025-11", "2025-12", "2026-01"])).toBe(
      "outubro de 2025 a janeiro de 2026",
    );
  });

  it("lists separate stretches with commas and a final 'e'", () => {
    expect(describeMonths(["2026-01", "2026-02", "2026-05", "2026-08"])).toBe(
      "janeiro de 2026 a fevereiro de 2026, maio de 2026 e agosto de 2026",
    );
  });
});
