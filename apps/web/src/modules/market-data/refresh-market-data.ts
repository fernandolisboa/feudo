import { getLastReferenceDate, upsertMarketData } from "./repository";

import { computeFetchWindow } from "./fetch-window";
import { fetchSgsSeries } from "./sgs-client";
import { SgsSeriesCode } from "./series";

import { errorName } from "@/lib/error-name";

import type { SeriesFrequency } from "./fetch-window";
import type { Database } from "@/platform/db/client";

const SERIES_FREQUENCY: Record<SgsSeriesCode, SeriesFrequency> = {
  [SgsSeriesCode.CdiDaily]: "daily",
  [SgsSeriesCode.SelicTarget]: "daily",
  [SgsSeriesCode.SelicDaily]: "daily",
  [SgsSeriesCode.IpcaMonthly]: "monthly",
  [SgsSeriesCode.Ipca12MonthAccumulated]: "monthly",
};

const DIRECTLY_FETCHED_SERIES_CODES = [
  SgsSeriesCode.CdiDaily,
  SgsSeriesCode.SelicTarget,
  SgsSeriesCode.SelicDaily,
  SgsSeriesCode.IpcaMonthly,
  SgsSeriesCode.Ipca12MonthAccumulated,
] as const;

type RefreshOutcome = "fetched" | "skipped";

export interface RefreshSeriesResult {
  seriesCode: SgsSeriesCode;
  outcome: RefreshOutcome;
}

function logFetchFailure(seriesCode: SgsSeriesCode, error: unknown): void {
  console.warn(`market-data: fetch failed for series ${seriesCode} (${errorName(error)})`);
}

async function refreshDirectSeries(
  db: Database,
  seriesCode: SgsSeriesCode,
  now: Date,
  fetchImpl: typeof fetch,
): Promise<RefreshSeriesResult> {
  try {
    const lastReferenceDate = await getLastReferenceDate(db, seriesCode);
    const window = computeFetchWindow(now, lastReferenceDate, SERIES_FREQUENCY[seriesCode]);
    const observations = await fetchSgsSeries(seriesCode, window, fetchImpl);
    await upsertMarketData(db, seriesCode, observations);
    return { seriesCode, outcome: "fetched" };
  } catch (error) {
    logFetchFailure(seriesCode, error);
    return { seriesCode, outcome: "skipped" };
  }
}

interface RefreshMarketDataOutcome {
  ok: boolean;
  results: RefreshSeriesResult[];
}

export async function refreshMarketData(
  db: Database,
  options: { now?: Date; fetchImpl?: typeof fetch } = {},
): Promise<RefreshMarketDataOutcome> {
  const now = options.now ?? new Date();
  const fetchImpl = options.fetchImpl ?? fetch;

  const results: RefreshSeriesResult[] = [];
  for (const seriesCode of DIRECTLY_FETCHED_SERIES_CODES) {
    results.push(await refreshDirectSeries(db, seriesCode, now, fetchImpl));
  }

  const everySeriesSkipped = results.every((result) => result.outcome === "skipped");
  return { ok: !everySeriesSkipped, results };
}

export type DailyRefreshStep = RefreshMarketDataOutcome | { error: string };

export async function runDailyRefreshStep(db: Database): Promise<DailyRefreshStep> {
  try {
    return await refreshMarketData(db);
  } catch (error) {
    return { error: errorName(error) };
  }
}
