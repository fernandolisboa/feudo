import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import {
  deleteCategoryAiSuggestionsOlderThan,
  deleteCategorySuggestionRunsOlderThan,
} from "./category-suggestions-repository";
import { deleteAttemptsOlderThan, USER_WINDOW_MS } from "./key-verification-attempts";

export type DailyPruneStep = { deleted: number } | { error: string };

// A category_ai_suggestion row has no use once its household could not
// possibly still be looking at it, and every run's own retention is shorter
// still, since it holds nothing a household ever reads back (ADR-0014).
const SUGGESTION_RETENTION_MS = 240 * 24 * 60 * 60_000;
const RUN_RETENTION_MS = 30 * 24 * 60 * 60_000;

// Cross-household sweep for ai_key_verification_attempt, category_suggestion_run
// and category_ai_suggestion (ADR-0008): reserve() already drops a
// household's own key-verification rows past their cutoff whenever that
// household attempts again, but neither category-suggestions table has an
// opportunistic sweep of its own, so this step is the only one that ever
// reclaims them. This is a step of the existing `GET /api/cron/daily`, not a
// cron of its own.
export async function runDailyPruneStep(
  db: Database,
  now: Date = new Date(),
): Promise<DailyPruneStep> {
  try {
    const attempts = await deleteAttemptsOlderThan(db, new Date(now.getTime() - USER_WINDOW_MS));
    const runs = await deleteCategorySuggestionRunsOlderThan(
      db,
      new Date(now.getTime() - RUN_RETENTION_MS),
    );
    const suggestions = await deleteCategoryAiSuggestionsOlderThan(
      db,
      new Date(now.getTime() - SUGGESTION_RETENTION_MS),
    );
    return { deleted: attempts + runs + suggestions };
  } catch (error) {
    return { error: errorName(error) };
  }
}
