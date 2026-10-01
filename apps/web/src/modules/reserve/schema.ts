import { bigint, boolean, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { organization } from "../auth/schema.ts";

// Household-scoped (ADR-0001): one row per household per closed month, the
// result the daily month-close job (reserve/service.ts) recorded. The unique
// constraint is the idempotency guarantee a concurrent or re-run job relies
// on, not just app-level logic (CONTEXT.md, "Reserve target").
export const reserveTargetRecord = pgTable(
  "reserve_target_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    closedMonth: text("closed_month").notNull(),
    averageFixedCostCentavos: bigint("average_fixed_cost_centavos", { mode: "number" }).notNull(),
    monthsUsed: integer("months_used").notNull(),
    isEstimate: boolean("is_estimate").notNull(),
    reserveMultiple: integer("reserve_multiple").notNull(),
    targetCentavos: bigint("target_centavos", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("reserve_target_record_household_month_unique").on(table.householdId, table.closedMonth),
  ],
);

// Household-scoped (ADR-0001): created only when the month-close job's
// notice rule fires (packages/core/src/reserve/notice.ts). dismissedAt is
// per household, not per member: any member dismissing it clears it for
// everyone (CONTEXT.md, "Reserve target notice").
export const reserveTargetNotice = pgTable(
  "reserve_target_notice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    closedMonth: text("closed_month").notNull(),
    previousTargetCentavos: bigint("previous_target_centavos", { mode: "number" }).notNull(),
    newTargetCentavos: bigint("new_target_centavos", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  },
  (table) => [
    unique("reserve_target_notice_household_month_unique").on(table.householdId, table.closedMonth),
  ],
);
