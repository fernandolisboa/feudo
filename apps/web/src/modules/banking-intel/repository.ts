import { and, eq } from "drizzle-orm";

import { bankAccount, bankConnection } from "@/modules/sync/schema";

import { bankCriteriaWeights, bankCriterionOverride } from "./schema";
import {
  isReadableComparisonOptions,
  parseStoredComparisonOptions,
  storedOverrideSchema,
  storedWeightLevelsSchema,
  type OverrideTarget,
  type StoredComparisonOptions,
  type StoredOverride,
  type StoredWeightLevels,
} from "./validation";

import type { WeightLevels } from "@feudo/core";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

// A household that never touched the comparison settings has no options
// stored at all (absent, not worth a warning); one whose column holds
// something that is not even options-shaped is unreadable (worth one).
// droppedFields names the fields of an otherwise-readable object that failed
// validation on their own and fell back to their default (service.ts warns
// with the names only, never the household id or the invalid values).
export type StoredOptionsRead =
  | { status: "absent" }
  | { status: "unreadable" }
  | { status: "found"; value: StoredComparisonOptions; droppedFields: string[] };

export type StoredSettingsRead =
  | { status: "none" }
  | { status: "found"; levels: StoredWeightLevels; options: StoredOptionsRead }
  | { status: "unreadable" };

export type StoredSettings = { levels: WeightLevels; options: StoredComparisonOptions };

function readOptions(value: unknown): StoredOptionsRead {
  if (value === null) return { status: "absent" };
  if (!isReadableComparisonOptions(value)) return { status: "unreadable" };
  const parsed = parseStoredComparisonOptions(value);
  return { status: "found", value: parsed.value, droppedFields: parsed.droppedFields };
}

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
      return { status: "found", levels: levels.data, options: readOptions(row.options) };
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

export type OverrideWrite = OverrideTarget & {
  score: number;
  note: string;
  sourceUrl: string | null;
  baseReviewedAt: string;
};

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id.
export function createCriterionOverridesRepository(scope: HouseholdScope) {
  const ofTarget = (target: OverrideTarget) =>
    and(
      eq(bankCriterionOverride.householdId, scope.householdId),
      eq(bankCriterionOverride.institutionId, target.institutionId),
      eq(bankCriterionOverride.criterion, target.criterion),
    );

  return {
    async list(db: Database): Promise<{ overrides: StoredOverride[]; skipped: number }> {
      const rows = await db
        .select({
          institutionId: bankCriterionOverride.institutionId,
          criterion: bankCriterionOverride.criterion,
          score: bankCriterionOverride.score,
          note: bankCriterionOverride.note,
          sourceUrl: bankCriterionOverride.sourceUrl,
          baseReviewedAt: bankCriterionOverride.baseReviewedAt,
          updatedAt: bankCriterionOverride.updatedAt,
        })
        .from(bankCriterionOverride)
        .where(eq(bankCriterionOverride.householdId, scope.householdId))
        .orderBy(bankCriterionOverride.institutionId, bankCriterionOverride.criterion);
      const overrides: StoredOverride[] = [];
      for (const row of rows) {
        const parsed = storedOverrideSchema.safeParse(row);
        if (parsed.success) overrides.push(parsed.data);
      }
      return { overrides, skipped: rows.length - overrides.length };
    },

    async save(db: Database, override: OverrideWrite): Promise<void> {
      const values = {
        score: override.score,
        note: override.note,
        sourceUrl: override.sourceUrl,
        baseReviewedAt: override.baseReviewedAt,
      };
      await db
        .insert(bankCriterionOverride)
        .values({
          householdId: scope.householdId,
          institutionId: override.institutionId,
          criterion: override.criterion,
          ...values,
        })
        .onConflictDoUpdate({
          target: [
            bankCriterionOverride.householdId,
            bankCriterionOverride.institutionId,
            bankCriterionOverride.criterion,
          ],
          set: { ...values, updatedAt: new Date() },
        });
    },

    async remove(db: Database, target: OverrideTarget): Promise<void> {
      await db.delete(bankCriterionOverride).where(ofTarget(target));
    },

    // Moves only the reference date the override answers to, so keeping the
    // household's value after a reference update silences the hint until the
    // next one; the household's score, note and date are untouched.
    async rebase(db: Database, target: OverrideTarget, baseReviewedAt: string): Promise<boolean> {
      const updated = await db
        .update(bankCriterionOverride)
        .set({ baseReviewedAt })
        .where(ofTarget(target))
        .returning({ criterion: bankCriterionOverride.criterion });
      return updated.length > 0;
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
