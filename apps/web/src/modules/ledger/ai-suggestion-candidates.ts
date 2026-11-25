import {
  batchForAiSuggestion,
  buildCategorizationQueue,
  PRODUCT_SUBCATEGORIES,
  type AiBatchRow,
  type AiSuggestionGroup,
  type Kind,
  type ProductSubcategoryId,
} from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";
import { getDb } from "@/platform/db/client";

import { readCategorizationWindowForScope } from "./categorization-window";
import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { t } from "./strings";

export type AiSuggestibleSubcategory = { id: ProductSubcategoryId; label: string; kind: Kind };

// Only Feudo's own subcategories, never a household's: the model is never
// told a household's own subcategory names (ADR-0014). Independent of any
// household's kind overrides, since the prompt must be the same for every
// household that shares a prompt version (prompts.test.ts pins its hash).
export function productSubcategoriesForPrompt(): AiSuggestibleSubcategory[] {
  return PRODUCT_SUBCATEGORIES.map((subcategory) => ({
    id: subcategory.id,
    label: `${t.categories[subcategory.categoryId]} · ${t.subcategories[subcategory.id]}`,
    kind: subcategory.kind,
  }));
}

// The eligibility rule (ADR-0014): a transaction the household's own history
// cannot place (buildCategorizationQueue's own suggestion, computed with no
// AI input at all) is a candidate only when it has no suggestion or only the
// generic "money in" fallback — never one history already answered. Rows
// come back in the queue's own order, largest amount first.
export function aiBatchRowsFor(rows: readonly ResolvedLedgerRow[]): AiBatchRow[] {
  const queue = buildCategorizationQueue(
    rows.map((row) => ({
      id: row.id,
      description: row.description,
      type: row.type,
      amountCentavos: row.amountCentavos,
      currency: row.currency,
      date: row.date,
      categorization: row.categorization,
    })),
  );
  const rowById = new Map(rows.map((row) => [row.id, row]));
  return queue.flatMap((item): AiBatchRow[] => {
    const row = rowById.get(item.id);
    if (!row) {
      return [];
    }
    return [
      {
        id: row.id,
        description: row.description,
        type: row.type,
        amountCentavos: row.amountCentavos,
        currency: row.currency,
        eligible: item.suggestion === null || item.suggestion.reason === "credit",
      },
    ];
  });
}

export type AiSuggestionCandidates = { groups: AiSuggestionGroup[] };

// What one press of "Sugerir categorias com IA" would send: the same window
// as guided categorization (readCategorizationWindowForScope), grouped by
// fingerprint and capped at `limit`, leaving out every transaction already
// asked under the current prompt version. No audit write here — the caller
// (analysis/category-suggestions.ts) records the access, after this read and
// before the model is ever called (ADR-0008). The taxonomy to offer comes
// from `productSubcategoriesForPrompt` directly: the caller is the only
// place that renders a prompt, so it reaches for it itself instead of
// carrying a second copy through this result.
export async function getAiSuggestionCandidates(
  scope: HouseholdScope,
  input: { now: Date; askedTransactionIds: ReadonlySet<string>; limit: number },
): Promise<AiSuggestionCandidates> {
  const { rows } = await readCategorizationWindowForScope(scope, getDb(), input.now);
  const groups = batchForAiSuggestion(aiBatchRowsFor(rows), input.askedTransactionIds, input.limit);
  return { groups };
}
