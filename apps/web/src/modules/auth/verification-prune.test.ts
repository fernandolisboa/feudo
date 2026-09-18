import { describe, expect, it } from "vitest";

import { runDailyPruneStep } from "./verification-prune";

import type { Database } from "@/platform/db/client";

describe("runDailyPruneStep", () => {
  it("returns an error summary instead of throwing when the prune query fails", async () => {
    const db = {
      delete: () => {
        throw new Error("connection reset");
      },
    } as unknown as Database;

    await expect(runDailyPruneStep(db)).resolves.toEqual({ error: "Error" });
  });
});
