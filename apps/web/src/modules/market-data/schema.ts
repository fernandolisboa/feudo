import { date, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const marketData = pgTable(
  "market_data",
  {
    seriesCode: text("series_code").notNull(),
    referenceDate: date("reference_date", { mode: "string" }).notNull(),
    value: text("value").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.seriesCode, table.referenceDate] })],
);
