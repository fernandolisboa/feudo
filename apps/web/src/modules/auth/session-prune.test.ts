import { describe, expect, it } from "vitest";

import { runSessionPruneStep } from "./session-prune";

import type { Database } from "@/platform/db/client";

describe("runSessionPruneStep", () => {
  it("returns an error summary instead of throwing when the prune query fails", async () => {
    const db = {
      delete: () => {
        throw new Error("connection reset");
      },
    } as unknown as Database;

    await expect(runSessionPruneStep(db, new Date())).resolves.toEqual({ error: "Error" });
  });
});
