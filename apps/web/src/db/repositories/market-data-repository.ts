import { desc, eq, sql } from "drizzle-orm";

import { marketData } from "../schema/market-data.ts";

import type { Database } from "../client.ts";

export interface MarketDataRow {
  referenceDate: string;
  value: string;
}

export async function getLastReferenceDate(
  db: Database,
  seriesCode: string,
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
  seriesCode: string,
): Promise<MarketDataRow | undefined> {
  const rows = await getLastNObservations(db, seriesCode, 1);
  return rows[0];
}

export async function getLastNObservations(
  db: Database,
  seriesCode: string,
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

export async function upsertMarketData(
  db: Database,
  seriesCode: string,
  observations: readonly MarketDataRow[],
): Promise<void> {
  if (observations.length === 0) {
    return;
  }

  await db
    .insert(marketData)
    .values(
      observations.map((observation) => ({
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
