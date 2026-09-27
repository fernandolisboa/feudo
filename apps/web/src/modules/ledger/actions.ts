"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/platform/db/client";
import type { ActionState } from "@/lib/action-state";
import { requireHouseholdSession } from "@/modules/households";

import {
  addSubcategory,
  categorizeTransaction,
  changeSubcategoryKind,
  removeRule,
  resetTransactionCategory,
  type CategorizeOutcome,
} from "./categorization-service";
import { t } from "./strings";
import {
  addSubcategoryFormSchema,
  categorizeTransactionFormSchema,
  changeKindFormSchema,
  ruleIdFormSchema,
  transactionIdFormSchema,
} from "./validation";

function revalidateLedger(): void {
  revalidatePath("/transacoes");
  revalidatePath("/categorias");
}

function stateFor(outcome: CategorizeOutcome, success: string): ActionState {
  switch (outcome.status) {
    case "ok":
      revalidateLedger();
      return { status: "success", message: success };
    case "not_found":
      return { status: "error", message: t.errors.notFound };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function categorizeTransactionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorizeTransactionFormSchema.safeParse({
    transactionId: formData.get("transactionId"),
    subcategory: formData.get("subcategory"),
    createRule: formData.get("createRule") === "on" ? "on" : "off",
    pattern: formData.get("pattern"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.some((issue) => issue.path[0] === "pattern")
        ? t.errors.invalidPattern
        : t.errors.invalidInput,
    };
  }
  const session = await requireHouseholdSession();
  return stateFor(await categorizeTransaction(parsed.data, session, getDb()), t.categorize.saved);
}

export async function resetTransactionCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionIdFormSchema.safeParse({
    transactionId: formData.get("transactionId"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateFor(
    await resetTransactionCategory(parsed.data.transactionId, session, getDb()),
    t.categorize.resetDone,
  );
}

export async function addSubcategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addSubcategoryFormSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  const outcome = await addSubcategory(parsed.data, session, getDb());

  switch (outcome.status) {
    case "ok":
      revalidateLedger();
      return { status: "success", message: t.categoriesPage.addDialog.added };
    case "duplicate":
      return { status: "error", message: t.errors.duplicateSubcategory };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

export async function changeSubcategoryKindAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changeKindFormSchema.safeParse({
    subcategory: formData.get("subcategory"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateFor(
    await changeSubcategoryKind(parsed.data, session, getDb()),
    t.categoriesPage.kindChanged,
  );
}

export async function removeRuleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ruleIdFormSchema.safeParse({ ruleId: formData.get("ruleId") });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateFor(await removeRule(parsed.data.ruleId, session, getDb()), t.rules.removed);
}
