import type { SimpleOutcome } from "@/lib/outcome";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import type { Database, DatabaseOrTransaction } from "@/platform/db/client";

import {
  createCategorizationRepository,
  type CategorizationRepository,
  type SaveRuleResult,
} from "./categorization-repository";
import type {
  AddSubcategoryFormInput,
  CategorizeTransactionFormInput,
  ChangeKindFormInput,
} from "./validation";

export type CategorizeOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

class CategorizeRollback extends Error {
  constructor(readonly status: "not_found" | "failed") {
    super(status);
  }
}

type RuleInput = Extract<CategorizeTransactionFormInput, { createRule: "on" }>;

// The amount an "only this amount" rule is bound to is the transaction's
// own, with its currency, read here under the household's scope: a form
// field would let a member bind the rule to any amount they typed. A
// transaction of zero has no amount to bind to, so it gets its category and
// no rule.
async function saveRuleFor(
  repository: CategorizationRepository,
  tx: DatabaseOrTransaction,
  input: RuleInput,
  userId: string,
): Promise<SaveRuleResult> {
  const rule = {
    pattern: input.pattern,
    direction: input.direction,
    subcategory: input.subcategory,
  };
  if (input.onlyThisAmount !== "on") {
    return repository.saveRule(tx, { ...rule, amount: null }, userId);
  }
  const amount = await repository.absoluteAmountOf(tx, input.transactionId);
  if (amount === null) {
    return "not_found";
  }
  if (amount.amountCentavos === 0) {
    return "ok";
  }
  return repository.saveRule(tx, { ...rule, amount }, userId);
}

// The manual choice and the rule land together or not at all: a member who
// asked for both should never find the transaction moved while the rule they
// meant for its siblings silently failed.
export async function categorizeTransaction(
  input: CategorizeTransactionFormInput,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  const repository = createCategorizationRepository(householdScope(session));
  try {
    return await db.transaction(async (tx) => {
      const manual = await repository.setManual(
        tx,
        input.transactionId,
        input.subcategory,
        session.userId,
      );
      if (manual === "not_found") {
        return { status: "not_found" as const };
      }
      // A member who picks a category after marking the transaction must see
      // that category, not the mark's forced "transfer" kind (design
      // contract's precedence: mark would otherwise outrank this choice).
      await repository.clearTransferMark(tx, input.transactionId);
      if (input.createRule === "on") {
        const saved = await saveRuleFor(repository, tx, input, session.userId);
        if (saved !== "ok") {
          throw new CategorizeRollback(saved === "not_found" ? "not_found" : "failed");
        }
      }
      return { status: "ok" as const };
    });
  } catch (error) {
    return { status: error instanceof CategorizeRollback ? error.status : "failed" };
  }
}

export async function resetTransactionCategory(
  transactionId: string,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).clearManual(
      db,
      transactionId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export type AddSubcategoryOutcome = SimpleOutcome<"ok" | "duplicate" | "failed">;

export async function addSubcategory(
  input: AddSubcategoryFormInput,
  session: HouseholdSession,
  db: Database,
): Promise<AddSubcategoryOutcome> {
  try {
    const outcome = await createCategorizationRepository(
      householdScope(session),
    ).addHouseholdSubcategory(db, input);
    return { status: outcome.status };
  } catch {
    return { status: "failed" };
  }
}

export async function changeSubcategoryKind(
  input: ChangeKindFormInput,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).setKind(
      db,
      input.subcategory,
      input.kind,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export async function removeRule(
  ruleId: string,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).deleteRule(
      db,
      ruleId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export async function markInternalTransfer(
  transactionId: string,
  value: boolean,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).setTransferMark(
      db,
      transactionId,
      value,
      session.userId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export async function clearInternalTransferMark(
  transactionId: string,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).clearTransferMark(
      db,
      transactionId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}

export async function deferCategorization(
  transactionId: string,
  session: HouseholdSession,
  db: Database,
): Promise<CategorizeOutcome> {
  try {
    const status = await createCategorizationRepository(householdScope(session)).defer(
      db,
      transactionId,
    );
    return { status };
  } catch {
    return { status: "failed" };
  }
}
