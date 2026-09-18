import {
  accumulate12MonthIpca,
  annualizeDailyPercentToRatePpm,
  parsePercentToRatePpm,
} from "@feudo/core";

import { getLastNObservations, getLatestObservation, type MarketDataRow } from "./repository";

import { SgsSeriesCode } from "./series";

import type { Database } from "@/platform/db/client";
import type { RatePpm } from "@feudo/core";

const MONTHS_IN_A_YEAR = 12;

export interface Indicator {
  ratePpm: RatePpm;
  referenceDate: string;
  source: "sgs" | "computed";
}

export interface LatestIndicators {
  cdiAnnual: Indicator | undefined;
  selicTarget: Indicator | undefined;
  ipcaMonthly: Indicator | undefined;
  ipca12Month: Indicator | undefined;
}

function monthsSinceEpoch(referenceDate: string): number {
  const [year, month] = referenceDate.split("-").map(Number) as [number, number];
  return year * MONTHS_IN_A_YEAR + (month - 1);
}

function areConsecutiveMonths(observations: readonly MarketDataRow[]): boolean {
  for (let index = 1; index < observations.length; index += 1) {
    const previous = observations[index - 1];
    const current = observations[index];
    if (!previous || !current) {
      return false;
    }
    if (monthsSinceEpoch(current.referenceDate) - monthsSinceEpoch(previous.referenceDate) !== 1) {
      return false;
    }
  }
  return true;
}

async function computeIpca12Month(db: Database): Promise<Indicator | undefined> {
  const latestIpcaMonthly = await getLatestObservation(db, SgsSeriesCode.IpcaMonthly);
  if (!latestIpcaMonthly) {
    return undefined;
  }

  const ipca12MonthDirect = await getLatestObservation(db, SgsSeriesCode.Ipca12MonthAccumulated);
  if (ipca12MonthDirect && ipca12MonthDirect.referenceDate === latestIpcaMonthly.referenceDate) {
    return {
      ratePpm: parsePercentToRatePpm(ipca12MonthDirect.value),
      referenceDate: ipca12MonthDirect.referenceDate,
      source: "sgs",
    };
  }

  const lastTwelveMonthly = await getLastNObservations(
    db,
    SgsSeriesCode.IpcaMonthly,
    MONTHS_IN_A_YEAR,
  );
  if (lastTwelveMonthly.length === MONTHS_IN_A_YEAR && areConsecutiveMonths(lastTwelveMonthly)) {
    const lastObservation = lastTwelveMonthly[lastTwelveMonthly.length - 1];
    if (lastObservation) {
      const ratePpm = accumulate12MonthIpca(
        lastTwelveMonthly.map((observation) => parsePercentToRatePpm(observation.value)),
      );
      return { ratePpm, referenceDate: lastObservation.referenceDate, source: "computed" };
    }
  }

  if (ipca12MonthDirect) {
    return {
      ratePpm: parsePercentToRatePpm(ipca12MonthDirect.value),
      referenceDate: ipca12MonthDirect.referenceDate,
      source: "sgs",
    };
  }

  return undefined;
}

export async function getLatestIndicators(db: Database): Promise<LatestIndicators> {
  const [cdiDaily, selicTarget, ipcaMonthly, ipca12Month] = await Promise.all([
    getLatestObservation(db, SgsSeriesCode.CdiDaily),
    getLatestObservation(db, SgsSeriesCode.SelicTarget),
    getLatestObservation(db, SgsSeriesCode.IpcaMonthly),
    computeIpca12Month(db),
  ]);

  return {
    cdiAnnual: cdiDaily
      ? {
          ratePpm: annualizeDailyPercentToRatePpm(cdiDaily.value),
          referenceDate: cdiDaily.referenceDate,
          source: "computed",
        }
      : undefined,
    selicTarget: selicTarget
      ? {
          ratePpm: parsePercentToRatePpm(selicTarget.value),
          referenceDate: selicTarget.referenceDate,
          source: "sgs",
        }
      : undefined,
    ipcaMonthly: ipcaMonthly
      ? {
          ratePpm: parsePercentToRatePpm(ipcaMonthly.value),
          referenceDate: ipcaMonthly.referenceDate,
          source: "sgs",
        }
      : undefined,
    ipca12Month,
  };
}
