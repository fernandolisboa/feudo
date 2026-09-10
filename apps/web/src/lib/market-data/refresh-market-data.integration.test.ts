import { parsePercentToRatePpm } from "@feudo/core";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { marketData } from "@/db/schema/market-data";
import { withTestDb } from "@/db/test/harness";

import { getLatestIndicators } from "./get-latest-indicators";
import { refreshMarketData } from "./refresh-market-data";
import { SUCCESS_FIXTURES_BY_SERIES, buildSgsFetchMock } from "./test/sgs-fixtures";

import type { Database } from "@/db/client";

const ORIGINAL_FETCH = globalThis.fetch;

async function countRows(db: Database, seriesCode: string): Promise<number> {
  const rows = await db.select().from(marketData).where(eq(marketData.seriesCode, seriesCode));
  return rows.length;
}

async function getStoredRow(
  db: Database,
  seriesCode: string,
  referenceDate: string,
): Promise<{ value: string; fetchedAt: Date } | undefined> {
  const rows = await db
    .select({ value: marketData.value, fetchedAt: marketData.fetchedAt })
    .from(marketData)
    .where(and(eq(marketData.seriesCode, seriesCode), eq(marketData.referenceDate, referenceDate)));
  return rows[0];
}

function referenceDateOf(seriesCode: string): string {
  const observations = SUCCESS_FIXTURES_BY_SERIES[seriesCode] as { data: string; valor: string }[];
  return String(observations.at(-1)?.data).split("/").reverse().join("-");
}

describe("refreshMarketData (integration)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("upserts idempotently: running it twice leaves row counts unchanged for every series", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock();

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });
      for (const seriesCode of Object.keys(SUCCESS_FIXTURES_BY_SERIES)) {
        expect(await countRows(db, seriesCode)).toBe(
          (SUCCESS_FIXTURES_BY_SERIES[seriesCode] as unknown[]).length,
        );
      }

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });
      for (const seriesCode of Object.keys(SUCCESS_FIXTURES_BY_SERIES)) {
        expect(await countRows(db, seriesCode)).toBe(
          (SUCCESS_FIXTURES_BY_SERIES[seriesCode] as unknown[]).length,
        );
      }
    });
  });

  it.each(["12", "432", "11", "433", "13522"])(
    "leaves the stored row for series %s unchanged (value and fetchedAt) when its fetch fails",
    async (seriesCode) => {
      await withTestDb(async (db) => {
        globalThis.fetch = buildSgsFetchMock();
        await refreshMarketData(db, { fetchImpl: globalThis.fetch });

        const referenceDate = referenceDateOf(seriesCode);
        const before = await getStoredRow(db, seriesCode, referenceDate);
        expect(before).toBeDefined();

        globalThis.fetch = buildSgsFetchMock({ failingSeriesCodes: [seriesCode] });
        await refreshMarketData(db, { fetchImpl: globalThis.fetch });

        const after = await getStoredRow(db, seriesCode, referenceDate);
        expect(after).toEqual(before);
      });
    },
  );

  it("reads the SGS 13522 value directly, labelled as source sgs, when it covers the latest 433 month", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock();

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });
      expect(await countRows(db, "13522")).toBe(1);

      const indicators = await getLatestIndicators(db);
      expect(indicators.ipca12Month).toEqual({
        ratePpm: parsePercentToRatePpm("4.86"),
        referenceDate: "2026-08-01",
        source: "sgs",
      });
    });
  });

  it("logs a network failure with the series code and SgsFetchError name, and no other numeric value", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock({ failingSeriesCodes: ["12"] });

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });

      expect(console.warn).toHaveBeenCalledExactlyOnceWith(
        "market-data: fetch failed for series 12 (SgsFetchError)",
      );
    });
  });

  it("logs a malformed response with the series code and SgsResponseShapeError name, and no other numeric value", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock({ malformedSeriesCodes: ["432"] });

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });

      expect(console.warn).toHaveBeenCalledExactlyOnceWith(
        "market-data: fetch failed for series 432 (SgsResponseShapeError)",
      );
    });
  });
});
