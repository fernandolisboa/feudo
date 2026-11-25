import { describe, expect, it } from "vitest";

import { CATEGORY_SUGGESTION_BUDGET_MS } from "@/modules/analysis";

import { maxDuration } from "./page";

describe("GuidedCategorizationPage route config", () => {
  it("gives the suggest-categories Server Action its full budget before Next.js can time the request out", () => {
    expect(maxDuration * 1000).toBe(CATEGORY_SUGGESTION_BUDGET_MS);
  });
});
