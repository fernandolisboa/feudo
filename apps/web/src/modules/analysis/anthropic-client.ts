import Anthropic from "@anthropic-ai/sdk";

import { errorName } from "@/lib/error-name";
import {
  EFFORT,
  PINNED_MODEL_IDS,
  type AiClient,
  type AiFamily,
  type AiRequest,
  type AiResult,
  type AiTier,
} from "./ai-client";
import { resolveModelId } from "./model-resolution";

const MAX_TOKENS = 16_000;

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

function buildParams(
  modelId: string,
  family: AiFamily,
  tier: AiTier,
  request: AiRequest,
): CreateParams {
  const params: CreateParams = {
    model: modelId,
    max_tokens: MAX_TOKENS,
    system: request.system,
    messages: [{ role: "user", content: request.user }],
    output_config: {
      effort: EFFORT[tier],
      format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA },
    },
  };
  if (family === "haiku") {
    return params;
  }
  return { ...params, betas: [SERVER_SIDE_FALLBACK_BETA], fallbacks: "default" };
}

type BetaMessageResponse = Anthropic.Beta.Messages.BetaMessage;

function mapMessage(response: BetaMessageResponse): AiResult {
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

async function listAllModels(client: Anthropic): Promise<unknown[]> {
  const models: unknown[] = [];
  for await (const model of client.models.list()) {
    models.push(model);
  }
  return models;
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

    async complete(request: AiRequest): Promise<AiResult> {
      const pinned = PINNED_MODEL_IDS[request.family];
      try {
        const response = await client.beta.messages.create(
          buildParams(request.model, request.family, request.tier, request),
          { timeout: request.timeoutMs },
        );
        return mapMessage(response);
      } catch (error) {
        if (request.model === pinned || !isResolutionRejection(error)) {
          return mapError(error);
        }
        // The resolved id is newer than what this deploy knows to be good;
        // the API rejected it outright (not an outage), so one more try on
        // the pinned id before giving up. Logged by id only, never the key
        // or any content.
        console.warn(`analysis: model ${request.model} was rejected, retrying on ${pinned}`);
        try {
          const response = await client.beta.messages.create(
            buildParams(pinned, request.family, request.tier, request),
            { timeout: request.timeoutMs },
          );
          return mapMessage(response);
        } catch (retryError) {
          return mapError(retryError);
        }
      }
    },
  };
}
