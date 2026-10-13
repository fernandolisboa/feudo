import type { AnalysisInput } from "@feudo/core";

import { renderAnalystV1User } from "./analyst-v1";
import { ANALYST_V2_SYSTEM, ANALYST_V2_VERSION } from "./analyst-v2";

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
