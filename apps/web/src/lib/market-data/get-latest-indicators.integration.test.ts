import { accumulate12MonthIpca, parsePercentToRatePpm } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";

import { getLatestIndicators } from "./get-latest-indicators";
import { upsertMarketData } from "./repository";

const TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS = [
  { referenceDate: "2025-09-01", value: "0.48" },
  { referenceDate: "2025-10-01", value: "0.44" },
  { referenceDate: "2025-11-01", value: "0.39" },
  { referenceDate: "2025-12-01", value: "0.52" },
  { referenceDate: "2026-01-01", value: "0.16" },
  { referenceDate: "2026-02-01", value: "0.83" },
  { referenceDate: "2026-03-01", value: "0.56" },
  { referenceDate: "2026-04-01", value: "0.43" },
  { referenceDate: "2026-05-01", value: "0.26" },
  { referenceDate: "2026-06-01", value: "0.24" },
  { referenceDate: "2026-07-01", value: "0.30" },
  { referenceDate: "2026-08-01", value: "0.45" },
];

describe("getLatestIndicators ipca12Month (integration)", () => {
  it("computes the 12-month accumulated IPCA when 13522 has no row at all", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(db, "433", TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS);

      const indicators = await getLatestIndicators(db);

      const expectedRatePpm = accumulate12MonthIpca(
        TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS.map((observation) =>
          parsePercentToRatePpm(observation.value),
        ),
      );
      expect(indicators.ipca12Month).toEqual({
        ratePpm: expectedRatePpm,
        referenceDate: "2026-08-01",
        source: "computed",
      });
    });
  });

  it("computes the 12-month accumulated IPCA when 13522 returned an empty response for the window", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(db, "433", TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS);
      await upsertMarketData(db, "13522", []);

      const indicators = await getLatestIndicators(db);

      expect(indicators.ipca12Month?.source).toBe("computed");
    });
  });

  it("does not compute an accumulated value when the last twelve 433 months are not consecutive", async () => {
    await withTestDb(async (db) => {
      const withAGap = TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS.map((observation, index) =>
        index === 5 ? { ...observation, referenceDate: "2020-01-01" } : observation,
      );
      await upsertMarketData(db, "433", withAGap);

      const indicators = await getLatestIndicators(db);

      expect(indicators.ipca12Month).toBeUndefined();
    });
  });

  it("returns undefined when there are fewer than twelve stored monthly observations", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(db, "433", TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS.slice(0, 11));

      const indicators = await getLatestIndicators(db);

      expect(indicators.ipca12Month).toBeUndefined();
    });
  });

  it("falls back to the stale 13522 row when it is out of date and 433 lacks twelve consecutive months", async () => {
    await withTestDb(async (db) => {
      await upsertMarketData(
        db,
        "433",
        TWELVE_CONSECUTIVE_MONTHLY_OBSERVATIONS.slice(0, 11).map((observation, index) =>
          index === 5 ? { ...observation, referenceDate: "2020-01-01" } : observation,
        ),
      );
      await upsertMarketData(db, "13522", [{ referenceDate: "2025-07-01", value: "4.50" }]);

      const indicators = await getLatestIndicators(db);

      expect(indicators.ipca12Month).toEqual({
        ratePpm: parsePercentToRatePpm("4.50"),
        referenceDate: "2025-07-01",
        source: "sgs",
      });
    });
  });
});
