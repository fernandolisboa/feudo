import type { AnalysisInput } from "@feudo/core";

import { renderAnalystV1User } from "./analyst-v1";
import { ANALYST_V2_SYSTEM, ANALYST_V2_VERSION } from "./analyst-v2";
import {
  CATEGORY_SUGGESTER_V1_SYSTEM,
  CATEGORY_SUGGESTER_V1_VERSION,
  renderCategorySuggesterV1User,
} from "./category-suggester-v1";

export type AnalystPrompt = {
  version: string;
  system: string;
  renderUser: (input: AnalysisInput, correction: string | null) => string;
};

export const CURRENT_ANALYST_PROMPT: AnalystPrompt = {
  version: ANALYST_V2_VERSION,
  system: ANALYST_V2_SYSTEM,
  renderUser: renderAnalystV1User,
};

export type CategorySuggesterPrompt = {
  version: string;
  system: string;
  renderUser: typeof renderCategorySuggesterV1User;
};

export const CURRENT_CATEGORY_SUGGESTER_PROMPT: CategorySuggesterPrompt = {
  version: CATEGORY_SUGGESTER_V1_VERSION,
  system: CATEGORY_SUGGESTER_V1_SYSTEM,
  renderUser: renderCategorySuggesterV1User,
};

export {
  categorySuggestionAnswerSchema,
  categorySuggestionOutputSchema,
  type CategorySuggestionAnswer,
  type CategorySuggestionOutput,
} from "./category-suggester-v1";
