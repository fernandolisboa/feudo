import { describe, expect, it } from "vitest";

import { retentionCutoff, runDailyPruneStep } from "./prune";

import type { Database } from "@/platform/db/client";

describe("retentionCutoff", () => {
  it("walks back exactly 12 calendar months, keeping the day fixed", () => {
    expect(retentionCutoff(new Date("2026-03-31T10:00:00.000Z"))).toEqual(
      new Date("2025-03-31T10:00:00.000Z"),
    );
  });

  it("rolls 29 February forward to 1 March when the target year has no leap day", () => {
    expect(retentionCutoff(new Date("2024-02-29T12:00:00.000Z"))).toEqual(
      new Date("2023-03-01T12:00:00.000Z"),
    );
  });
});

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
