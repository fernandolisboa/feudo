import type { Categorization } from "./categorize";
import { matchesPattern, normalizeDescription, rulePatternFromDescription } from "./description";
import { suggestionFingerprint } from "./fingerprint";
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
  // undefined: no AI row for this transaction under the current prompt
  // version. null: asked, and the model gave no answer. A SubcategoryRef:
  // the model's answer. Absent entirely (every candidate undefined) must
  // not change any existing suggestion (suggest.property.test.ts).
  aiSuggestion?: SubcategoryRef | null | undefined;
};

export type CategorySuggestion =
  | { subcategory: SubcategoryRef; reason: "history_amount"; matches: number }
  | { subcategory: SubcategoryRef; reason: "history"; matches: number }
  | { subcategory: SubcategoryRef; reason: "ai" }
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

// Several uncategorized rows can share a fingerprint (same normalized
// description, absolute amount, currency and direction): when only some of
// them carry their own AI answer, the others inherit it. Among the rows that
// do carry one, the newest date wins, then the smallest id — a total order,
// so the winner never depends on input order.
function aiWinnerOutranks(a: Normalized, b: Normalized): boolean {
  if (a.date !== b.date) return a.date > b.date;
  return a.id < b.id;
}

function buildAiAnswersByFingerprint(
  rows: readonly Normalized[],
): Map<string, SubcategoryRef | null> {
  const winners = new Map<string, Normalized>();
  for (const row of rows) {
    if (row.aiSuggestion === undefined) continue;
    const fingerprint = suggestionFingerprint(row);
    const current = winners.get(fingerprint);
    if (!current || aiWinnerOutranks(row, current)) {
      winners.set(fingerprint, row);
    }
  }
  const answers = new Map<string, SubcategoryRef | null>();
  for (const [fingerprint, winner] of winners) {
    answers.set(fingerprint, winner.aiSuggestion ?? null);
  }
  return answers;
}

// Suggestions come only from what the household already decided, or from the
// AI when it was asked: a transaction the household's rules, Feudo's
// defaults and the bank's own category all missed gets the subcategory most
// often given to transactions of the same amount (same-amount.ts) its
// proposed rule pattern would match, because a generic description ("Pix
// enviado", a person's name) covers unrelated payments while an equal amount
// usually is the same payment again, give or take the centavos an
// installment rounds by. With no such amount in the history, the description
// alone counts only when every match agrees. Pairing-only and offset-link
// categorizations are left out (they say "transfer between your accounts" or
// "pass-through" about a counterpart, not about the description). With
// nothing from history, an AI suggestion asked for this transaction or
// inherited from one sharing its fingerprint comes next; then money coming
// in with no suggestion at all leans to income, because unclassified credits
// are where a household's income hides.
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
  const aiAnswersByFingerprint = buildAiAnswersByFingerprint(uncategorized);

  return [...uncategorized].sort(byLargestAmount).map((row) => {
    const pattern = rulePatternFromDescription(row.description);
    const similar = uncategorized.filter(
      (other) =>
        other.id !== row.id && other.type === row.type && matchesPattern(other.normalized, pattern),
    );
    const fromHistory = historySuggestion(row, pattern, history);
    const aiAnswer =
      row.aiSuggestion !== undefined
        ? row.aiSuggestion
        : (aiAnswersByFingerprint.get(suggestionFingerprint(row)) ?? undefined);
    const aiSuggestion: CategorySuggestion | null =
      aiAnswer !== undefined && aiAnswer !== null
        ? { subcategory: aiAnswer, reason: "ai" as const }
        : null;
    const suggestion =
      fromHistory.suggestion ??
      aiSuggestion ??
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
