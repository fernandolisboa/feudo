import { desc, eq, sql } from "drizzle-orm";

import { marketData } from "@/db/schema/market-data";

import type { SgsSeriesCode } from "./series";
import type { Database } from "@/db/client";

export interface MarketDataRow {
  referenceDate: string;
  value: string;
}

export async function getLastReferenceDate(
  db: Database,
  seriesCode: SgsSeriesCode,
): Promise<string | undefined> {
  const rows = await db
    .select({ referenceDate: marketData.referenceDate })
    .from(marketData)
    .where(eq(marketData.seriesCode, seriesCode))
    .orderBy(desc(marketData.referenceDate))
    .limit(1);
  return rows[0]?.referenceDate;
}

export async function getLatestObservation(
  db: Database,
  seriesCode: SgsSeriesCode,
): Promise<MarketDataRow | undefined> {
  const rows = await getLastNObservations(db, seriesCode, 1);
  return rows[0];
}

export async function getLastNObservations(
  db: Database,
  seriesCode: SgsSeriesCode,
  count: number,
): Promise<MarketDataRow[]> {
  const rows = await db
    .select({ referenceDate: marketData.referenceDate, value: marketData.value })
    .from(marketData)
    .where(eq(marketData.seriesCode, seriesCode))
    .orderBy(desc(marketData.referenceDate))
    .limit(count);
  return rows.reverse();
}

function dedupeByReferenceDate(observations: readonly MarketDataRow[]): MarketDataRow[] {
  const byReferenceDate = new Map<string, MarketDataRow>();
  for (const observation of observations) {
    byReferenceDate.set(observation.referenceDate, observation);
  }
  return [...byReferenceDate.values()];
}

export async function upsertMarketData(
  db: Database,
  seriesCode: SgsSeriesCode,
  observations: readonly MarketDataRow[],
): Promise<void> {
  const deduped = dedupeByReferenceDate(observations);
  if (deduped.length === 0) {
    return;
  }

  await db
    .insert(marketData)
    .values(
      deduped.map((observation) => ({
        seriesCode,
        referenceDate: observation.referenceDate,
        value: observation.value,
      })),
    )
    .onConflictDoUpdate({
      target: [marketData.seriesCode, marketData.referenceDate],
      set: {
        value: sql.raw(`excluded.${marketData.value.name}`),
        fetchedAt: sql`now()`,
      },
    });
}
