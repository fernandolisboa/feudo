import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
  // Nullable: a household that only ever set weights has no options row yet;
  // every field falls back to its product default (ADR-0006, 2026-10-14).
  options: jsonb("options"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Household-scoped (ADR-0001): the household's own score for one criterion
// of one bank, which wins over the shipped reference data in its comparison
// and is never rewritten by a reference update (ADR-0006, 2026-10-14).
// base_reviewed_at is the reference review date the household overrode, so a
// later reference review can be offered to it instead of silently applied.
export const bankCriterionOverride = pgTable(
  "bank_criterion_override",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").notNull(),
    criterion: text("criterion").notNull(),
    score: integer("score").notNull(),
    note: text("note").notNull(),
    sourceUrl: text("source_url"),
    baseReviewedAt: date("base_reviewed_at").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: "bank_criterion_override_pk",
      columns: [table.householdId, table.institutionId, table.criterion],
    }),
    check("bank_criterion_override_score_check", sql`${table.score} between 0 and 100`),
  ],
);

// Household-scoped (ADR-0001): the household's own offered/not-offered call
// on one account type of one bank (ADR-0006 amendment 2026-10-16), which
// wins over the shipped reference data in its comparison the same way a
// criterion override does. base_reviewed_at follows the same rule: the
// reference account-type review date the household answered to, so a later
// reference review can be offered to it instead of silently applied.
export const bankAccountTypeOverride = pgTable(
  "bank_account_type_override",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").notNull(),
    accountType: text("account_type").notNull(),
    offered: boolean("offered").notNull(),
    note: text("note").notNull(),
    sourceUrl: text("source_url"),
    baseReviewedAt: date("base_reviewed_at").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: "bank_account_type_override_pk",
      columns: [table.householdId, table.institutionId, table.accountType],
    }),
  ],
);
