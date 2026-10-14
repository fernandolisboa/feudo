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
import { createCriteriaWeightsRepository, listHouseholdInstitutionLabels } from "./repository";
import type { StoredSettings } from "./repository";

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
    case "found":
      if (stored.options === null) {
        console.warn(
          "banking-intel: stored comparison options missing or unreadable; using defaults",
        );
      }
      return {
        levels: resolveCriteriaWeights(stored.levels),
        options: resolveComparisonSettings(stored.options ?? {}),
        isCustom: true,
      };
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
