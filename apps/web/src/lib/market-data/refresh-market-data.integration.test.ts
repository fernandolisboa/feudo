import { parsePercentToRatePpm } from "@feudo/core";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { marketData } from "@/db/schema/market-data";
import { withTestDb } from "@/db/test/harness";

import { getLatestIndicators } from "./get-latest-indicators";
import { refreshMarketData } from "./refresh-market-data";

import type { Database } from "@/db/client";

const ORIGINAL_FETCH = globalThis.fetch;

const CDI_DAILY_OBSERVATIONS = [
  { data: "01/09/2026", valor: "0.053680" },
  { data: "02/09/2026", valor: "0.053910" },
  { data: "03/09/2026", valor: "0.053701" },
];

const SELIC_TARGET_OBSERVATIONS = [{ data: "20/08/2026", valor: "15.00" }];

const SELIC_DAILY_OBSERVATIONS = [{ data: "03/09/2026", valor: "0.056834" }];

const IPCA_MONTHLY_OBSERVATIONS = [
  { data: "01/09/2025", valor: "0.48" },
  { data: "01/10/2025", valor: "0.44" },
  { data: "01/11/2025", valor: "0.39" },
  { data: "01/12/2025", valor: "0.52" },
  { data: "01/01/2026", valor: "0.16" },
  { data: "01/02/2026", valor: "0.83" },
  { data: "01/03/2026", valor: "0.56" },
  { data: "01/04/2026", valor: "0.43" },
  { data: "01/05/2026", valor: "0.26" },
  { data: "01/06/2026", valor: "0.24" },
  { data: "01/07/2026", valor: "0.30" },
  { data: "01/08/2026", valor: "0.45" },
];

const IPCA_12M_OBSERVATIONS = [{ data: "01/08/2026", valor: "4.86" }];

const SGS_URLS_BY_SERIES: Record<string, string> = {
  "12": "bcdata.sgs.12/",
  "432": "bcdata.sgs.432/",
  "11": "bcdata.sgs.11/",
  "433": "bcdata.sgs.433/",
  "13522": "bcdata.sgs.13522/",
};

const SUCCESS_FIXTURES_BY_SERIES: Record<string, unknown> = {
  "12": CDI_DAILY_OBSERVATIONS,
  "432": SELIC_TARGET_OBSERVATIONS,
  "11": SELIC_DAILY_OBSERVATIONS,
  "433": IPCA_MONTHLY_OBSERVATIONS,
  "13522": IPCA_12M_OBSERVATIONS,
};

interface FetchMockOptions {
  failingSeriesCode?: string;
}

function buildFetchMock(options: FetchMockOptions = {}): typeof fetch {
  const mock = vi.fn((url: string) => {
    const matchedSeriesCode = Object.entries(SGS_URLS_BY_SERIES).find(([, fragment]) =>
      url.includes(fragment),
    )?.[0];
    if (!matchedSeriesCode) {
      throw new Error(`Unexpected URL in test fetch mock: ${url}`);
    }

    if (options.failingSeriesCode === matchedSeriesCode) {
      return Promise.reject(new Error("network down"));
    }

    return Promise.resolve(jsonResponse(SUCCESS_FIXTURES_BY_SERIES[matchedSeriesCode]));
  });
  return mock as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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
      globalThis.fetch = buildFetchMock();

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
        globalThis.fetch = buildFetchMock();
        await refreshMarketData(db, { fetchImpl: globalThis.fetch });

        const referenceDate = referenceDateOf(seriesCode);
        const before = await getStoredRow(db, seriesCode, referenceDate);
        expect(before).toBeDefined();

        globalThis.fetch = buildFetchMock({ failingSeriesCode: seriesCode });
        await refreshMarketData(db, { fetchImpl: globalThis.fetch });

        const after = await getStoredRow(db, seriesCode, referenceDate);
        expect(after).toEqual(before);
      });
    },
  );

  it("reads the SGS 13522 value directly, labelled as source sgs, when it covers the latest 433 month", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildFetchMock();

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

  it("logs a fetch failure without any numeric value in the console.warn message", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildFetchMock({ failingSeriesCode: "12" });

      await refreshMarketData(db, { fetchImpl: globalThis.fetch });

      expect(console.warn).toHaveBeenCalled();
      for (const call of vi.mocked(console.warn).mock.calls) {
        expect(String(call[0])).not.toMatch(/\d+\.\d+/);
      }
    });
  });
});
