import { localDateOf, type SubcategoryRef } from "@feudo/core";

import { getAiSuggestionCandidates, productSubcategoriesForPrompt } from "@/modules/ledger";
import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  type HouseholdScope,
  type HouseholdSession,
} from "@/modules/households";
import { recordFinancialDataAccess } from "@/modules/audit";

import { errorName } from "@/lib/error-name";
import { getDb, type Database } from "@/platform/db/client";
import { MIN_ATTEMPT_MS, type AiFailure, type CategorySuggestionPromptItem } from "./ai-client";
import { CATEGORY_SUGGESTION_MAX_GROUPS } from "./category-suggestion-limits";
import {
  createCategorySuggestionsRepository,
  type CategorySuggestionAnswerToStore,
} from "./category-suggestions-repository";
import { readAiProviderName, readEncryptionKey, type AnalysisEnv } from "./env";
import {
  categorySuggestionAnswerSchema,
  categorySuggestionOutputSchema,
  CURRENT_CATEGORY_SUGGESTER_PROMPT,
  type CategorySuggesterPrompt,
} from "./prompts";
import { createAiProvider, type AiProvider } from "./provider";
import { clientForHousehold, isAnalysisEnabled, TIMEOUT_MS } from "./service";

export const CATEGORY_SUGGESTION_RUNS_PER_DAY = 5;

// The Server Action's own time limit: the maxDuration exported by
// app/(app)/categorizar/page.tsx, which must stay in step (its page test
// pins it), the same pattern as ON_DEMAND_BUDGET_MS.
export const CATEGORY_SUGGESTION_BUDGET_MS = 60_000;

const RUN_HEADROOM_MS = 5_000;

// Longer than any call can take, so a run still "running" after this belongs
// to a function that died mid-call (same rule as service.ts's RUNNING_STALE_MS).
export const RUN_STALE_MS = 5 * 60_000;

export type CategorySuggestionDeps = {
  provider: AiProvider | null;
  encryptionKey: string | null;
  prompt: CategorySuggesterPrompt;
};

export function createCategorySuggestionDeps(
  env: AnalysisEnv = process.env,
): CategorySuggestionDeps {
  const providerName = readAiProviderName(env);
  return {
    provider: createAiProvider(providerName),
    encryptionKey: providerName === "anthropic" ? readEncryptionKey(env) : null,
    prompt: CURRENT_CATEGORY_SUGGESTER_PROMPT,
  };
}

async function householdLocalDay(db: Database, scope: HouseholdScope, now: Date): Promise<string> {
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  return localDateOf(now, timeZone);
}

export type CategorySuggestionOutcome =
  | { status: "ok"; suggestedCount: number }
  | {
      status:
        | "disabled"
        | "nothing_to_suggest"
        | "quota_exhausted"
        | "in_progress"
        | "failed"
        | "no_time";
    };

type CategorySuggestionFailureReason = AiFailure | "invalid_output";

// Best-effort: a run already failed from the caller's point of view, so a
// second failure writing that down must not escape and leave the row
// "running" for RUN_STALE_MS instead of reporting what already went wrong.
async function failRun(
  repository: ReturnType<typeof createCategorySuggestionsRepository>,
  db: Database,
  id: string,
  model: string | null,
  usage: { inputTokens: number; outputTokens: number } | null,
  reason: CategorySuggestionFailureReason,
): Promise<void> {
  console.warn(`analysis: category suggestion run ${id} failed (${reason})`);
  try {
    await repository.fail(db, id, {
      model,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      failureReason: reason,
    });
  } catch (error) {
    console.warn(`analysis: could not mark run ${id} failed (${errorName(error)})`);
  }
}

// A member's "Sugerir categorias com IA" (ADR-0014): one Haiku call per
// press, spending one of the household's daily runs whether it succeeds or
// not. No correction retry — the client's own pinned-id retry on a rejected
// model id (anthropic-client.ts) is the only retry a press gets.
export async function requestCategorySuggestions(
  session: HouseholdSession,
  db: Database,
  deps: CategorySuggestionDeps,
  options: { now: Date; deadline: Date },
): Promise<CategorySuggestionOutcome> {
  const scope = householdScope(session);
  const resolved = await clientForHousehold(scope, db, deps);
  if (resolved === null) {
    return { status: "disabled" };
  }
  const { client, family: familyOf } = resolved;
  const repository = createCategorySuggestionsRepository(scope);
  const localDay = await householdLocalDay(db, scope, options.now);
  const staleBefore = new Date(options.now.getTime() - RUN_STALE_MS);

  // Cheap pre-checks before any read of the household's transactions: a
  // refused press must not cost the ledger read behind it. reserveRun
  // re-checks both under the lock.
  if (await repository.hasRunningSince(db, staleBefore)) {
    return { status: "in_progress" };
  }
  if ((await repository.countRunsOn(db, localDay)) >= CATEGORY_SUGGESTION_RUNS_PER_DAY) {
    return { status: "quota_exhausted" };
  }

  const promptVersion = deps.prompt.version;
  const alreadyAsked = await repository.readSuggestions(db, promptVersion);
  const candidates = await getAiSuggestionCandidates(scope, {
    now: options.now,
    askedTransactionIds: new Set(alreadyAsked.keys()),
    limit: CATEGORY_SUGGESTION_MAX_GROUPS,
  });
  if (candidates.groups.length === 0) {
    return { status: "nothing_to_suggest" };
  }

  // Recorded only once there is something to send, and before the model is
  // ever asked (ADR-0008): a failure here must fail the press, not let a
  // call through unwitnessed.
  await recordFinancialDataAccess(session, "category_suggestions");

  const family = familyOf("categorySuggestion");
  const requestedModel = await client.resolveModel(family, "light");
  // Resolving the model is itself a network call; re-checking the budget
  // right after it, before a run is ever reserved, keeps a press that was
  // already doomed from spending its slot.
  if (options.deadline.getTime() - Date.now() < MIN_ATTEMPT_MS.light) {
    return { status: "no_time" };
  }

  const transactionCount = candidates.groups.reduce(
    (total, group) => total + group.transactionIds.length,
    0,
  );
  const reservation = await repository.reserveRun(db, {
    row: {
      localDay,
      promptVersion,
      requestedModel,
      itemCount: candidates.groups.length,
      transactionCount,
      requestedByUserId: session.userId,
    },
    limit: CATEGORY_SUGGESTION_RUNS_PER_DAY,
    staleBefore,
  });
  if (reservation.status !== "reserved") {
    return { status: reservation.status };
  }

  const groupTransactionIds = candidates.groups.map((group) => group.transactionIds);
  const items: CategorySuggestionPromptItem[] = candidates.groups.map((group, index) => ({
    index,
    type: group.type,
    absoluteAmountCentavos: group.absoluteAmountCentavos,
    currency: group.currency,
    description: group.description,
  }));
  const subcategories = productSubcategoriesForPrompt();
  const sentIds = subcategories.map((subcategory) => subcategory.id);
  const promptInput = { subcategories, items };

  const result = await client.suggestCategories({
    family,
    model: requestedModel,
    system: deps.prompt.system,
    user: deps.prompt.renderUser(promptInput),
    outputSchema: categorySuggestionOutputSchema(sentIds),
    timeoutMs: Math.min(TIMEOUT_MS.light, options.deadline.getTime() - Date.now()),
  });

  if (result.status !== "ok") {
    await failRun(repository, db, reservation.id, result.model, result.usage, result.status);
    return { status: "failed" };
  }

  const parsed = categorySuggestionAnswerSchema.safeParse(result.output);
  if (!parsed.success) {
    await failRun(repository, db, reservation.id, result.model, result.usage, "invalid_output");
    return { status: "failed" };
  }

  const sentIdSet = new Set<string>(sentIds);
  const seenIndexes = new Set<number>();
  const subcategoryByIndex = new Map<number, string | null>();
  for (const answer of parsed.data.suggestions) {
    if (answer.index < 0 || answer.index >= groupTransactionIds.length) {
      continue;
    }
    if (seenIndexes.has(answer.index)) {
      continue;
    }
    if (answer.subcategory !== null && !sentIdSet.has(answer.subcategory)) {
      continue;
    }
    seenIndexes.add(answer.index);
    subcategoryByIndex.set(answer.index, answer.subcategory);
  }

  const answers: CategorySuggestionAnswerToStore[] = [];
  let suggestedCount = 0;
  for (let index = 0; index < groupTransactionIds.length; index += 1) {
    const subcategoryId = subcategoryByIndex.get(index) ?? null;
    const transactionIds = groupTransactionIds[index] ?? [];
    if (subcategoryId !== null) {
      suggestedCount += transactionIds.length;
    }
    for (const transactionId of transactionIds) {
      answers.push({ transactionId, subcategoryId });
    }
  }

  try {
    await db.transaction(async (tx) => {
      await repository.saveSuggestions(tx, { promptVersion, model: result.model, answers });
      await repository.succeed(tx, reservation.id, {
        model: result.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        suggestedCount,
      });
    });
  } catch (error) {
    console.warn(`analysis: could not save category suggestions (${errorName(error)})`);
    // The transaction above may have actually committed and only the driver
    // threw on its way back (a dropped connection acking the commit): ask
    // the row itself rather than assume the worse of the two outcomes.
    const statusAfterError = await repository.statusOf(db, reservation.id).catch(() => null);
    if (statusAfterError === "succeeded") {
      return { status: "ok", suggestedCount };
    }
    await failRun(repository, db, reservation.id, result.model, result.usage, "unavailable");
    return { status: "failed" };
  }

  return { status: "ok", suggestedCount };
}

export async function runCategorySuggestions(
  session: HouseholdSession,
  db: Database,
): Promise<CategorySuggestionOutcome> {
  if (!(await isAnalysisEnabled(session))) {
    return { status: "disabled" };
  }
  let deps: CategorySuggestionDeps;
  try {
    deps = createCategorySuggestionDeps();
  } catch (error) {
    console.warn(`analysis: AI provider misconfigured (${errorName(error)})`);
    return { status: "disabled" };
  }
  return requestCategorySuggestions(session, db, deps, {
    now: new Date(),
    deadline: new Date(Date.now() + CATEGORY_SUGGESTION_BUDGET_MS - RUN_HEADROOM_MS),
  });
}

// Current prompt version only, scoped to the session's household: what a
// press has already answered, read back for guided categorization to pre-fill
// (ledger's suggest.ts precedence: history_amount, history, ai, credit).
export async function readAiCategorySuggestions(
  session: HouseholdSession,
): Promise<ReadonlyMap<string, SubcategoryRef | null>> {
  const scope = householdScope(session);
  return createCategorySuggestionsRepository(scope).readSuggestions(
    getDb(),
    CURRENT_CATEGORY_SUGGESTER_PROMPT.version,
  );
}

export type SuggestCategoriesButtonProps = {
  pendingCount: number;
  remaining: number;
  limit: number;
};

// null hides the button and its disclosure entirely: the analyst is off, or
// there is nothing left for a press to send (Behaviour 1).
export async function getSuggestCategoriesButtonProps(
  session: HouseholdSession,
  pendingCount: number,
): Promise<SuggestCategoriesButtonProps | null> {
  if (pendingCount === 0 || !(await isAnalysisEnabled(session))) {
    return null;
  }
  const scope = householdScope(session);
  const repository = createCategorySuggestionsRepository(scope);
  const localDay = await householdLocalDay(getDb(), scope, new Date());
  const used = await repository.countRunsOn(getDb(), localDay);
  return {
    pendingCount,
    remaining: Math.max(0, CATEGORY_SUGGESTION_RUNS_PER_DAY - used),
    limit: CATEGORY_SUGGESTION_RUNS_PER_DAY,
  };
}
