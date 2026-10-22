import { describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";

import { runRateLimitPruneStep } from "./rate-limit-prune";
import { rateLimit } from "./schema";

const NOW = new Date("2026-10-22T12:00:00.000Z");
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

describe("runRateLimitPruneStep (integration)", () => {
  it("deletes rows last hit more than a day ago and keeps the recent ones", async () => {
    await withTestDb(async (db) => {
      await db.insert(rateLimit).values([
        {
          id: "stale",
          key: "203.0.113.1/sign-in/email",
          count: 1,
          lastRequest: NOW.getTime() - 25 * HOUR_MS,
        },
        {
          id: "day-old",
          key: "203.0.113.2/sign-in/email",
          count: 1,
          lastRequest: NOW.getTime() - 23 * HOUR_MS,
        },
        {
          id: "fresh",
          key: "203.0.113.3/sign-in/email",
          count: 1,
          lastRequest: NOW.getTime() - MINUTE_MS,
        },
      ]);

      const result = await runRateLimitPruneStep(db, NOW);

      expect(result).toEqual({ deleted: 1 });
      const remaining = await db.select({ id: rateLimit.id }).from(rateLimit);
      expect(remaining.map((row) => row.id).sort()).toEqual(["day-old", "fresh"]);
    });
  });
});
