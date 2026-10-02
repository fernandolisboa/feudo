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
import { resetHouseholdCriteriaWeights, setHouseholdCriteriaWeights } from "./service";
import { t } from "./strings";
import { parseCriteriaWeightsForm } from "./validation";

export async function updateCriteriaWeightsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCriteriaWeightsForm(formData);
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

  const outcome = await setHouseholdCriteriaWeights(householdScope(session), parsed.weights, db);
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
