import type { Categorization } from "./categorize";
import { matchesPattern, normalizeDescription, rulePatternFromDescription } from "./description";
import { isSameAmount, sameAmountGroup } from "./same-amount";
import type { SubcategoryRef, TransactionDirection } from "./taxonomy";

export type QueueCandidate = {
  id: string;
  description: string;
  type: TransactionDirection;
  amountCentavos: number;
  currency: string;
  date: string;
  categorization: Categorization | null;
};

export type CategorySuggestion =
  | { subcategory: SubcategoryRef; reason: "history_amount"; matches: number }
  | { subcategory: SubcategoryRef; reason: "history"; matches: number }
  | { subcategory: SubcategoryRef; reason: "credit" };

export type QueueItem = {
  id: string;
  type: TransactionDirection;
  pattern: string;
  suggestion: CategorySuggestion | null;
  conflictingHistory: boolean;
  sameAmountCount: number;
  similarCount: number;
};

const CREDIT_FALLBACK: SubcategoryRef = { type: "product", id: "income.other" };

type Normalized = QueueCandidate & { normalized: string };
type Categorized = Normalized & { categorization: Categorization };

type Tally = { subcategory: SubcategoryRef; count: number; latestDate: string; key: string };

function refKey(ref: SubcategoryRef): string {
  return `${ref.type}:${ref.id}`;
}

function byLargestAmount(a: QueueCandidate, b: QueueCandidate): number {
  return (
    Math.abs(b.amountCentavos) - Math.abs(a.amountCentavos) ||
    b.date.localeCompare(a.date) ||
    a.id.localeCompare(b.id)
  );
}

function outranks(a: Tally, b: Tally): boolean {
  if (a.count !== b.count) return a.count > b.count;
  if (a.latestDate !== b.latestDate) return a.latestDate > b.latestDate;
  return a.key < b.key;
}

function mostChosen(rows: readonly Categorized[]): Tally[] {
  const tallies = new Map<string, Tally>();
  for (const row of rows) {
    const subcategory = row.categorization.subcategory;
    const key = refKey(subcategory);
    const tally = tallies.get(key) ?? { subcategory, count: 0, latestDate: row.date, key };
    tally.count += 1;
    if (row.date > tally.latestDate) tally.latestDate = row.date;
    tallies.set(key, tally);
  }
  return [...tallies.values()].sort((a, b) => (outranks(a, b) ? -1 : 1));
}

function historySuggestion(
  row: Normalized,
  pattern: string,
  history: readonly Categorized[],
): { suggestion: CategorySuggestion | null; conflicting: boolean } {
  const matching = history.filter(
    (other) => other.type === row.type && matchesPattern(other.normalized, pattern),
  );

  const [bestOfSameAmount] = mostChosen(sameAmountGroup(row, matching));
  if (bestOfSameAmount) {
    return {
      suggestion: {
        subcategory: bestOfSameAmount.subcategory,
        reason: "history_amount",
        matches: bestOfSameAmount.count,
      },
      conflicting: false,
    };
  }

  const [only, ...others] = mostChosen(matching);
  if (only && others.length === 0) {
    return {
      suggestion: { subcategory: only.subcategory, reason: "history", matches: only.count },
      conflicting: false,
    };
  }
  return { suggestion: null, conflicting: only !== undefined };
}

// Suggestions come only from what the household already decided: a
// transaction the household's rules, Feudo's defaults and the bank's own
// category all missed gets the subcategory most often given to transactions
// of the same amount (same-amount.ts) its proposed rule pattern would match,
// because a generic description ("Pix enviado", a person's name) covers
// unrelated payments while an equal amount usually is the same payment again,
// give or take the centavos an installment rounds by. With no such
// amount in the history, the description alone counts only when every match
// agrees. Pairing-only and offset-link categorizations are left out (they say
// "transfer between your accounts" or "pass-through" about a counterpart, not
// about the description),
// and money coming in with no suggestion from history leans to income,
// because unclassified credits are where a household's income hides.
export function buildCategorizationQueue(candidates: readonly QueueCandidate[]): QueueItem[] {
  const normalized: Normalized[] = candidates.map((candidate) => ({
    ...candidate,
    normalized: normalizeDescription(candidate.description),
  }));
  const history = normalized.filter(
    (row): row is Categorized =>
      row.categorization !== null &&
      row.categorization.source !== "internal_transfer" &&
      row.categorization.source !== "link",
  );
  const uncategorized = normalized.filter((row) => row.categorization === null);

  return [...uncategorized].sort(byLargestAmount).map((row) => {
    const pattern = rulePatternFromDescription(row.description);
    const similar = uncategorized.filter(
      (other) =>
        other.id !== row.id && other.type === row.type && matchesPattern(other.normalized, pattern),
    );
    const fromHistory = historySuggestion(row, pattern, history);
    const suggestion =
      fromHistory.suggestion ??
      (row.type === "credit" ? { subcategory: CREDIT_FALLBACK, reason: "credit" as const } : null);
    return {
      id: row.id,
      type: row.type,
      pattern,
      suggestion,
      conflictingHistory: fromHistory.conflicting,
      sameAmountCount: similar.filter((other) => isSameAmount(other, row)).length,
      similarCount: similar.length,
    };
  });
}
