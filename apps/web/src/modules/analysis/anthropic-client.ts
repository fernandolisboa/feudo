import Anthropic from "@anthropic-ai/sdk";

import { errorName } from "@/lib/error-name";
import { AI_MODELS, type AiClient, type AiRequest, type AiResult, type AiTier } from "./ai-client";

const MAX_TOKENS = 16_000;

const EFFORT: Record<AiTier, "medium" | "high"> = { standard: "medium", deep: "high" };

// Structured outputs constrain the reply to this shape; the length and
// citation rules the schema cannot express are checked afterwards by
// packages/core's analysisOutputSchema and findAnalysisViolations.
const OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    reading: { type: "string" },
    tradeOffs: { type: "array", items: { type: "string" } },
    counterArgument: { type: "string" },
    citedKeys: { type: "array", items: { type: "string" } },
  },
  required: ["reading", "tradeOffs", "counterArgument", "citedKeys"],
  additionalProperties: false,
};

export function createAnthropicAiClient(apiKey: string): AiClient {
  const client = new Anthropic({ apiKey, maxRetries: 0 });

  return {
    async complete(request: AiRequest): Promise<AiResult> {
      try {
        const response = await client.beta.messages.create(
          {
            model: AI_MODELS[request.tier],
            max_tokens: MAX_TOKENS,
            system: request.system,
            messages: [{ role: "user", content: request.user }],
            output_config: {
              effort: EFFORT[request.tier],
              format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA },
            },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          },
          { timeout: request.timeoutMs },
        );
        const usage = {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        };
        if (response.stop_reason === "refusal") {
          return { status: "refused", model: response.model, usage };
        }
        if (response.stop_reason === "max_tokens") {
          return { status: "truncated", model: response.model, usage };
        }
        const text = response.content
          .flatMap((block) => (block.type === "text" ? [block.text] : []))
          .join("");
        try {
          return { status: "ok", output: JSON.parse(text), model: response.model, usage };
        } catch {
          return { status: "malformed", model: response.model, usage };
        }
      } catch (error) {
        if (error instanceof Anthropic.APIConnectionTimeoutError) {
          return { status: "timed_out", model: null, usage: null };
        }
        const status = error instanceof Anthropic.APIError ? ` ${String(error.status)}` : "";
        console.warn(`analysis: model call failed (${errorName(error)}${status})`);
        return { status: "unavailable", model: null, usage: null };
      }
    },
  };
}
