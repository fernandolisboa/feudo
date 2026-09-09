import { describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { getLastNObservations, upsertMarketData } from "./repository";

describe("upsertMarketData (integration)", () => {
  it("de-duplicates observations by reference date before the batch upsert", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(db, "12", [
        { referenceDate: "2026-09-01", value: "0.053680" },
        { referenceDate: "2026-09-01", value: "0.053999" },
      ]);

      const rows = await getLastNObservations(db, "12", 10);
      expect(rows).toEqual([{ referenceDate: "2026-09-01", value: "0.053999" }]);
    });
  });

  it("leaves the last stored row unchanged when the observation list is empty", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(db, "12", [{ referenceDate: "2026-09-01", value: "0.053680" }]);
      await upsertMarketData(db, "12", []);

      const rows = await getLastNObservations(db, "12", 10);
      expect(rows).toEqual([{ referenceDate: "2026-09-01", value: "0.053680" }]);
    });
  });
});
