import { accumulate12MonthIpca, formatRatePpmAsPercent, parsePercentToRatePpm } from "@feudo/core";

import {
  getLastNObservations,
  getLastReferenceDate,
  upsertMarketData,
} from "@/db/repositories/market-data-repository";

import { computeFetchWindow } from "./fetch-window";
import { fetchSgsSeries } from "./sgs-client";
import { SgsSeriesCode } from "./series";

import type { Database } from "@/db/client";

const DIRECTLY_FETCHED_SERIES_CODES = [
  SgsSeriesCode.CdiDaily,
  SgsSeriesCode.SelicTarget,
  SgsSeriesCode.SelicDaily,
  SgsSeriesCode.IpcaMonthly,
] as const;

const MONTHS_IN_A_YEAR = 12;

export type RefreshOutcome = "fetched" | "computedFromIpcaMonthly" | "skipped";

export interface RefreshSeriesResult {
  seriesCode: string;
  outcome: RefreshOutcome;
}

export interface RefreshMarketDataOptions {
  now?: Date;
  fetchImpl?: typeof fetch;
}

function logFetchFailure(seriesCode: string, error: unknown): void {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.warn(`market-data: fetch failed for series ${seriesCode} (${errorName})`);
}

async function refreshDirectSeries(
  db: Database,
  seriesCode: string,
  now: Date,
  fetchImpl: typeof fetch,
): Promise<RefreshSeriesResult> {
  const lastReferenceDate = await getLastReferenceDate(db, seriesCode);
  const window = computeFetchWindow(now, lastReferenceDate);

  try {
    const observations = await fetchSgsSeries(seriesCode, window, fetchImpl);
    await upsertMarketData(db, seriesCode, observations);
    return { seriesCode, outcome: "fetched" };
  } catch (error) {
    logFetchFailure(seriesCode, error);
    return { seriesCode, outcome: "skipped" };
  }
}

async function refreshIpca12MonthAccumulated(
  db: Database,
  now: Date,
  fetchImpl: typeof fetch,
): Promise<RefreshSeriesResult> {
  const seriesCode = SgsSeriesCode.Ipca12MonthAccumulated;
  const lastReferenceDate = await getLastReferenceDate(db, seriesCode);
  const window = computeFetchWindow(now, lastReferenceDate);

  try {
    const observations = await fetchSgsSeries(seriesCode, window, fetchImpl);
    await upsertMarketData(db, seriesCode, observations);
    return { seriesCode, outcome: "fetched" };
  } catch (error) {
    logFetchFailure(seriesCode, error);
  }

  const lastMonthlyObservations = await getLastNObservations(
    db,
    SgsSeriesCode.IpcaMonthly,
    MONTHS_IN_A_YEAR,
  );

  if (lastMonthlyObservations.length < MONTHS_IN_A_YEAR) {
    return { seriesCode, outcome: "skipped" };
  }

  const monthlyRatesPpm = lastMonthlyObservations.map((observation) =>
    parsePercentToRatePpm(observation.value),
  );
  const accumulatedRatePpm = accumulate12MonthIpca(monthlyRatesPpm);
  const asOfDate = lastMonthlyObservations[lastMonthlyObservations.length - 1]?.referenceDate;
  if (!asOfDate) {
    return { seriesCode, outcome: "skipped" };
  }

  await upsertMarketData(db, seriesCode, [
    { referenceDate: asOfDate, value: formatRatePpmAsPercent(accumulatedRatePpm) },
  ]);
  return { seriesCode, outcome: "computedFromIpcaMonthly" };
}

export async function refreshMarketData(
  db: Database,
  options: RefreshMarketDataOptions = {},
): Promise<RefreshSeriesResult[]> {
  const now = options.now ?? new Date();
  const fetchImpl = options.fetchImpl ?? fetch;

  const results: RefreshSeriesResult[] = [];
  for (const seriesCode of DIRECTLY_FETCHED_SERIES_CODES) {
    results.push(await refreshDirectSeries(db, seriesCode, now, fetchImpl));
  }
  results.push(await refreshIpca12MonthAccumulated(db, now, fetchImpl));

  return results;
}
