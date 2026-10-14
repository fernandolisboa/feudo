import {
  DEFAULT_COMPARISON_SETTINGS,
  DEFAULT_WEIGHT_LEVELS,
  resolveComparisonSettings,
  resolveCriteriaWeights,
  type ComparisonSettings,
  type WeightLevels,
} from "@feudo/core";
import { matchInstitutionByLabel } from "@feudo/core/reference-data";

import type { HouseholdScope } from "@/modules/households";

import { errorName } from "@/lib/error-name";
import type { SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import { referenceProfileOf } from "./bank-profiles";
import {
  createCriteriaWeightsRepository,
  createCriterionOverridesRepository,
  listHouseholdInstitutionLabels,
} from "./repository";
import type { StoredSettings } from "./repository";
import type { OverrideForm, OverrideTarget, StoredOverride } from "./validation";

export type HouseholdComparisonSettings = {
  levels: WeightLevels;
  options: ComparisonSettings;
  isCustom: boolean;
};

export async function getHouseholdCriteriaWeights(
  scope: HouseholdScope,
  db: Database,
): Promise<HouseholdComparisonSettings> {
  const stored = await createCriteriaWeightsRepository(scope).get(db);
  switch (stored.status) {
    case "none":
      return {
        levels: DEFAULT_WEIGHT_LEVELS,
        options: DEFAULT_COMPARISON_SETTINGS,
        isCustom: false,
      };
    case "unreadable":
      console.warn("banking-intel: stored criteria weights failed validation; using defaults");
      return {
        levels: DEFAULT_WEIGHT_LEVELS,
        options: DEFAULT_COMPARISON_SETTINGS,
        isCustom: false,
      };
    case "found": {
      if (stored.options.status === "unreadable") {
        console.warn("banking-intel: stored comparison options failed validation; using defaults");
      } else if (stored.options.status === "found" && stored.options.droppedFields.length > 0) {
        console.warn(
          `banking-intel: dropped invalid comparison option fields: ${stored.options.droppedFields.join(", ")}`,
        );
      }
      const options = stored.options.status === "found" ? stored.options.value : {};
      return {
        levels: resolveCriteriaWeights(stored.levels),
        options: resolveComparisonSettings(options),
        isCustom: true,
      };
    }
  }
}

export type SaveCriteriaWeightsOutcome = SimpleOutcome<"ok" | "failed">;

export async function setHouseholdCriteriaWeights(
  scope: HouseholdScope,
  settings: StoredSettings,
  db: Database,
): Promise<SaveCriteriaWeightsOutcome> {
  try {
    await createCriteriaWeightsRepository(scope).save(db, settings);
    return { status: "ok" };
  } catch (error) {
    console.warn(`banking-intel: saving criteria weights failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export async function resetHouseholdCriteriaWeights(
  scope: HouseholdScope,
  db: Database,
): Promise<SaveCriteriaWeightsOutcome> {
  try {
    await createCriteriaWeightsRepository(scope).clear(db);
    return { status: "ok" };
  } catch (error) {
    console.warn(`banking-intel: resetting criteria weights failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export type HouseholdInstitutions = {
  hasAccounts: boolean;
  institutionIds: string[];
  unrecognizedLabels: string[];
};

export async function getHouseholdInstitutions(
  scope: HouseholdScope,
  db: Database,
): Promise<HouseholdInstitutions> {
  const labels = await listHouseholdInstitutionLabels(db, scope);
  const institutionIds = new Set<string>();
  const unrecognizedLabels: string[] = [];
  for (const label of labels) {
    const id = matchInstitutionByLabel(label);
    if (id === null) {
      unrecognizedLabels.push(label);
    } else {
      institutionIds.add(id);
    }
  }
  return {
    hasAccounts: labels.length > 0,
    institutionIds: [...institutionIds],
    unrecognizedLabels,
  };
}

export async function getHouseholdOverrides(
  scope: HouseholdScope,
  db: Database,
): Promise<StoredOverride[]> {
  const { overrides, skipped } = await createCriterionOverridesRepository(scope).list(db);
  if (skipped > 0) {
    console.warn(`banking-intel: skipped ${String(skipped)} unreadable criterion overrides`);
  }
  return overrides;
}

export type OverrideWriteOutcome = SimpleOutcome<"ok" | "failed">;

// The reference date an override answers to is always read here from the
// shipped data, never taken from the form, so a household cannot silence a
// reference update it has not seen.
function referenceReviewedAt(target: OverrideTarget): string | null {
  return referenceProfileOf(target.institutionId)?.criteria[target.criterion].reviewedAt ?? null;
}

export async function saveCriterionOverride(
  scope: HouseholdScope,
  form: OverrideForm,
  db: Database,
): Promise<OverrideWriteOutcome> {
  const baseReviewedAt = referenceReviewedAt(form);
  if (baseReviewedAt === null) return { status: "failed" };
  try {
    await createCriterionOverridesRepository(scope).save(db, { ...form, baseReviewedAt });
    return { status: "ok" };
  } catch (error) {
    console.warn(`banking-intel: saving a criterion override failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export async function removeCriterionOverride(
  scope: HouseholdScope,
  target: OverrideTarget,
  db: Database,
): Promise<OverrideWriteOutcome> {
  try {
    await createCriterionOverridesRepository(scope).remove(db, target);
    return { status: "ok" };
  } catch (error) {
    console.warn(`banking-intel: removing a criterion override failed (${errorName(error)})`);
    return { status: "failed" };
  }
}

export async function keepCriterionOverride(
  scope: HouseholdScope,
  target: OverrideTarget,
  db: Database,
): Promise<OverrideWriteOutcome> {
  const baseReviewedAt = referenceReviewedAt(target);
  if (baseReviewedAt === null) return { status: "failed" };
  try {
    const found = await createCriterionOverridesRepository(scope).rebase(
      db,
      target,
      baseReviewedAt,
    );
    return { status: found ? "ok" : "failed" };
  } catch (error) {
    console.warn(`banking-intel: keeping a criterion override failed (${errorName(error)})`);
    return { status: "failed" };
  }
}
