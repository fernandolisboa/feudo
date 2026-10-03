import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "../auth/schema.ts";

export const FINANCIAL_DATA_KINDS = ["overview", "transactions", "reserve", "export"] as const;

export type FinancialDataKind = (typeof FINANCIAL_DATA_KINDS)[number];

export const financialDataAccessKind = pgEnum("financial_data_access_kind", FINANCIAL_DATA_KINDS);

// Household- and user-scoped (ADR-0001, ADR-0008): one row per server-side
// read of financial data — who, which household, what kind, when. These four
// columns are the entire row by design: no amounts, descriptions, documents,
// filters or IP, so the table can never leak the financial content it is
// only meant to witness access to. Append-only; the daily job purges rows
// older than 12 calendar months (audit/prune.ts).
export const financialDataAccess = pgTable(
  "financial_data_access",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: financialDataAccessKind("kind").notNull(),
    accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("financial_data_access_household_user_accessed_idx").on(
      table.householdId,
      table.userId,
      table.accessedAt,
    ),
    index("financial_data_access_accessed_idx").on(table.accessedAt),
  ],
);
