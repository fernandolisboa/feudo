import { describe, expect, it } from "vitest";

import { runRateLimitPruneStep } from "./rate-limit-prune";

import type { Database } from "@/platform/db/client";

describe("runRateLimitPruneStep", () => {
  it("returns an error summary instead of throwing when the prune query fails", async () => {
    const db = {
      delete: () => {
        throw new Error("connection reset");
      },
    } as unknown as Database;

    await expect(runRateLimitPruneStep(db, new Date())).resolves.toEqual({ error: "Error" });
  });
});
