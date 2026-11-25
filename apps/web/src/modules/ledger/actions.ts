"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/platform/db/client";
import type { ActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";
import { requireHouseholdSession } from "@/modules/households";

import {
  addSubcategory,
  categorizeTransaction,
  changeSubcategoryKind,
  clearInternalTransferMark,
  deferCategorization,
  markInternalTransfer,
  removeRule,
  resetTransactionCategory,
  type CategorizeOutcome,
} from "./categorization-service";
import { t } from "./strings";
import {
  confirmAllLinks,
  confirmLink,
  dismissLink,
  undoLink,
  type ConfirmAllLinksOutcome,
  type LinkOutcome,
} from "./transaction-link-service";
import {
  addSubcategoryFormSchema,
  categorizeTransactionFormSchema,
  changeKindFormSchema,
  confirmAllLinksFormSchema,
  confirmLinkFormSchema,
  linkPairFormSchema,
  RULE_PATTERN_MAX_LENGTH,
  RULE_PATTERN_MIN_LENGTH,
  ruleIdFormSchema,
  transactionIdFormSchema,
  transferMarkFormSchema,
} from "./validation";

// Every signed-in screen carries the uncategorized notice from the layout,
// so a categorization refreshes the whole shell, not only the ledger pages.
function revalidateLedger(): void {
  revalidatePath("/", "layout");
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

function stateForLink(outcome: LinkOutcome, success: string): ActionState {
  switch (outcome.status) {
    case "ok":
      revalidateLedger();
      return { status: "success", message: success };
    case "not_found":
      return { status: "error", message: t.errors.linkNotFound };
    case "failed":
      return { status: "error", message: t.errors.failed };
  }
}

function confirmAllLinksMessage(confirmedCount: number, requestedCount: number): string {
  if (confirmedCount < requestedCount) {
    return interpolateAll(t.links.confirmedPartial, {
      confirmed: String(confirmedCount),
      requested: String(requestedCount),
    });
  }
  return confirmedCount === 1
    ? t.links.confirmedOne
    : interpolateAll(t.links.confirmedMany, { count: String(confirmedCount) });
}

function stateForConfirmAllLinks(outcome: ConfirmAllLinksOutcome): ActionState {
  switch (outcome.status) {
    case "ok":
      revalidateLedger();
      return {
        status: "success",
        message: confirmAllLinksMessage(outcome.confirmedCount, outcome.requestedCount),
      };
    case "not_found":
      return { status: "error", message: t.errors.linksNotFound };
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
    onlyThisAmount: formData.get("onlyThisAmount") === "on" ? "on" : "off",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.some((issue) => issue.path[0] === "pattern")
        ? interpolateAll(t.errors.invalidPattern, {
            min: String(RULE_PATTERN_MIN_LENGTH),
            max: String(RULE_PATTERN_MAX_LENGTH),
          })
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

export async function setTransferMarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transferMarkFormSchema.safeParse({
    transactionId: formData.get("transactionId"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateFor(
    await markInternalTransfer(parsed.data.transactionId, parsed.data.value, session, getDb()),
    parsed.data.value ? t.categorize.transfer.marked : t.categorize.transfer.unmarked,
  );
}

export async function clearTransferMarkAction(
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
    await clearInternalTransferMark(parsed.data.transactionId, session, getDb()),
    t.categorize.transfer.cleared,
  );
}

export async function deferCategorizationAction(
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
    await deferCategorization(parsed.data.transactionId, session, getDb()),
    t.guided.deferred,
  );
}

export async function confirmLinkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = confirmLinkFormSchema.safeParse({
    debitTransactionId: formData.get("debitTransactionId"),
    creditTransactionId: formData.get("creditTransactionId"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateForLink(await confirmLink(parsed.data, session, getDb()), t.links.confirmed);
}

export async function confirmAllLinksAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = confirmAllLinksFormSchema.safeParse({
    kind: formData.get("kind"),
    debitTransactionIds: formData.get("debitTransactionIds"),
    creditTransactionIds: formData.get("creditTransactionIds"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateForConfirmAllLinks(await confirmAllLinks(parsed.data, session, getDb()));
}

export async function dismissLinkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = linkPairFormSchema.safeParse({
    debitTransactionId: formData.get("debitTransactionId"),
    creditTransactionId: formData.get("creditTransactionId"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }
  const session = await requireHouseholdSession();
  return stateForLink(await dismissLink(parsed.data, session, getDb()), t.links.dismissed);
}

export async function undoLinkAction(
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
  return stateForLink(
    await undoLink(parsed.data.transactionId, session, getDb()),
    t.categorize.link.undone,
  );
}
