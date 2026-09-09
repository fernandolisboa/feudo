import { beforeEach, describe, expect, it, vi } from "vitest";

import { SgsSeriesCode } from "./series";

import type { Database } from "@/db/client";

vi.mock("./repository", () => ({
  getLastReferenceDate: vi.fn(),
  upsertMarketData: vi.fn(),
}));

const { getLastReferenceDate, upsertMarketData } = await import("./repository");
const { refreshMarketData } = await import("./refresh-market-data");

function jsonResponse(): Response {
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function extractDataInicial(url: string): string {
  const value = new URL(url).searchParams.get("dataInicial");
  if (value === null) {
    throw new Error(`URL missing dataInicial: ${url}`);
  }
  return value;
}

describe("refreshMarketData series-to-frequency wiring", () => {
  beforeEach(() => {
    vi.mocked(getLastReferenceDate).mockResolvedValue("2026-08-15");
    vi.mocked(upsertMarketData).mockResolvedValue(undefined);
  });

  it("overlaps one month before the last stored date for the monthly IPCA series", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse());

    await refreshMarketData({} as Database, {
      now: new Date("2026-09-09T12:00:00Z"),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const ipcaCall = vi
      .mocked(fetchImpl)
      .mock.calls.find(([url]) => String(url).includes(`bcdata.sgs.${SgsSeriesCode.IpcaMonthly}/`));
    expect(ipcaCall).toBeDefined();
    expect(extractDataInicial(String(ipcaCall?.[0]))).toBe("15/07/2026");
  });

  it("overlaps five days before the last stored date for daily series", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse());

    await refreshMarketData({} as Database, {
      now: new Date("2026-09-09T12:00:00Z"),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const cdiCall = vi
      .mocked(fetchImpl)
      .mock.calls.find(([url]) => String(url).includes(`bcdata.sgs.${SgsSeriesCode.CdiDaily}/`));
    expect(cdiCall).toBeDefined();
    expect(extractDataInicial(String(cdiCall?.[0]))).toBe("10/08/2026");
  });
});
