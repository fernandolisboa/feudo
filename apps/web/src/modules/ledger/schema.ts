import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "../auth/schema.ts";
import { bankTransaction, bankTransactionTypeEnum } from "../sync/schema.ts";

export const subcategoryKindEnum = pgEnum("subcategory_kind", [
  "income",
  "fixed",
  "variable",
  "transfer",
]);

// Household-scoped (ADR-0001): a household's own subcategory inside a
// product category (packages/core/src/ledger/categories/taxonomy.ts), for
// spending the built-in taxonomy doesn't cover. Its id is opaque, told apart
// from a product subcategory id ("housing.rent") only by SubcategoryRef.type.
// (household_id, id) is unique so composite foreign keys below can target a
// specific household's own subcategory and no other's.
export const householdSubcategory = pgTable(
  "household_subcategory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    name: text("name").notNull(),
    kind: subcategoryKindEnum("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("household_subcategory_household_id_id_unique").on(table.householdId, table.id),
    uniqueIndex("household_subcategory_household_category_name_uidx").on(
      table.householdId,
      table.categoryId,
      sql`lower(${table.name})`,
    ),
  ],
);

// Household-scoped (ADR-0001): a household's override of a product
// subcategory's default kind, e.g. treating "leisure.travel" as fixed.
// Absence means the product default (taxonomy.ts) applies.
export const subcategoryKindOverride = pgTable(
  "subcategory_kind_override",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productSubcategoryId: text("product_subcategory_id").notNull(),
    kind: subcategoryKindEnum("kind").notNull(),
  },
  (table) => [
    primaryKey({
      name: "subcategory_kind_override_pk",
      columns: [table.householdId, table.productSubcategoryId],
    }),
  ],
);

// Household-scoped (ADR-0001): a member's standing rule, applied at read
// time by packages/core/src/ledger/categories/categorize.ts and never
// written onto a transaction (design contract's key decision: only manual
// choices are persisted). direction null matches either. Targets exactly one
// subcategory, product or the household's own; the composite foreign key
// only lets it point at this household's own household_subcategory, and the
// check makes "exactly one target" a database invariant, not just app code.
export const categorizationRule = pgTable(
  "categorization_rule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pattern: text("pattern").notNull(),
    direction: bankTransactionTypeEnum("direction"),
    productSubcategoryId: text("product_subcategory_id"),
    householdSubcategoryId: text("household_subcategory_id"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "categorization_rule_household_subcategory_fk",
      columns: [table.householdId, table.householdSubcategoryId],
      foreignColumns: [householdSubcategory.householdId, householdSubcategory.id],
    }).onDelete("cascade"),
    check(
      "categorization_rule_target_check",
      sql`num_nonnulls(${table.productSubcategoryId}, ${table.householdSubcategoryId}) = 1`,
    ),
    unique("categorization_rule_household_pattern_direction_unique")
      .on(table.householdId, table.pattern, table.direction)
      .nullsNotDistinct(),
  ],
);

// Scoped through the transaction's account, like bank_transaction itself
// (ADR-0001): a manual choice is a fact about the transaction, not about the
// household that made it, so it travels with the account when the account
// moves. A choice pointing at a household's own subcategory only resolves
// while the transaction is visible to that household (the read path passes
// every joined row through categorization-repository.ts's
// manualSubcategoryRefFrom, which compares subcategory_household_id with the
// reading scope); once the
// account moves elsewhere, the destination household's rules and defaults
// take over instead (ADR-0001, "Moving an account between households").
export const transactionCategorization = pgTable(
  "transaction_categorization",
  {
    transactionId: text("transaction_id")
      .primaryKey()
      .references(() => bankTransaction.id, { onDelete: "cascade" }),
    productSubcategoryId: text("product_subcategory_id"),
    householdSubcategoryId: text("household_subcategory_id"),
    // Not a scope column: it only names the household that owns
    // household_subcategory_id, so the composite foreign key below can
    // target that household's own subcategory and no other's.
    subcategoryHouseholdId: text("subcategory_household_id"),
    categorizedByUserId: text("categorized_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    categorizedAt: timestamp("categorized_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "transaction_categorization_household_subcategory_fk",
      columns: [table.subcategoryHouseholdId, table.householdSubcategoryId],
      foreignColumns: [householdSubcategory.householdId, householdSubcategory.id],
    }).onDelete("cascade"),
    check(
      "transaction_categorization_target_check",
      sql`(${table.productSubcategoryId} is not null and ${table.householdSubcategoryId} is null and ${table.subcategoryHouseholdId} is null)
        or (${table.productSubcategoryId} is null and ${table.householdSubcategoryId} is not null and ${table.subcategoryHouseholdId} is not null)`,
    ),
  ],
);
