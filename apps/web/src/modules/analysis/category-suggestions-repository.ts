import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { isProductSubcategoryId, type SubcategoryRef } from "@feudo/core";

import { organization } from "@/modules/auth/schema";
import type { HouseholdScope } from "@/modules/households";
import { bankAccount, bankTransaction } from "@/modules/sync/schema";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import { categoryAiSuggestion, categorySuggestionRun } from "./schema";

export type NewCategorySuggestionRun = {
  localDay: string;
  promptVersion: string;
  requestedModel: string;
  itemCount: number;
  transactionCount: number;
  requestedByUserId: string | null;
};

export type CategorySuggestionRunCompletion = {
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type ReserveCategorySuggestionRun =
  { status: "reserved"; id: string } | { status: "in_progress" | "quota_exhausted" };

export type CategorySuggestionAnswerToStore = {
  transactionId: string;
  subcategoryId: string | null;
};

export class CategorySuggestionsRepositoryInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategorySuggestionsRepositoryInvariantError";
  }
}

// Cross-household sweeps for prune.ts (ADR-0008): a household's own rows are
// never opportunistically dropped on write the way key-verification
// attempts are, so these are the only path that reclaims them.
export async function deleteCategorySuggestionRunsOlderThan(
  db: Database,
  cutoff: Date,
): Promise<number> {
  const result = await db
    .delete(categorySuggestionRun)
    .where(lt(categorySuggestionRun.createdAt, cutoff));
  return result.rowCount ?? 0;
}

export async function deleteCategoryAiSuggestionsOlderThan(
  db: Database,
  cutoff: Date,
): Promise<number> {
  const result = await db
    .delete(categoryAiSuggestion)
    .where(lt(categoryAiSuggestion.createdAt, cutoff));
  return result.rowCount ?? 0;
}

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id. category_ai_suggestion carries its own
// household_id, set once at insert, but a transaction's account can move to
// another household afterwards (ADR-0001); every read and write below also
// joins to the transaction's *current* account household, so a moved
// account's old suggestion rows stop being read by the household that asked
// them and the destination household can be asked anew for the same
// transaction (never read through the stored household_id alone).
export function createCategorySuggestionsRepository(scope: HouseholdScope) {
  const inHousehold = eq(categorySuggestionRun.householdId, scope.householdId);

  async function countRunsOn(db: DatabaseOrTransaction, localDay: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(categorySuggestionRun)
      .where(and(inHousehold, eq(categorySuggestionRun.localDay, localDay)));
    return row?.total ?? 0;
  }

  async function hasRunningSince(db: DatabaseOrTransaction, since: Date): Promise<boolean> {
    const rows = await db
      .select({ id: categorySuggestionRun.id })
      .from(categorySuggestionRun)
      .where(
        and(
          inHousehold,
          eq(categorySuggestionRun.status, "running"),
          gte(categorySuggestionRun.createdAt, since),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // A run still "running" past `staleBefore` belongs to a function that died
  // mid-call; it must not block the household forever (same rule as
  // household_analysis's abandonStale).
  async function abandonStale(db: DatabaseOrTransaction, staleBefore: Date): Promise<void> {
    await db
      .update(categorySuggestionRun)
      .set({ status: "failed", failureReason: "abandoned", completedAt: new Date() })
      .where(
        and(
          inHousehold,
          eq(categorySuggestionRun.status, "running"),
          lt(categorySuggestionRun.createdAt, staleBefore),
        ),
      );
  }

  return {
    countRunsOn,
    hasRunningSince,

    // Counting and inserting under a lock on the household's own row, the
    // same pattern as household_analysis's reserveOnDemand: two presses in
    // one household serialize on this lock, so neither can read "under the
    // limit" and both insert one more than it allows, and neither can both
    // start a run while one is already running.
    async reserveRun(
      db: Database,
      input: { row: NewCategorySuggestionRun; limit: number; staleBefore: Date },
    ): Promise<ReserveCategorySuggestionRun> {
      return db.transaction(async (tx) => {
        await tx
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.id, scope.householdId))
          .for("no key update");
        await abandonStale(tx, input.staleBefore);
        if (await hasRunningSince(tx, input.staleBefore)) {
          return { status: "in_progress" };
        }
        const used = await countRunsOn(tx, input.row.localDay);
        if (used >= input.limit) {
          return { status: "quota_exhausted" };
        }
        const [inserted] = await tx
          .insert(categorySuggestionRun)
          .values({ householdId: scope.householdId, ...input.row })
          .returning({ id: categorySuggestionRun.id });
        if (!inserted) {
          throw new CategorySuggestionsRepositoryInvariantError(
            "category_suggestion_run insert returned no row",
          );
        }
        return { status: "reserved", id: inserted.id };
      });
    },

    async succeed(
      db: DatabaseOrTransaction,
      id: string,
      result: CategorySuggestionRunCompletion & { suggestedCount: number },
    ): Promise<void> {
      await db
        .update(categorySuggestionRun)
        .set({ status: "succeeded", completedAt: new Date(), ...result })
        .where(and(inHousehold, eq(categorySuggestionRun.id, id)));
    },

    async fail(
      db: DatabaseOrTransaction,
      id: string,
      result: CategorySuggestionRunCompletion & { failureReason: string },
    ): Promise<void> {
      await db
        .update(categorySuggestionRun)
        .set({ status: "failed", completedAt: new Date(), ...result })
        .where(and(inHousehold, eq(categorySuggestionRun.id, id)));
    },

    // Writes only rows for transaction ids this household currently owns
    // (joined through the account, never the caller's say-so): a stale or
    // foreign id is silently left out, which reads back exactly like "this
    // transaction has no suggestion" either way. Upsert on the primary key
    // replaces every column, so re-asking under a new prompt version
    // overwrites the old answer rather than keeping both.
    async saveSuggestions(
      db: DatabaseOrTransaction,
      input: {
        promptVersion: string;
        model: string;
        answers: readonly CategorySuggestionAnswerToStore[];
      },
    ): Promise<void> {
      if (input.answers.length === 0) {
        return;
      }
      const owned = await db
        .select({ id: bankTransaction.id })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .where(
          and(
            eq(bankAccount.householdId, scope.householdId),
            inArray(
              bankTransaction.id,
              input.answers.map((answer) => answer.transactionId),
            ),
          ),
        );
      const ownedIds = new Set(owned.map((row) => row.id));
      const rows = input.answers
        .filter((answer) => ownedIds.has(answer.transactionId))
        .map((answer) => ({
          householdId: scope.householdId,
          transactionId: answer.transactionId,
          productSubcategoryId: answer.subcategoryId,
          promptVersion: input.promptVersion,
          model: input.model,
        }));
      if (rows.length === 0) {
        return;
      }
      await db
        .insert(categoryAiSuggestion)
        .values(rows)
        .onConflictDoUpdate({
          target: [categoryAiSuggestion.householdId, categoryAiSuggestion.transactionId],
          set: {
            productSubcategoryId: sql`excluded.product_subcategory_id`,
            promptVersion: sql`excluded.prompt_version`,
            model: sql`excluded.model`,
            createdAt: sql`now()`,
          },
        });
    },

    // Current prompt version only, doubly scoped: this household's own rows,
    // for a transaction whose account is currently assigned to it. The
    // returned map's keys double as "already asked" for the batcher — a row
    // with a null product_subcategory_id still counts as asked.
    async readSuggestions(
      db: DatabaseOrTransaction,
      promptVersion: string,
    ): Promise<ReadonlyMap<string, SubcategoryRef | null>> {
      const rows = await db
        .select({
          transactionId: categoryAiSuggestion.transactionId,
          productSubcategoryId: categoryAiSuggestion.productSubcategoryId,
        })
        .from(categoryAiSuggestion)
        .innerJoin(bankTransaction, eq(bankTransaction.id, categoryAiSuggestion.transactionId))
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .where(
          and(
            eq(categoryAiSuggestion.householdId, scope.householdId),
            eq(bankAccount.householdId, scope.householdId),
            eq(categoryAiSuggestion.promptVersion, promptVersion),
          ),
        );
      const result = new Map<string, SubcategoryRef | null>();
      for (const row of rows) {
        const id = row.productSubcategoryId;
        result.set(
          row.transactionId,
          id !== null && isProductSubcategoryId(id) ? { type: "product", id } : null,
        );
      }
      return result;
    },
  };
}
