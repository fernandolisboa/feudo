import { analysisOutputSchema, findAnalysisViolations } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { createFakeAiClient } from "./fake-client";
import { FIXTURE_INPUT } from "./test/fixtures";

describe("fake AI client", () => {
  it("writes a reading that passes the contract, so preview can exercise the panel", async () => {
    const result = await createFakeAiClient().complete({
      tier: "standard",
      system: "",
      user: "",
      input: FIXTURE_INPUT,
      timeoutMs: 1_000,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const output = analysisOutputSchema.parse(result.output);
    expect(findAnalysisViolations(FIXTURE_INPUT, output)).toEqual([]);
    expect(output.reading).toContain("demonstração");
    expect(result.model).toBe("fake-claude-sonnet-5-5");
  });
});
