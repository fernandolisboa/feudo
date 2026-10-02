import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "../auth/schema.ts";

// Household-scoped (ADR-0001): at most one row per household, holding the
// criteria weights it chose for the bank comparison (ADR-0006). A household
// without a row uses the product defaults. The weights are one JSON object
// so a whole set is replaced in a single upsert and the criteria list stays
// data (packages/core) instead of one column per criterion.
export const bankCriteriaWeights = pgTable("bank_criteria_weights", {
  householdId: text("household_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  weights: jsonb("weights").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
