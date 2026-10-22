import { describe, expect, it } from "vitest";

import { runUnverifiedSignUpPruneStep } from "./unverified-sign-up-prune";

import type { Database } from "@/platform/db/client";

describe("runUnverifiedSignUpPruneStep", () => {
  it("returns an error summary instead of throwing when the prune query fails", async () => {
    const db = {
      delete: () => {
        throw new Error("connection reset");
      },
    } as unknown as Database;

    await expect(runUnverifiedSignUpPruneStep(db, new Date())).resolves.toEqual({
      error: "Error",
    });
  });
});
