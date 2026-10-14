import { eq } from "drizzle-orm";

import { bankAccount, bankConnection } from "@/modules/sync/schema";

import { bankCriteriaWeights } from "./schema";
import {
  storedComparisonOptionsSchema,
  storedWeightLevelsSchema,
  type StoredComparisonOptions,
  type StoredWeightLevels,
} from "./validation";

import type { WeightLevels } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

export type StoredSettingsRead =
  | { status: "none" }
  | { status: "found"; levels: StoredWeightLevels; options: StoredComparisonOptions | null }
  | { status: "unreadable" };

export type StoredSettings = { levels: WeightLevels; options: StoredComparisonOptions };

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id.
export function createCriteriaWeightsRepository(scope: HouseholdScope) {
  return {
    async get(db: Database): Promise<StoredSettingsRead> {
      const rows = await db
        .select({ weights: bankCriteriaWeights.weights, options: bankCriteriaWeights.options })
        .from(bankCriteriaWeights)
        .where(eq(bankCriteriaWeights.householdId, scope.householdId))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return { status: "none" };
      }
      const levels = storedWeightLevelsSchema.safeParse(row.weights);
      if (!levels.success) {
        return { status: "unreadable" };
      }
      if (row.options === null) {
        return { status: "found", levels: levels.data, options: null };
      }
      const options = storedComparisonOptionsSchema.safeParse(row.options);
      return {
        status: "found",
        levels: levels.data,
        options: options.success ? options.data : null,
      };
    },

    async save(db: Database, settings: StoredSettings): Promise<void> {
      await db
        .insert(bankCriteriaWeights)
        .values({
          householdId: scope.householdId,
          weights: settings.levels,
          options: settings.options,
        })
        .onConflictDoUpdate({
          target: bankCriteriaWeights.householdId,
          set: { weights: settings.levels, options: settings.options, updatedAt: new Date() },
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
