import { eq } from "drizzle-orm";

import { bankAccount, bankConnection } from "@/modules/sync/schema";

import { bankCriteriaWeights } from "./schema";
import { storedCriteriaWeightsSchema, type StoredCriteriaWeights } from "./validation";

import type { CriteriaWeights } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

export type StoredWeightsRead =
  | { status: "none" }
  | { status: "found"; weights: StoredCriteriaWeights }
  | { status: "unreadable" };

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id.
export function createCriteriaWeightsRepository(scope: HouseholdScope) {
  return {
    async get(db: Database): Promise<StoredWeightsRead> {
      const rows = await db
        .select({ weights: bankCriteriaWeights.weights })
        .from(bankCriteriaWeights)
        .where(eq(bankCriteriaWeights.householdId, scope.householdId))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return { status: "none" };
      }
      const parsed = storedCriteriaWeightsSchema.safeParse(row.weights);
      return parsed.success ? { status: "found", weights: parsed.data } : { status: "unreadable" };
    },

    async save(db: Database, weights: CriteriaWeights): Promise<void> {
      await db
        .insert(bankCriteriaWeights)
        .values({ householdId: scope.householdId, weights })
        .onConflictDoUpdate({
          target: bankCriteriaWeights.householdId,
          set: { weights, updatedAt: new Date() },
        });
    },

    async clear(db: Database): Promise<void> {
      await db
        .delete(bankCriteriaWeights)
        .where(eq(bankCriteriaWeights.householdId, scope.householdId));
    },
  };
}

// The labels the household's own accounts carry: each account's connection
// name, as its owner typed it (CONTEXT.md, "Bank connection"). Only accounts
// assigned to this household count, so an unassigned account or one in
// another household never says which banks this household uses.
export async function listHouseholdInstitutionLabels(
  db: Database,
  scope: HouseholdScope,
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ label: bankConnection.institutionName })
    .from(bankAccount)
    .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
    .where(eq(bankAccount.householdId, scope.householdId))
    .orderBy(bankConnection.institutionName);
  return rows.map((row) => row.label);
}
