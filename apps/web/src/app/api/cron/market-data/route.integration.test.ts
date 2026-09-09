import {
  accumulate12MonthIpca,
  annualizeDailyPercentToRatePpm,
  parsePercentToRatePpm,
} from "@feudo/core";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { marketData } from "@/db/schema/market-data";
import { withTestDb } from "@/db/test/harness";
import { getLatestIndicators } from "@/lib/market-data";

import { GET } from "./route";

import type { Database } from "@/db/client";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
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
  ipca12MonthFetchFails?: boolean;
  failingSeriesCode?: string;
  everySeriesFails?: boolean;
}

function buildFetchMock(options: FetchMockOptions = {}): typeof fetch {
  const mock = vi.fn((url: string) => {
    const matchedSeriesCode = Object.entries(SGS_URLS_BY_SERIES).find(([, fragment]) =>
      url.includes(fragment),
    )?.[0];
    if (!matchedSeriesCode) {
      throw new Error(`Unexpected URL in test fetch mock: ${url}`);
    }

    if (options.everySeriesFails) {
      return Promise.reject(new Error("network down"));
    }
    if (options.failingSeriesCode === matchedSeriesCode) {
      return Promise.reject(new Error("network down"));
    }
    if (options.ipca12MonthFetchFails && matchedSeriesCode === "13522") {
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
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

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/market-data", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

describe("GET /api/cron/market-data (integration)", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("fetches every series and upserts idempotently, computing IPCA 12m from 433 when 13522 fails", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildFetchMock({ ipca12MonthFetchFails: true });

      const firstResponse = await callCronRoute();
      expect(firstResponse.status).toBe(200);
      await expect(firstResponse.json()).resolves.toMatchObject({ ok: true });

      expect(await countRows(db, "12")).toBe(CDI_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "432")).toBe(SELIC_TARGET_OBSERVATIONS.length);
      expect(await countRows(db, "11")).toBe(SELIC_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "433")).toBe(IPCA_MONTHLY_OBSERVATIONS.length);
      expect(await countRows(db, "13522")).toBe(0);

      const secondResponse = await callCronRoute();
      expect(secondResponse.status).toBe(200);

      expect(await countRows(db, "12")).toBe(CDI_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "432")).toBe(SELIC_TARGET_OBSERVATIONS.length);
      expect(await countRows(db, "11")).toBe(SELIC_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "433")).toBe(IPCA_MONTHLY_OBSERVATIONS.length);
      expect(await countRows(db, "13522")).toBe(0);

      expect(console.warn).toHaveBeenCalled();
      for (const call of vi.mocked(console.warn).mock.calls) {
        expect(String(call[0])).not.toMatch(/\d+\.\d+/);
      }

      const indicators = await getLatestIndicators(db);

      expect(indicators.cdiAnnual).toEqual({
        ratePpm: annualizeDailyPercentToRatePpm("0.053701"),
        referenceDate: "2026-09-03",
        source: "computed",
      });

      expect(indicators.selicTarget).toEqual({
        ratePpm: parsePercentToRatePpm("15.00"),
        referenceDate: "2026-08-20",
        source: "sgs",
      });

      expect(indicators.ipcaMonthly).toEqual({
        ratePpm: parsePercentToRatePpm("0.45"),
        referenceDate: "2026-08-01",
        source: "sgs",
      });

      const expectedIpca12MonthPpm = accumulate12MonthIpca(
        IPCA_MONTHLY_OBSERVATIONS.map((observation) => parsePercentToRatePpm(observation.valor)),
      );
      expect(indicators.ipca12Month).toEqual({
        ratePpm: expectedIpca12MonthPpm,
        referenceDate: "2026-08-01",
        source: "computed",
      });
    });
  });

  it("reads the SGS 13522 value directly, labelled as source sgs, when it covers the latest 433 month", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildFetchMock();

      const response = await callCronRoute();
      expect(response.status).toBe(200);
      expect(await countRows(db, "13522")).toBe(1);

      const indicators = await getLatestIndicators(db);
      expect(indicators.ipca12Month).toEqual({
        ratePpm: parsePercentToRatePpm("4.86"),
        referenceDate: "2026-08-01",
        source: "sgs",
      });
    });
  });

  it.each(["12", "432", "11", "433", "13522"])(
    "leaves the stored row for series %s unchanged (value and fetchedAt) when its fetch fails",
    async (seriesCode) => {
      await withTestDb(async (db) => {
        globalThis.fetch = buildFetchMock();
        const seedResponse = await callCronRoute();
        expect(seedResponse.status).toBe(200);

        const referenceDate = String(
          (SUCCESS_FIXTURES_BY_SERIES[seriesCode] as { data: string; valor: string }[]).at(-1)
            ?.data,
        )
          .split("/")
          .reverse()
          .join("-");
        const before = await getStoredRow(db, seriesCode, referenceDate);
        expect(before).toBeDefined();

        globalThis.fetch = buildFetchMock({ failingSeriesCode: seriesCode });
        const secondResponse = await callCronRoute();
        expect(secondResponse.status).toBe(200);

        const after = await getStoredRow(db, seriesCode, referenceDate);
        expect(after).toEqual(before);
      });
    },
  );

  it("returns ok: false with a non-2xx status when every series was skipped", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildFetchMock({ everySeriesFails: true });

      const response = await callCronRoute();
      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({ ok: false });
      expect(await countRows(db, "12")).toBe(0);
    });
  });
});
