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
  keepAccountTypeOverride,
  keepCriterionOverride,
  removeAccountTypeOverride,
  removeCriterionOverride,
  resetHouseholdCriteriaWeights,
  saveAccountTypeOverride,
  saveCriterionOverride,
  setHouseholdAccountTypeFilter,
  setHouseholdCriteriaWeights,
} from "./service";
import { t } from "./strings";
import {
  accountTypeOverrideTargetSchema,
  overrideDecisionSchema,
  overrideTargetSchema,
  parseAccountTypeFilterForm,
  parseAccountTypeOverrideForm,
  parseComparisonSettingsForm,
  parseOverrideForm,
  type OverrideDecision,
} from "./validation";

import type { AccountType, BankProfileCriterion } from "@feudo/core";
import { isoDateSchema } from "@feudo/core/reference-data";
import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

// Every write on the Bancos screens is the owner's or an admin's, checked on
// the server against the session's household (CLAUDE.md, security).
async function managerContext(): Promise<{ scope: HouseholdScope; db: Database } | null> {
  const session = await requireHouseholdSession();
  const db = getDb();
  return canManageHouseholdSettings(await getViewerRole(session, db))
    ? { scope: householdScope(session), db }
    : null;
}

const NOT_ALLOWED: ActionState = { status: "error", message: t.errors.notAllowed };

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

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const outcome = await setHouseholdCriteriaWeights(
    context.scope,
    { levels: parsed.levels, options: parsed.options },
    context.db,
  );
  switch (outcome.status) {
    case "ok":
      revalidatePath("/bancos");
      return { status: "success", message: t.saved };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function updateAccountTypeFilterAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAccountTypeFilterForm(formData);
  if (parsed.status === "invalid") {
    return { status: "error", message: t.errors.invalidInput };
  }

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const outcome = await setHouseholdAccountTypeFilter(context.scope, parsed.value, context.db);
  switch (outcome.status) {
    case "ok":
      revalidatePath("/bancos");
      return { status: "success", message: t.saved };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function resetCriteriaWeightsAction(): Promise<ActionState> {
  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const outcome = await resetHouseholdCriteriaWeights(context.scope, context.db);
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

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const outcome = await saveCriterionOverride(context.scope, parsed.value, context.db);
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
  criterion: BankProfileCriterion,
  decision: OverrideDecision,
  seenReviewedAt: string,
): Promise<ActionState> {
  const target = overrideTargetSchema.safeParse({ institutionId, criterion });
  const seen = isoDateSchema.safeParse(seenReviewedAt);
  const chosen = overrideDecisionSchema.safeParse(decision);
  if (!target.success || !seen.success || !chosen.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const { scope, db } = context;
  const outcome =
    chosen.data === "useReference"
      ? await removeCriterionOverride(scope, target.data, db)
      : await keepCriterionOverride(scope, target.data, seen.data, db);
  switch (outcome.status) {
    case "ok":
      revalidateBank(target.data.institutionId);
      return {
        status: "success",
        message: chosen.data === "useReference" ? t.override.removed : t.override.kept,
      };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function saveAccountTypeOverrideAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAccountTypeOverrideForm(formData);
  switch (parsed.status) {
    case "invalid":
      return { status: "error", message: t.errors.invalidInput };
    case "invalid_source":
      return { status: "error", message: t.accountTypes.invalidSource };
    case "ok":
      break;
  }

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const outcome = await saveAccountTypeOverride(context.scope, parsed.value, context.db);
  switch (outcome.status) {
    case "ok":
      revalidateBank(parsed.value.institutionId);
      return { status: "success", message: t.accountTypes.saved };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

// One action for both answers to "Feudo has a newer review", mirroring
// resolveCriterionOverrideAction above for an account-type correction.
export async function resolveAccountTypeOverrideAction(
  institutionId: string,
  accountType: AccountType,
  decision: OverrideDecision,
  seenReviewedAt: string,
): Promise<ActionState> {
  const target = accountTypeOverrideTargetSchema.safeParse({ institutionId, accountType });
  const seen = isoDateSchema.safeParse(seenReviewedAt);
  const chosen = overrideDecisionSchema.safeParse(decision);
  if (!target.success || !seen.success || !chosen.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const context = await managerContext();
  if (context === null) return NOT_ALLOWED;

  const { scope, db } = context;
  const outcome =
    chosen.data === "useReference"
      ? await removeAccountTypeOverride(scope, target.data, db)
      : await keepAccountTypeOverride(scope, target.data, seen.data, db);
  switch (outcome.status) {
    case "ok":
      revalidateBank(target.data.institutionId);
      return {
        status: "success",
        message: chosen.data === "useReference" ? t.accountTypes.removed : t.accountTypes.kept,
      };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}
