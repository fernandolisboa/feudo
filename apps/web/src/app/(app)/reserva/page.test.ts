import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ON_DEMAND_BUDGET_MS } from "@/modules/analysis";

// Next.js only reads maxDuration as a literal in the page source, so the
// on-demand analysis budget cannot import it; this keeps the two from drifting.
describe("reserve page time limit", () => {
  it("gives the on-demand analysis exactly the budget the page's function allows", () => {
    const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
    const match = /export const maxDuration = (\d+);/.exec(source);

    expect(match).not.toBeNull();
    expect(Number(match?.[1]) * 1000).toBe(ON_DEMAND_BUDGET_MS);
  });
});
