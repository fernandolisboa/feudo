import type { CriterionNumericWeight } from "@feudo/core";

import { t } from "./strings";

// The one place that turns a weight level into its pt-BR label, keyed by the
// level itself (strings.ts weights.levels) so every caller reads the same
// text and a level that is missing a label fails to typecheck instead of
// silently falling back to an English placeholder.
export function levelLabel(level: CriterionNumericWeight): string {
  return t.weights.levels[level];
}
