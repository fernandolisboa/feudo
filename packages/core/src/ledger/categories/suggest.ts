import type { Categorization } from "./categorize";
import { matchesPattern, normalizeDescription, rulePatternFromDescription } from "./description";
import type { SubcategoryRef, TransactionDirection } from "./taxonomy";

export type QueueCandidate = {
  id: string;
  description: string;
  type: TransactionDirection;
  amountCentavos: number;
  date: string;
  categorization: Categorization | null;
};

export type CategorySuggestion =
  | { subcategory: SubcategoryRef; reason: "history"; matches: number }
  | { subcategory: SubcategoryRef; reason: "credit" };

export type QueueItem = {
  id: string;
  type: TransactionDirection;
  pattern: string;
  suggestion: CategorySuggestion | null;
  similarCount: number;
};

const CREDIT_FALLBACK: SubcategoryRef = { type: "product", id: "income.other" };

type Normalized = QueueCandidate & { normalized: string };

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

function historySuggestion(
  type: TransactionDirection,
  pattern: string,
  history: readonly Normalized[],
): CategorySuggestion | null {
  const tallies = new Map<string, Tally>();
  for (const row of history) {
    if (row.type !== type || row.categorization === null) continue;
    if (!matchesPattern(row.normalized, pattern)) continue;
    const subcategory = row.categorization.subcategory;
    const key = refKey(subcategory);
    const tally = tallies.get(key) ?? { subcategory, count: 0, latestDate: row.date, key };
    tally.count += 1;
    if (row.date > tally.latestDate) tally.latestDate = row.date;
    tallies.set(key, tally);
  }

  let best: Tally | null = null;
  for (const tally of tallies.values()) {
    if (best === null || outranks(tally, best)) best = tally;
  }
  return best === null
    ? null
    : { subcategory: best.subcategory, reason: "history", matches: best.count };
}

// Suggestions come only from what the household already decided: a
// transaction the household's rules, Feudo's defaults and the bank's own
// category all missed gets the subcategory most often given to transactions
// its proposed rule pattern would match. Pairing-only categorizations are
// left out (they say "transfer between your accounts" about a counterpart,
// not about the description), and money coming in with no history leans to
// income, because unclassified credits are where a household's income hides.
export function buildCategorizationQueue(candidates: readonly QueueCandidate[]): QueueItem[] {
  const normalized: Normalized[] = candidates.map((candidate) => ({
    ...candidate,
    normalized: normalizeDescription(candidate.description),
  }));
  const history = normalized.filter(
    (row) => row.categorization !== null && row.categorization.source !== "internal_transfer",
  );
  const uncategorized = normalized.filter((row) => row.categorization === null);

  return [...uncategorized].sort(byLargestAmount).map((row) => {
    const pattern = rulePatternFromDescription(row.description);
    const similarCount = uncategorized.filter(
      (other) =>
        other.id !== row.id && other.type === row.type && matchesPattern(other.normalized, pattern),
    ).length;
    const suggestion =
      historySuggestion(row.type, pattern, history) ??
      (row.type === "credit" ? { subcategory: CREDIT_FALLBACK, reason: "credit" as const } : null);
    return { id: row.id, type: row.type, pattern, suggestion, similarCount };
  });
}
