import { analysisOutputSchema, findAnalysisViolations } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { createFakeAiClient } from "./fake-client";
import { FIXTURE_INPUT } from "./test/fixtures";

describe("fake AI client", () => {
  it("writes a reading that passes the contract, so preview can exercise the panel", async () => {
    const client = createFakeAiClient();
    const model = await client.resolveModel("sonnet", "standard");
    const result = await client.complete({
      tier: "standard",
      family: "sonnet",
      model,
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
    expect(output.summary).toContain("demonstração");
    expect(output.banks).toContain("demonstração");
    expect(result.model).toBe("fake-claude-sonnet-5-5");
  });

  it("ignores the family's key, resolving the same pinned id for every family", async () => {
    const client = createFakeAiClient();
    await expect(client.resolveModel("haiku", "standard")).resolves.toBe("claude-haiku-5-5");
    await expect(client.resolveModel("opus", "deep")).resolves.toBe("claude-opus-5-5");
  });

  it("suggests a canned subcategory per item, deterministically, and leaves every third one unanswered", async () => {
    const client = createFakeAiClient();

    const result = await client.suggestCategories({
      family: "haiku",
      model: "claude-haiku-5-5",
      system: "",
      user: "",
      outputSchema: {},
      timeoutMs: 1_000,
      input: {
        subcategories: [],
        items: [
          {
            index: 0,
            type: "debit",
            absoluteAmountCentavos: 1_000,
            currency: "BRL",
            description: "a",
          },
          {
            index: 1,
            type: "credit",
            absoluteAmountCentavos: 2_000,
            currency: "BRL",
            description: "b",
          },
          {
            index: 2,
            type: "debit",
            absoluteAmountCentavos: 3_000,
            currency: "BRL",
            description: "c",
          },
        ],
      },
    });

    expect(result).toEqual({
      status: "ok",
      output: {
        suggestions: [
          { index: 0, subcategory: "shopping.other" },
          { index: 1, subcategory: "income.salary" },
          { index: 2, subcategory: null },
        ],
      },
      model: "fake-claude-haiku-5-5",
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  });
});
