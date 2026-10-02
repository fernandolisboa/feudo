import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { organization, user } from "../auth/schema.ts";
import { bankAccount } from "../sync/schema.ts";

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

export const reserveLiquidityEnum = pgEnum("reserve_liquidity", ["daily", "not_daily"]);

// Household-scoped (ADR-0001): what one household says about one of its
// accounts for the reserve (CONTEXT.md, "Reserve position"): whether it is
// part of the reserve, whether it can be redeemed within one business day
// when the product type cannot tell (ADR-0009), and which institution issued
// it when the connection's own label does not say, or names the wrong one.
// institution_id is an id from packages/core's institutions dataset, or
// "unlisted" for an issuer outside it; null means "use the label". A mark is
// read only while its account is assigned to the same household, so an
// account moved elsewhere leaves its old household's mark behind, unread.
export const reserveMark = pgTable(
  "reserve_mark",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
    isReserve: boolean("is_reserve").notNull(),
    liquidity: reserveLiquidityEnum("liquidity"),
    institutionId: text("institution_id"),
    updatedByUserId: text("updated_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.householdId, table.accountId] })],
);
