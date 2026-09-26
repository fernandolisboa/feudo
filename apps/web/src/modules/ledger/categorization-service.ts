import type { SimpleOutcome } from "@/lib/outcome";
import type { HouseholdSession } from "@/modules/households";
import { householdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";

import { createCategorizationRepository } from "./categorization-repository";
import type {
  AddSubcategoryFormInput,
  CategorizeTransactionFormInput,
  ChangeKindFormInput,
} from "./validation";

export type CategorizeOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

class RuleTargetNotFoundError extends Error {}

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
      if (input.createRule === "on") {
        const rule = await repository.saveRule(
          tx,
          { pattern: input.pattern, direction: input.direction, subcategory: input.subcategory },
          session.userId,
        );
        if (rule === "not_found") {
          throw new RuleTargetNotFoundError();
        }
      }
      return { status: "ok" as const };
    });
  } catch (error) {
    return { status: error instanceof RuleTargetNotFoundError ? "not_found" : "failed" };
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
