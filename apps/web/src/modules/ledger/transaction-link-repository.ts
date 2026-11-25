import { and, eq, exists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DismissedLinkPair, TransactionLink, TransactionLinkKind } from "@feudo/core";

import { bankAccount, bankTransaction } from "@/modules/sync/schema";
import { hasSqlState } from "@/platform/db/sql-state";

import { transactionLink, transactionLinkDismissal } from "./schema";

import type { HouseholdScope } from "@/modules/households";
import type { DatabaseOrTransaction } from "@/platform/db/client";

type Database = DatabaseOrTransaction;

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type ConfirmLinkInput = {
  debitTransactionId: string;
  creditTransactionId: string;
  kind: TransactionLinkKind;
};

export type ConfirmLinkResult = "ok" | "not_found";

const debitTransaction = alias(bankTransaction, "debit_transaction");
const debitAccount = alias(bankAccount, "debit_account");
const creditTransaction = alias(bankTransaction, "credit_transaction");
const creditAccount = alias(bankAccount, "credit_account");

// Household-scoped (ADR-0001), the same guarantee as internal_transfer_mark
// and categorization_deferral: every method below is filtered by
// scope.householdId and no method accepts a household id of its own, so a
// query path can never read, confirm, dismiss or undo across households.
export function createTransactionLinkRepository(scope: HouseholdScope) {
  // Scoped through both transactions' accounts, like internal_transfer_mark
  // (schema.ts): a link whose two transactions are not both currently in
  // this household is ignored entirely, never returned half-applied. Fed
  // straight into packages/core's LedgerContext.links.
  async function listConfirmedLinks(db: Database): Promise<TransactionLink[]> {
    const rows = await db
      .select({
        debitTransactionId: transactionLink.debitTransactionId,
        creditTransactionId: transactionLink.creditTransactionId,
        kind: transactionLink.kind,
      })
      .from(transactionLink)
      .innerJoin(debitTransaction, eq(debitTransaction.id, transactionLink.debitTransactionId))
      .innerJoin(
        debitAccount,
        and(
          eq(debitAccount.id, debitTransaction.accountId),
          eq(debitAccount.householdId, scope.householdId),
        ),
      )
      .innerJoin(creditTransaction, eq(creditTransaction.id, transactionLink.creditTransactionId))
      .innerJoin(
        creditAccount,
        and(
          eq(creditAccount.id, creditTransaction.accountId),
          eq(creditAccount.householdId, scope.householdId),
        ),
      );
    return rows;
  }

  // Household-scoped like categorization_deferral: a dismissal only ever
  // feeds suggestLinks alongside this same household's own transaction
  // read, so filtering by household_id alone is enough; it stays behind
  // when an account moves, and simply never matches a pair the household
  // can no longer read.
  async function listDismissals(db: Database): Promise<DismissedLinkPair[]> {
    const rows = await db
      .select({
        debitTransactionId: transactionLinkDismissal.debitTransactionId,
        creditTransactionId: transactionLinkDismissal.creditTransactionId,
      })
      .from(transactionLinkDismissal)
      .where(eq(transactionLinkDismissal.householdId, scope.householdId));
    return rows;
  }

  // Re-proves, inside the write, the same shape a suggestion requires (same
  // account, opposite directions, equal absolute amount, same currency) and
  // that both transactions are currently this household's, so a crafted
  // request naming an arbitrary pair is refused with nothing written. The
  // kind is whatever the caller already computed from packages/core's own
  // rule against a live suggestion list, never read from the client; a
  // concurrent confirm of the same pair loses the race on the table's unique
  // constraints and is reported the same as any other refusal.
  async function confirm(
    db: Database,
    input: ConfirmLinkInput,
    userId: string,
  ): Promise<ConfirmLinkResult> {
    const values = db
      .select({
        id: sql<string>`${crypto.randomUUID()}::text`.as("id"),
        debitTransactionId: sql<string>`${input.debitTransactionId}::text`.as(
          "debit_transaction_id",
        ),
        creditTransactionId: sql<string>`${input.creditTransactionId}::text`.as(
          "credit_transaction_id",
        ),
        kind: sql<string>`${input.kind}::transaction_link_kind`.as("kind"),
        linkedByUserId: sql<string>`${userId}::text`.as("linked_by_user_id"),
        linkedAt: sql<Date>`now()`.as("linked_at"),
      })
      .from(debitTransaction)
      .innerJoin(
        debitAccount,
        and(
          eq(debitAccount.id, debitTransaction.accountId),
          eq(debitAccount.householdId, scope.householdId),
        ),
      )
      .innerJoin(creditTransaction, eq(creditTransaction.id, input.creditTransactionId))
      .innerJoin(
        creditAccount,
        and(
          eq(creditAccount.id, creditTransaction.accountId),
          eq(creditAccount.householdId, scope.householdId),
        ),
      )
      .where(
        and(
          eq(debitTransaction.id, input.debitTransactionId),
          eq(debitTransaction.type, "debit"),
          eq(creditTransaction.type, "credit"),
          eq(debitTransaction.accountId, creditTransaction.accountId),
          eq(debitTransaction.currency, creditTransaction.currency),
          sql`abs(${debitTransaction.amountCentavos}) = abs(${creditTransaction.amountCentavos})`,
        ),
      )
      .limit(1);

    try {
      const written = await db
        .insert(transactionLink)
        .select(values)
        .returning({ id: transactionLink.id });
      return written.length > 0 ? "ok" : "not_found";
    } catch (error) {
      if (hasSqlState(error, POSTGRES_UNIQUE_VIOLATION)) {
        return "not_found";
      }
      throw error;
    }
  }

  // Idempotent within scope, like clearTransferMark: "ok" whether or not a
  // dismissal already existed for this exact pair, since the outcome a
  // caller cares about ("this pair is now dismissed") already holds either
  // way; only a transaction outside this household refuses with
  // "not_found". Columns in schema order, for the same INSERT ... SELECT
  // reason as categorization-repository's defer.
  async function dismiss(
    db: Database,
    debitTransactionId: string,
    creditTransactionId: string,
  ): Promise<"ok" | "not_found"> {
    const values = db
      .select({
        householdId: sql<string>`${scope.householdId}::text`.as("household_id"),
        debitTransactionId: sql<string>`${debitTransactionId}::text`.as("debit_transaction_id"),
        creditTransactionId: sql<string>`${creditTransactionId}::text`.as("credit_transaction_id"),
        dismissedAt: sql<Date>`now()`.as("dismissed_at"),
      })
      .from(debitTransaction)
      .innerJoin(
        debitAccount,
        and(
          eq(debitAccount.id, debitTransaction.accountId),
          eq(debitAccount.householdId, scope.householdId),
        ),
      )
      .innerJoin(creditTransaction, eq(creditTransaction.id, creditTransactionId))
      .innerJoin(
        creditAccount,
        and(
          eq(creditAccount.id, creditTransaction.accountId),
          eq(creditAccount.householdId, scope.householdId),
        ),
      )
      .where(eq(debitTransaction.id, debitTransactionId))
      .limit(1);

    const written = await db
      .insert(transactionLinkDismissal)
      .select(values)
      .onConflictDoUpdate({
        target: [
          transactionLinkDismissal.householdId,
          transactionLinkDismissal.debitTransactionId,
          transactionLinkDismissal.creditTransactionId,
        ],
        set: { dismissedAt: sql`now()` },
      })
      .returning({ debitTransactionId: transactionLinkDismissal.debitTransactionId });
    return written.length > 0 ? "ok" : "not_found";
  }

  // Deletes the one link (either side) that includes this transaction, the
  // same ownership check as clearTransferMark: only this leg needs to be
  // currently this household's, since the mark a member undoes is the fact
  // this transaction carries about itself.
  async function undo(db: Database, transactionId: string): Promise<"ok" | "not_found"> {
    const owned = await db
      .select({ id: bankTransaction.id })
      .from(bankTransaction)
      .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
      .where(
        and(eq(bankTransaction.id, transactionId), eq(bankAccount.householdId, scope.householdId)),
      )
      .limit(1);
    if (owned.length === 0) {
      return "not_found";
    }
    await db.delete(transactionLink).where(
      and(
        or(
          eq(transactionLink.debitTransactionId, transactionId),
          eq(transactionLink.creditTransactionId, transactionId),
        ),
        exists(
          db
            .select({ id: bankTransaction.id })
            .from(bankTransaction)
            .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
            .where(
              and(
                eq(bankTransaction.id, transactionId),
                eq(bankAccount.householdId, scope.householdId),
              ),
            ),
        ),
      ),
    );
    return "ok";
  }

  return { listConfirmedLinks, listDismissals, confirm, dismiss, undo };
}

export type TransactionLinkRepository = ReturnType<typeof createTransactionLinkRepository>;
