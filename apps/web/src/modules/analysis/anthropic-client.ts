import Anthropic from "@anthropic-ai/sdk";

import { errorName } from "@/lib/error-name";
import {
  EFFORT,
  MIN_ATTEMPT_MS,
  PINNED_MODEL_IDS,
  type AiClient,
  type AiFamily,
  type AiRequest,
  type AiResult,
  type AiTier,
  type CategorySuggestionAiRequest,
} from "./ai-client";
import { resolveModelId } from "./model-resolution";

const MAX_TOKENS = 16_000;

// Category suggestions run Haiku 5.5 with adaptive thinking on by default,
// and thinking tokens count toward max_tokens; this is well above what 40
// index/subcategory answers need so thinking cannot truncate the answer
// (verified against the current Claude API reference, 2026-11-25).
const MAX_TOKENS_LIGHT = 8_000;

// Haiku 5.5 has no server-side refusal fallback; sending the beta or
// `fallbacks` for it is rejected by the API, so only Sonnet and Opus get them.
const SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Structured outputs constrain the reply to this shape; the length and
// citation rules the schema cannot express are checked afterwards by
// packages/core's analysisOutputSchema and findAnalysisViolations.
const OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    reading: { type: "string" },
    banks: { type: "string" },
    tradeOffs: { type: "array", items: { type: "string" } },
    counterArgument: { type: "string" },
    citedKeys: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "reading", "banks", "tradeOffs", "counterArgument", "citedKeys"],
  additionalProperties: false,
};

type CreateParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type Effort = "low" | "medium" | "high";

// Haiku never gets the server-side fallback beta or `fallbacks` (the API
// rejects both for it); Sonnet and Opus get both, for every call shape.
function buildParams(
  modelId: string,
  family: AiFamily,
  effort: Effort,
  system: string,
  user: string,
  schema: Record<string, unknown>,
  maxTokens: number,
): CreateParams {
  const params: CreateParams = {
    model: modelId,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    output_config: {
      effort,
      format: { type: "json_schema", schema },
    },
  };
  if (family === "haiku") {
    return params;
  }
  return { ...params, betas: [SERVER_SIDE_FALLBACK_BETA], fallbacks: "default" };
}

type BetaMessageResponse = Anthropic.Beta.Messages.BetaMessage;
type BetaStopReason = Anthropic.Beta.Messages.BetaStopReason;

type StopClassification = "parse" | "refused" | "truncated" | "malformed";

// Exhaustive over the SDK's stop_reason union: a variant added to the SDK
// that is not one of these fails the build here, not silently at `ok`.
// tool_use/pause_turn/compaction are never requested (no tools, no
// multi-turn agentic runs), so seeing one means the API answered in a shape
// nothing here asked for, same as an absent stop_reason.
function classifyStopReason(stopReason: BetaStopReason | null): StopClassification {
  if (stopReason === null) {
    return "malformed";
  }
  switch (stopReason) {
    case "end_turn":
    case "stop_sequence":
      return "parse";
    case "refusal":
      return "refused";
    case "max_tokens":
    case "model_context_window_exceeded":
      return "truncated";
    case "tool_use":
    case "pause_turn":
    case "compaction":
      return "malformed";
    default: {
      const exhaustive: never = stopReason;
      return exhaustive;
    }
  }
}

function mapMessage(response: BetaMessageResponse): AiResult {
  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
  const classification = classifyStopReason(response.stop_reason);
  if (classification === "refused") {
    return { status: "refused", model: response.model, usage };
  }
  if (classification === "truncated") {
    return { status: "truncated", model: response.model, usage };
  }
  if (classification === "malformed") {
    return { status: "malformed", model: response.model, usage };
  }
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  try {
    return { status: "ok", output: JSON.parse(text), model: response.model, usage };
  } catch {
    return { status: "malformed", model: response.model, usage };
  }
}

function mapError(error: unknown): AiResult {
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return { status: "timed_out", model: null, usage: null };
  }
  const status = error instanceof Anthropic.APIError ? ` ${String(error.status)}` : "";
  console.warn(`analysis: model call failed (${errorName(error)}${status})`);
  return { status: "unavailable", model: null, usage: null };
}

function isResolutionRejection(error: unknown): boolean {
  return error instanceof Anthropic.BadRequestError || error instanceof Anthropic.NotFoundError;
}

// Listing models is a lookup, not the reading itself: it gets a short budget
// of its own regardless of the tier's timeout, so a slow or hanging listing
// call still leaves time for the pinned-id fallback to answer.
const MODEL_LIST_TIMEOUT_MS = 5_000;

async function listAllModels(client: Anthropic): Promise<unknown[]> {
  const models: unknown[] = [];
  for await (const model of client.models.list(undefined, { timeout: MODEL_LIST_TIMEOUT_MS })) {
    models.push(model);
  }
  return models;
}

// Shared by complete and suggestCategories: one attempt on the resolved
// model id and, only when the API rejects it outright (never on a refusal,
// an outage or any other failure) and the rejected id was not already the
// pinned one, one more attempt on the pinned id within whatever is left of
// the original timeout — never a second full one, and skipped outright when
// too little of it remains for a fair shot.
async function createWithPinnedRetry(
  client: Anthropic,
  requestedModelId: string,
  pinnedModelId: string,
  timeoutMs: number,
  minAttemptMs: number,
  paramsFor: (modelId: string) => CreateParams,
): Promise<AiResult> {
  const startedAt = Date.now();
  try {
    const response = await client.beta.messages.create(paramsFor(requestedModelId), {
      timeout: timeoutMs,
    });
    return mapMessage(response);
  } catch (error) {
    if (requestedModelId === pinnedModelId || !isResolutionRejection(error)) {
      return mapError(error);
    }
    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs < minAttemptMs) {
      console.warn(
        `analysis: model ${requestedModelId} was rejected, no time left to retry on ${pinnedModelId}`,
      );
      return mapError(error);
    }
    console.warn(`analysis: model ${requestedModelId} was rejected, retrying on ${pinnedModelId}`);
    try {
      const response = await client.beta.messages.create(paramsFor(pinnedModelId), {
        timeout: remainingMs,
      });
      return mapMessage(response);
    } catch (retryError) {
      return mapError(retryError);
    }
  }
}

export function createAnthropicAiClient(apiKey: string): AiClient {
  const client = new Anthropic({ apiKey, maxRetries: 0 });

  return {
    async resolveModel(family, tier) {
      try {
        const models = await listAllModels(client);
        return resolveModelId(models, family, tier);
      } catch {
        return PINNED_MODEL_IDS[family];
      }
    },

    complete(request: AiRequest): Promise<AiResult> {
      const pinned = PINNED_MODEL_IDS[request.family];
      return createWithPinnedRetry(
        client,
        request.model,
        pinned,
        request.timeoutMs,
        MIN_ATTEMPT_MS[request.tier],
        (modelId) =>
          buildParams(
            modelId,
            request.family,
            EFFORT[request.tier],
            request.system,
            request.user,
            OUTPUT_JSON_SCHEMA,
            MAX_TOKENS,
          ),
      );
    },

    suggestCategories(request: CategorySuggestionAiRequest): Promise<AiResult> {
      const pinned = PINNED_MODEL_IDS[request.family];
      const tier: AiTier = "light";
      return createWithPinnedRetry(
        client,
        request.model,
        pinned,
        request.timeoutMs,
        MIN_ATTEMPT_MS[tier],
        (modelId) =>
          buildParams(
            modelId,
            request.family,
            EFFORT[tier],
            request.system,
            request.user,
            request.outputSchema,
            MAX_TOKENS_LIGHT,
          ),
      );
    },
  };
}
