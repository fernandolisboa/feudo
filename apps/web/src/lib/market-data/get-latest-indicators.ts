import { annualizeDailyRate, parsePercentToRatePpm, type RatePpm } from "@feudo/core";

import { getLatestObservation } from "@/db/repositories/market-data-repository";

import { SgsSeriesCode } from "./series";

import type { Database } from "@/db/client";

export interface Indicator {
  ratePpm: RatePpm;
  referenceDate: string;
}

export interface LatestIndicators {
  cdiAnnual: Indicator | undefined;
  selicTarget: Indicator | undefined;
  ipcaMonthly: Indicator | undefined;
  ipca12Month: Indicator | undefined;
}

export async function getLatestIndicators(db: Database): Promise<LatestIndicators> {
  const [cdiDaily, selicTarget, ipcaMonthly, ipca12Month] = await Promise.all([
    getLatestObservation(db, SgsSeriesCode.CdiDaily),
    getLatestObservation(db, SgsSeriesCode.SelicTarget),
    getLatestObservation(db, SgsSeriesCode.IpcaMonthly),
    getLatestObservation(db, SgsSeriesCode.Ipca12MonthAccumulated),
  ]);

  return {
    cdiAnnual: cdiDaily
      ? {
          ratePpm: annualizeDailyRate(parsePercentToRatePpm(cdiDaily.value)),
          referenceDate: cdiDaily.referenceDate,
        }
      : undefined,
    selicTarget: selicTarget
      ? {
          ratePpm: parsePercentToRatePpm(selicTarget.value),
          referenceDate: selicTarget.referenceDate,
        }
      : undefined,
    ipcaMonthly: ipcaMonthly
      ? {
          ratePpm: parsePercentToRatePpm(ipcaMonthly.value),
          referenceDate: ipcaMonthly.referenceDate,
        }
      : undefined,
    ipca12Month: ipca12Month
      ? {
          ratePpm: parsePercentToRatePpm(ipca12Month.value),
          referenceDate: ipca12Month.referenceDate,
        }
      : undefined,
  };
}
