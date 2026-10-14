"use server";

import { revalidatePath } from "next/cache";

import {
  canManageHouseholdSettings,
  getViewerRole,
  householdScope,
  requireHouseholdSession,
} from "@/modules/households";

import type { ActionState } from "@/lib/action-state";
import { getDb } from "@/platform/db/client";
import {
  keepCriterionOverride,
  removeCriterionOverride,
  resetHouseholdCriteriaWeights,
  saveCriterionOverride,
  setHouseholdCriteriaWeights,
} from "./service";
import { t } from "./strings";
import { overrideTargetSchema, parseComparisonSettingsForm, parseOverrideForm } from "./validation";

export async function updateComparisonSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseComparisonSettingsForm(formData);
  switch (parsed.status) {
    case "invalid":
      return { status: "error", message: t.errors.invalidInput };
    case "all_zero":
      return { status: "error", message: t.errors.allZero };
    case "ok":
      break;
  }

  const session = await requireHouseholdSession();
  const db = getDb();
  if (!canManageHouseholdSettings(await getViewerRole(session, db))) {
    return { status: "error", message: t.errors.notAllowed };
  }

  const outcome = await setHouseholdCriteriaWeights(
    householdScope(session),
    { levels: parsed.levels, options: parsed.options },
    db,
  );
  switch (outcome.status) {
    case "ok":
      revalidatePath("/bancos");
      return { status: "success", message: t.saved };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function resetCriteriaWeightsAction(): Promise<ActionState> {
  const session = await requireHouseholdSession();
  const db = getDb();
  if (!canManageHouseholdSettings(await getViewerRole(session, db))) {
    return { status: "error", message: t.errors.notAllowed };
  }

  const outcome = await resetHouseholdCriteriaWeights(householdScope(session), db);
  switch (outcome.status) {
    case "ok":
      revalidatePath("/bancos");
      return { status: "success", message: t.resetDone };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

function revalidateBank(institutionId: string): void {
  revalidatePath("/bancos");
  revalidatePath(`/bancos/${institutionId}`);
}

export async function saveCriterionOverrideAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseOverrideForm(formData);
  switch (parsed.status) {
    case "invalid":
      return { status: "error", message: t.errors.invalidInput };
    case "invalid_source":
      return { status: "error", message: t.override.invalidSource };
    case "ok":
      break;
  }

  const session = await requireHouseholdSession();
  const db = getDb();
  if (!canManageHouseholdSettings(await getViewerRole(session, db))) {
    return { status: "error", message: t.errors.notAllowed };
  }

  const outcome = await saveCriterionOverride(householdScope(session), parsed.value, db);
  switch (outcome.status) {
    case "ok":
      revalidateBank(parsed.value.institutionId);
      return { status: "success", message: t.override.saved };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

// One action for both answers to "Feudo has a newer review": dropping the
// household's correction and keeping it are the same authorization and the
// same target, they differ only in what is written.
export async function resolveCriterionOverrideAction(
  institutionId: string,
  criterion: string,
  decision: string,
): Promise<ActionState> {
  const target = overrideTargetSchema.safeParse({ institutionId, criterion });
  if (!target.success || (decision !== "useReference" && decision !== "keepOwn")) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const session = await requireHouseholdSession();
  const db = getDb();
  if (!canManageHouseholdSettings(await getViewerRole(session, db))) {
    return { status: "error", message: t.errors.notAllowed };
  }

  const scope = householdScope(session);
  const outcome =
    decision === "useReference"
      ? await removeCriterionOverride(scope, target.data, db)
      : await keepCriterionOverride(scope, target.data, db);
  switch (outcome.status) {
    case "ok":
      revalidateBank(target.data.institutionId);
      return {
        status: "success",
        message: decision === "useReference" ? t.override.removed : t.override.kept,
      };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}
