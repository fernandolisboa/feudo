import { accumulate12MonthIpca, annualizeDailyRate, parsePercentToRatePpm } from "@feudo/core";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { marketData } from "@/db/schema/market-data";
import { withTestDb } from "@/db/test/harness";
import { getLatestIndicators } from "@/lib/market-data/get-latest-indicators";

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

function buildFetchMock(): typeof fetch {
  const mock = vi.fn((url: string) => {
    if (url.includes("bcdata.sgs.12/")) {
      return Promise.resolve(jsonResponse(CDI_DAILY_OBSERVATIONS));
    }
    if (url.includes("bcdata.sgs.432/")) {
      return Promise.resolve(jsonResponse(SELIC_TARGET_OBSERVATIONS));
    }
    if (url.includes("bcdata.sgs.11/")) {
      return Promise.resolve(jsonResponse(SELIC_DAILY_OBSERVATIONS));
    }
    if (url.includes("bcdata.sgs.433/")) {
      return Promise.resolve(jsonResponse(IPCA_MONTHLY_OBSERVATIONS));
    }
    if (url.includes("bcdata.sgs.13522/")) {
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    }
    throw new Error(`Unexpected URL in test fetch mock: ${url}`);
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
    globalThis.fetch = buildFetchMock();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("fetches every series, falls back to computing IPCA 12m from 433, and upserts idempotently", async () => {
    await withTestDb(async (db) => {
      const firstResponse = await callCronRoute();
      expect(firstResponse.status).toBe(200);
      await expect(firstResponse.json()).resolves.toMatchObject({ ok: true });

      expect(await countRows(db, "12")).toBe(CDI_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "432")).toBe(SELIC_TARGET_OBSERVATIONS.length);
      expect(await countRows(db, "11")).toBe(SELIC_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "433")).toBe(IPCA_MONTHLY_OBSERVATIONS.length);
      expect(await countRows(db, "13522")).toBe(1);

      const secondResponse = await callCronRoute();
      expect(secondResponse.status).toBe(200);

      expect(await countRows(db, "12")).toBe(CDI_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "432")).toBe(SELIC_TARGET_OBSERVATIONS.length);
      expect(await countRows(db, "11")).toBe(SELIC_DAILY_OBSERVATIONS.length);
      expect(await countRows(db, "433")).toBe(IPCA_MONTHLY_OBSERVATIONS.length);
      expect(await countRows(db, "13522")).toBe(1);

      expect(console.warn).toHaveBeenCalled();
      for (const call of vi.mocked(console.warn).mock.calls) {
        expect(String(call[0])).not.toMatch(/\d+\.\d+/);
      }

      const indicators = await getLatestIndicators(db);

      const expectedCdiAnnualPpm = annualizeDailyRate(parsePercentToRatePpm("0.053701"));
      expect(indicators.cdiAnnual).toEqual({
        ratePpm: expectedCdiAnnualPpm,
        referenceDate: "2026-09-03",
      });

      expect(indicators.selicTarget).toEqual({
        ratePpm: parsePercentToRatePpm("15.00"),
        referenceDate: "2026-08-20",
      });

      expect(indicators.ipcaMonthly).toEqual({
        ratePpm: parsePercentToRatePpm("0.45"),
        referenceDate: "2026-08-01",
      });

      const expectedIpca12MonthPpm = accumulate12MonthIpca(
        IPCA_MONTHLY_OBSERVATIONS.map((observation) => parsePercentToRatePpm(observation.valor)),
      );
      expect(indicators.ipca12Month?.referenceDate).toBe("2026-08-01");
      expect(
        Math.abs((indicators.ipca12Month?.ratePpm ?? 0) - expectedIpca12MonthPpm),
      ).toBeLessThanOrEqual(50);
    });
  });
});
