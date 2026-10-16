import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "../auth/schema.ts";

export const analysisKind = pgEnum("analysis_kind", ["monthly", "on_demand"]);

export const analysisStatus = pgEnum("analysis_status", ["running", "succeeded", "failed"]);

export const aiModelFamily = pgEnum("ai_model_family", ["haiku", "sonnet", "opus"]);

// Household-scoped (ADR-0001): one row per analyst reading, stored with the
// exact input the model saw, the prompt version and the model that answered
// (ADR-0004), so any reading can be re-run and compared. `period` is the
// month the ledger figures describe; `local_day` is the household's calendar
// day when it was requested, which the on-demand quota counts. A household
// has at most one monthly reading per period that has not failed: the partial
// unique index is the guard a concurrent or re-run cron relies on.
export const householdAnalysis = pgTable(
  "household_analysis",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    kind: analysisKind("kind").notNull(),
    period: text("period").notNull(),
    localDay: date("local_day", { mode: "string" }).notNull(),
    status: analysisStatus("status").notNull().default("running"),
    promptVersion: text("prompt_version").notNull(),
    requestedModel: text("requested_model").notNull(),
    model: text("model"),
    input: jsonb("input").notNull(),
    output: jsonb("output"),
    failureReason: text("failure_reason"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    requestedByUserId: text("requested_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("household_analysis_household_created_idx").on(table.householdId, table.createdAt),
    index("household_analysis_household_day_idx").on(table.householdId, table.localDay),
    uniqueIndex("household_analysis_monthly_period_uidx")
      .on(table.householdId, table.period)
      .where(sql`${table.kind} = 'monthly' and ${table.status} <> 'failed'`),
  ],
);

// Household-scoped (ADR-0001, ADR-0013): the household's own Anthropic key,
// encrypted the same way as Meu Pluggy credentials (platform/crypto.ts), and
// the model family it picked for each reading kind. No row means the
// household defaults (opus monthly, sonnet on demand) and has no key.
export const householdAiSettings = pgTable("household_ai_settings", {
  householdId: text("household_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  apiKeyCiphertext: text("api_key_ciphertext"),
  apiKeyLast4: text("api_key_last4"),
  monthlyFamily: aiModelFamily("monthly_family").notNull().default("opus"),
  onDemandFamily: aiModelFamily("on_demand_family").notNull().default("sonnet"),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
