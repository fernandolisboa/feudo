import type { AnalysisInput } from "@feudo/core";

import { ANALYST_V1_SYSTEM, ANALYST_V1_VERSION, renderAnalystV1User } from "./analyst-v1";

export type AnalystPrompt = {
  version: string;
  system: string;
  renderUser: (input: AnalysisInput, correction: string | null) => string;
};

export const CURRENT_ANALYST_PROMPT: AnalystPrompt = {
  version: ANALYST_V1_VERSION,
  system: ANALYST_V1_SYSTEM,
  renderUser: renderAnalystV1User,
};
