import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { bankTransaction } from "../sync/schema.ts";
import { organization, user } from "../auth/schema.ts";
import {
  AI_FAMILIES,
  DEFAULT_CATEGORY_SUGGESTION_FAMILY,
  DEFAULT_MONTHLY_FAMILY,
  DEFAULT_ON_DEMAND_FAMILY,
} from "./ai-client.ts";

export const analysisKind = pgEnum("analysis_kind", ["monthly", "on_demand"]);

export const analysisStatus = pgEnum("analysis_status", ["running", "succeeded", "failed"]);

export const aiModelFamily = pgEnum("ai_model_family", AI_FAMILIES);

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

// Household-scoped (ADR-0001, ADR-0013): one row per attempt to register or
// change the household's Anthropic key, whether verification itself
// succeeds or not (an attempt is "a key was submitted", never "a key was
// accepted"). key-verification-attempts.ts rate-limits on this table instead
// of counting calls to Anthropic directly, so the household's own key
// verification quota is enforced the same way (and is visible the same way)
// as every other quota in the codebase.
export const aiKeyVerificationAttempt = pgTable(
  "ai_key_verification_attempt",
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
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_key_verification_attempt_household_idx").on(table.householdId, table.attemptedAt),
    index("ai_key_verification_attempt_user_idx").on(table.userId, table.attemptedAt),
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
  monthlyFamily: aiModelFamily("monthly_family").notNull().default(DEFAULT_MONTHLY_FAMILY),
  onDemandFamily: aiModelFamily("on_demand_family").notNull().default(DEFAULT_ON_DEMAND_FAMILY),
  categorySuggestionFamily: aiModelFamily("category_suggestion_family")
    .notNull()
    .default(DEFAULT_CATEGORY_SUGGESTION_FAMILY),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Household-scoped (ADR-0001, ADR-0014): one row per press of "Sugerir
// categorias com IA", whether it sent anything or not. Holds no description,
// amount or transaction id — only how many groups and transactions were
// sent and, once it completes, how many got a suggestion. Counted and
// inserted under a lock on the household row, the same pattern as
// household_analysis's reserveOnDemand; `status` reuses analysis_status.
export const categorySuggestionRun = pgTable(
  "category_suggestion_run",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    requestedByUserId: text("requested_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    localDay: date("local_day", { mode: "string" }).notNull(),
    status: analysisStatus("status").notNull().default("running"),
    promptVersion: text("prompt_version").notNull(),
    requestedModel: text("requested_model").notNull(),
    model: text("model"),
    itemCount: integer("item_count").notNull(),
    transactionCount: integer("transaction_count").notNull(),
    suggestedCount: integer("suggested_count"),
    failureReason: text("failure_reason"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("category_suggestion_run_household_day_idx").on(table.householdId, table.localDay),
    index("category_suggestion_run_household_created_idx").on(table.householdId, table.createdAt),
    index("category_suggestion_run_created_idx").on(table.createdAt),
    check("category_suggestion_run_item_count_check", sql`${table.itemCount} > 0`),
    check(
      "category_suggestion_run_transaction_count_check",
      sql`${table.transactionCount} >= ${table.itemCount}`,
    ),
  ],
);

// Household-scoped (ADR-0001, ADR-0014): one row per (household, transaction)
// the model was asked to suggest a subcategory for, under the current
// prompt version. `product_subcategory_id` null means "asked, no answer"
// (the model abstained, or the answer was dropped at validation); the
// household's own subcategories are never a target here. Belongs to the
// household that asked, like categorization_deferral: it cascades with the
// transaction and the household, and is read only while the transaction's
// account is assigned to that household (the repository predicates every
// query on that join, never a client-supplied household id).
export const categoryAiSuggestion = pgTable(
  "category_ai_suggestion",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => bankTransaction.id, { onDelete: "cascade" }),
    productSubcategoryId: text("product_subcategory_id"),
    promptVersion: text("prompt_version").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.transactionId] }),
    index("category_ai_suggestion_transaction_idx").on(table.transactionId),
    index("category_ai_suggestion_created_idx").on(table.createdAt),
  ],
);
