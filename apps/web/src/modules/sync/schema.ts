import {
  bigint,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "../auth/schema.ts";

export const dataProviderEnum = pgEnum("data_provider", ["pluggy"]);
export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "checking",
  "savings",
  "credit_card",
  "investment",
]);
export const bankAccountLabelEnum = pgEnum("bank_account_label", ["individual", "shared"]);
export const rateTypeEnum = pgEnum("rate_type", [
  "percentage_of_cdi",
  "fixed_annual",
  "inflation_linked",
  "other",
]);
export const bankTransactionTypeEnum = pgEnum("bank_transaction_type", ["credit", "debit"]);
export const counterpartTypeEnum = pgEnum("counterpart_type", ["cpf", "cnpj"]);

// User-scoped (ADR-0001): one row per attempt to authenticate against the
// provider, so connectProvider/addConnection can refuse a scripted loop of
// credential guesses or item ids before a single request leaves for Pluggy.
// Holds no data beyond who and when; rows past the window are pruned daily.
export const providerAuthAttempt = pgTable(
  "provider_auth_attempt",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("provider_auth_attempt_user_attempted_idx").on(table.userId, table.attemptedAt),
  ],
);

// User-scoped (ADR-0001): the secret a user hands Feudo to read their own
// bank data. One row per user and provider; the client id and secret travel
// together inside one ciphertext (sync/crypto.ts) whose envelope carries the
// key id, so a key rotation can tell old rows apart (ADR-0008).
export const providerCredential = pgTable(
  "provider_credential",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: dataProviderEnum("provider").notNull(),
    ciphertext: text("ciphertext").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("provider_credential_user_provider_uidx").on(table.userId, table.provider),
  ],
);

// User-scoped, append-only (ADR-0008): proof that the user saw and accepted
// the consent text before any bank connection was created with it. The text
// itself is stored, not just a version, so what was shown can be reproduced.
export const bankConnectionConsent = pgTable(
  "bank_connection_consent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scopeVersion: text("scope_version").notNull(),
    scopeText: text("scope_text").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("bank_connection_consent_userId_idx").on(table.userId)],
);

// User-scoped (ADR-0001): one row per institution the user connected at the
// provider (a Pluggy "item"). Belongs to the user who authorized it, never to
// a household; its accounts carry the household assignment instead.
// default_household_id is not a scope: it only says where an account the
// provider starts listing later lands (#76), and is cleared by the database
// the moment its owner stops being a member there (member_departure_trigger).
export const bankConnection = pgTable(
  "bank_connection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: dataProviderEnum("provider").notNull(),
    providerItemId: text("provider_item_id").notNull(),
    institutionName: text("institution_name").notNull(),
    institutionProviderId: text("institution_provider_id").notNull(),
    consentId: text("consent_id")
      .notNull()
      .references(() => bankConnectionConsent.id, { onDelete: "restrict" }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastSyncError: text("last_sync_error"),
    lastSyncAttemptedAt: timestamp("last_sync_attempted_at", { withTimezone: true }),
    firstSyncSince: date("first_sync_since", { mode: "string" }),
    defaultHouseholdId: text("default_household_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bank_connection_user_provider_item_uidx").on(
      table.userId,
      table.provider,
      table.providerItemId,
    ),
    uniqueIndex("bank_connection_consentId_uidx").on(table.consentId),
  ],
);

// Household-scoped (ADR-0001): household_id is nullable only to mean
// "unassigned" (the household it was assigned to was deleted, or its
// connection's owner left or was removed from it: member_departure_trigger);
// an unassigned account is visible only to its connection's owner. "bank_account", not
// "account": Better Auth already owns an "account" table for login providers.
export const bankAccount = pgTable(
  "bank_account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    connectionId: text("connection_id")
      .notNull()
      .references(() => bankConnection.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => organization.id, { onDelete: "set null" }),
    providerAccountId: text("provider_account_id").notNull(),
    type: bankAccountTypeEnum("type").notNull(),
    productType: text("product_type"),
    name: text("name").notNull(),
    balanceCentavos: bigint("balance_centavos", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    label: bankAccountLabelEnum("label").notNull().default("individual"),
    holderDocumentHash: text("holder_document_hash"),
    ratePpm: integer("rate_ppm"),
    rateType: rateTypeEnum("rate_type"),
    dueDate: date("due_date", { mode: "string" }),
    acquisitionDate: date("acquisition_date", { mode: "string" }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bank_account_connection_provider_account_uidx").on(
      table.connectionId,
      table.providerAccountId,
    ),
    index("bank_account_householdId_idx").on(table.householdId),
  ],
);

// Household-scoped through its account (ADR-0001): a transaction has no
// household column of its own, so reassigning an account moves its history
// with it and an unassigned account's transactions are visible to nobody.
// The counterpart document is kept only as the same keyed hash used for
// account holders, so ledger can pair internal transfers later (ADR-0008).
export const bankTransaction = pgTable(
  "bank_transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
    providerTransactionId: text("provider_transaction_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    amountCentavos: bigint("amount_centavos", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    description: text("description").notNull(),
    providerCategory: text("provider_category"),
    type: bankTransactionTypeEnum("type").notNull(),
    counterpartType: counterpartTypeEnum("counterpart_type"),
    counterpartDocumentHash: text("counterpart_document_hash"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bank_transaction_account_provider_transaction_uidx").on(
      table.accountId,
      table.providerTransactionId,
    ),
    index("bank_transaction_account_date_idx").on(table.accountId, table.date),
  ],
);
