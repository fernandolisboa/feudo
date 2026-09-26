import { and, eq, exists } from "drizzle-orm";

import {
  isProductCategoryId,
  isProductSubcategoryId,
  productSubcategory,
  type CategorizationRule,
  type HouseholdSubcategory,
  type Kind,
  type ProductCategoryId,
  type ProductSubcategoryId,
  type SubcategoryRef,
  type TransactionDirection,
} from "@feudo/core";

import { bankAccount, bankTransaction } from "@/modules/sync/schema";
import { hasSqlState } from "@/platform/db/sql-state";

import {
  categorizationRule,
  householdSubcategory,
  subcategoryKindOverride,
  transactionCategorization,
} from "./schema";

import type { HouseholdScope } from "@/modules/households";
import type { DatabaseOrTransaction } from "@/platform/db/client";

// categorization-service.ts sets a manual choice and saves a rule in one
// transaction, so every method here runs against either handle.
type Database = DatabaseOrTransaction;

const POSTGRES_UNIQUE_VIOLATION = "23505";
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

function subcategoryTargetColumns(subcategory: SubcategoryRef): {
  productSubcategoryId: string | null;
  householdSubcategoryId: string | null;
} {
  return subcategory.type === "product"
    ? { productSubcategoryId: subcategory.id, householdSubcategoryId: null }
    : { productSubcategoryId: null, householdSubcategoryId: subcategory.id };
}

// transaction_categorization has no household_id of its own (it travels with
// the account, ADR-0001): a household ref names its owning household in
// subcategoryHouseholdId, purely so the composite foreign key can validate it
// against household_subcategory. Only the writer's own household ever goes
// in that column, since ownsTarget already refused any other household's id.
function transactionCategorizationTargetColumns(
  subcategory: SubcategoryRef,
  householdId: string,
): {
  productSubcategoryId: string | null;
  householdSubcategoryId: string | null;
  subcategoryHouseholdId: string | null;
} {
  return subcategory.type === "product"
    ? {
        productSubcategoryId: subcategory.id,
        householdSubcategoryId: null,
        subcategoryHouseholdId: null,
      }
    : {
        productSubcategoryId: null,
        householdSubcategoryId: subcategory.id,
        subcategoryHouseholdId: householdId,
      };
}

export function subcategoryRefFrom(
  productSubcategoryId: string | null,
  householdSubcategoryId: string | null,
): SubcategoryRef | null {
  if (householdSubcategoryId) {
    return { type: "household", id: householdSubcategoryId };
  }
  if (productSubcategoryId && isProductSubcategoryId(productSubcategoryId)) {
    return { type: "product", id: productSubcategoryId };
  }
  return null;
}

// A manual choice travels with the transaction's account (ADR-0001), but a
// household ref only resolves while the reading household is the one that
// pointed it there; once the account moves elsewhere, the destination's own
// rules and defaults take over instead (schema.ts's why-comment on the
// table). A product ref has no owner and resolves for whoever reads it.
export function manualSubcategoryRefFrom(
  productSubcategoryId: string | null,
  householdSubcategoryId: string | null,
  subcategoryHouseholdId: string | null,
  viewerHouseholdId: string,
): SubcategoryRef | null {
  if (productSubcategoryId && isProductSubcategoryId(productSubcategoryId)) {
    return { type: "product", id: productSubcategoryId };
  }
  if (householdSubcategoryId && subcategoryHouseholdId === viewerHouseholdId) {
    return { type: "household", id: householdSubcategoryId };
  }
  return null;
}

export type AddHouseholdSubcategoryInput = {
  categoryId: ProductCategoryId;
  name: string;
  kind: Kind;
};
export type AddHouseholdSubcategoryResult = { status: "ok"; id: string } | { status: "duplicate" };

export type SaveRuleInput = {
  pattern: string;
  direction: TransactionDirection | null;
  subcategory: SubcategoryRef;
};

// Household-scoped (ADR-0001): every query below is filtered by
// scope.householdId, and no method accepts a household id. The composite
// foreign keys on categorization_rule and transaction_categorization
// (schema.ts) already refuse a household ref that isn't this household's
// own household_subcategory; this repository turns that database refusal
// into "not_found" instead of letting the constraint violation escape.
export function createCategorizationRepository(scope: HouseholdScope) {
  // Checked before writing rather than left to the composite foreign key
  // alone: inside categorization-service's transaction a constraint error
  // would abort the whole transaction, so the refusal must come first.
  async function ownsTarget(db: Database, subcategory: SubcategoryRef): Promise<boolean> {
    if (subcategory.type === "product") {
      return true;
    }
    const rows = await db
      .select({ id: householdSubcategory.id })
      .from(householdSubcategory)
      .where(
        and(
          eq(householdSubcategory.id, subcategory.id),
          eq(householdSubcategory.householdId, scope.householdId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  return {
    async listHouseholdSubcategories(db: Database): Promise<HouseholdSubcategory[]> {
      const rows = await db
        .select({
          id: householdSubcategory.id,
          categoryId: householdSubcategory.categoryId,
          name: householdSubcategory.name,
          kind: householdSubcategory.kind,
        })
        .from(householdSubcategory)
        .where(eq(householdSubcategory.householdId, scope.householdId))
        .orderBy(householdSubcategory.categoryId, householdSubcategory.name);
      return rows.filter((row): row is typeof row & { categoryId: ProductCategoryId } =>
        isProductCategoryId(row.categoryId),
      );
    },

    async addHouseholdSubcategory(
      db: Database,
      input: AddHouseholdSubcategoryInput,
    ): Promise<AddHouseholdSubcategoryResult> {
      try {
        const [row] = await db
          .insert(householdSubcategory)
          .values({ householdId: scope.householdId, ...input })
          .returning({ id: householdSubcategory.id });
        if (!row) {
          throw new Error("household_subcategory insert returned no row");
        }
        return { status: "ok", id: row.id };
      } catch (error) {
        if (hasSqlState(error, POSTGRES_UNIQUE_VIOLATION)) {
          return { status: "duplicate" };
        }
        throw error;
      }
    },

    async listKindOverrides(db: Database): Promise<Map<ProductSubcategoryId, Kind>> {
      const rows = await db
        .select({
          productSubcategoryId: subcategoryKindOverride.productSubcategoryId,
          kind: subcategoryKindOverride.kind,
        })
        .from(subcategoryKindOverride)
        .where(eq(subcategoryKindOverride.householdId, scope.householdId));
      const overrides = new Map<ProductSubcategoryId, Kind>();
      for (const row of rows) {
        if (isProductSubcategoryId(row.productSubcategoryId)) {
          overrides.set(row.productSubcategoryId, row.kind);
        }
      }
      return overrides;
    },

    async setKind(db: Database, ref: SubcategoryRef, kind: Kind): Promise<"ok" | "not_found"> {
      if (ref.type === "product") {
        if (productSubcategory(ref.id).kind === kind) {
          await db
            .delete(subcategoryKindOverride)
            .where(
              and(
                eq(subcategoryKindOverride.householdId, scope.householdId),
                eq(subcategoryKindOverride.productSubcategoryId, ref.id),
              ),
            );
          return "ok";
        }
        await db
          .insert(subcategoryKindOverride)
          .values({ householdId: scope.householdId, productSubcategoryId: ref.id, kind })
          .onConflictDoUpdate({
            target: [
              subcategoryKindOverride.householdId,
              subcategoryKindOverride.productSubcategoryId,
            ],
            set: { kind },
          });
        return "ok";
      }

      const updated = await db
        .update(householdSubcategory)
        .set({ kind })
        .where(
          and(
            eq(householdSubcategory.id, ref.id),
            eq(householdSubcategory.householdId, scope.householdId),
          ),
        )
        .returning({ id: householdSubcategory.id });
      return updated.length > 0 ? "ok" : "not_found";
    },

    async listRules(db: Database): Promise<CategorizationRule[]> {
      const rows = await db
        .select({
          id: categorizationRule.id,
          pattern: categorizationRule.pattern,
          direction: categorizationRule.direction,
          productSubcategoryId: categorizationRule.productSubcategoryId,
          householdSubcategoryId: categorizationRule.householdSubcategoryId,
          createdAt: categorizationRule.createdAt,
        })
        .from(categorizationRule)
        .where(eq(categorizationRule.householdId, scope.householdId));

      const rules: CategorizationRule[] = [];
      for (const row of rows) {
        const subcategory = subcategoryRefFrom(
          row.productSubcategoryId,
          row.householdSubcategoryId,
        );
        if (!subcategory) {
          continue;
        }
        rules.push({
          id: row.id,
          pattern: row.pattern,
          direction: row.direction,
          subcategory,
          createdAt: row.createdAt,
        });
      }
      return rules;
    },

    async saveRule(
      db: Database,
      input: SaveRuleInput,
      userId: string,
    ): Promise<"ok" | "not_found"> {
      if (!(await ownsTarget(db, input.subcategory))) {
        return "not_found";
      }
      const target = subcategoryTargetColumns(input.subcategory);
      try {
        await db
          .insert(categorizationRule)
          .values({
            householdId: scope.householdId,
            pattern: input.pattern,
            direction: input.direction,
            createdByUserId: userId,
            ...target,
          })
          .onConflictDoUpdate({
            target: [
              categorizationRule.householdId,
              categorizationRule.pattern,
              categorizationRule.direction,
            ],
            set: { createdByUserId: userId, createdAt: new Date(), ...target },
          });
        return "ok";
      } catch (error) {
        if (hasSqlState(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
          return "not_found";
        }
        throw error;
      }
    },

    async deleteRule(db: Database, ruleId: string): Promise<"ok" | "not_found"> {
      const deleted = await db
        .delete(categorizationRule)
        .where(
          and(
            eq(categorizationRule.id, ruleId),
            eq(categorizationRule.householdId, scope.householdId),
          ),
        )
        .returning({ id: categorizationRule.id });
      return deleted.length > 0 ? "ok" : "not_found";
    },

    async setManual(
      db: Database,
      transactionId: string,
      subcategory: SubcategoryRef,
      userId: string,
    ): Promise<"ok" | "not_found"> {
      const owned = await db
        .select({ id: bankTransaction.id })
        .from(bankTransaction)
        .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
        .where(
          and(
            eq(bankTransaction.id, transactionId),
            eq(bankAccount.householdId, scope.householdId),
          ),
        )
        .limit(1);
      if (owned.length === 0 || !(await ownsTarget(db, subcategory))) {
        return "not_found";
      }

      const target = transactionCategorizationTargetColumns(subcategory, scope.householdId);
      try {
        await db
          .insert(transactionCategorization)
          .values({
            transactionId,
            categorizedByUserId: userId,
            ...target,
          })
          .onConflictDoUpdate({
            target: [transactionCategorization.transactionId],
            set: { categorizedByUserId: userId, categorizedAt: new Date(), ...target },
          });
        return "ok";
      } catch (error) {
        if (hasSqlState(error, POSTGRES_FOREIGN_KEY_VIOLATION)) {
          return "not_found";
        }
        throw error;
      }
    },

    // Deletes only when the transaction's account is currently assigned to
    // this household (same check as setManual): the row itself carries no
    // household id to filter on, since the manual choice travels with the
    // account rather than staying with the household that made it.
    async clearManual(db: Database, transactionId: string): Promise<"ok" | "not_found"> {
      const deleted = await db
        .delete(transactionCategorization)
        .where(
          and(
            eq(transactionCategorization.transactionId, transactionId),
            exists(
              db
                .select({ id: bankTransaction.id })
                .from(bankTransaction)
                .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
                .where(
                  and(
                    eq(bankTransaction.id, transactionCategorization.transactionId),
                    eq(bankAccount.householdId, scope.householdId),
                  ),
                ),
            ),
          ),
        )
        .returning({ transactionId: transactionCategorization.transactionId });
      return deleted.length > 0 ? "ok" : "not_found";
    },
  };
}

export type CategorizationRepository = ReturnType<typeof createCategorizationRepository>;
