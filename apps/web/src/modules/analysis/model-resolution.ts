import { z } from "zod";

import { EFFORT, PINNED_MODEL_IDS, type AiFamily, type AiTier } from "./ai-client";

// The Models API response (apps/web/node_modules/@anthropic-ai/sdk resources/models.d.ts),
// trimmed to the fields resolution needs; everything else is ignored. A raw
// entry that does not match is simply not a candidate, never a thrown error:
// the API is an edge, and an unexpected shape there must not take the
// analyst down.
const capabilitySupportSchema = z.object({ supported: z.boolean() });

const effortCapabilitySchema = z.object({
  supported: z.boolean(),
  medium: capabilitySupportSchema,
  high: capabilitySupportSchema,
});

const modelCapabilitiesSchema = z.object({
  structured_outputs: capabilitySupportSchema,
  effort: effortCapabilitySchema,
});

const resolvableModelSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  capabilities: modelCapabilitiesSchema.nullable(),
});

type ResolvableModel = z.infer<typeof resolvableModelSchema>;

function qualifies(model: ResolvableModel, family: AiFamily, tier: AiTier): boolean {
  if (!model.id.startsWith(`claude-${family}-`)) {
    return false;
  }
  const capabilities = model.capabilities;
  if (capabilities === null) {
    return false;
  }
  if (!capabilities.structured_outputs.supported) {
    return false;
  }
  if (!capabilities.effort.supported) {
    return false;
  }
  return capabilities.effort[EFFORT[tier]].supported;
}

// Pure: given the household's own Models API listing, the family it picked
// for this kind of reading and the tier's effort level, picks the newest
// qualifying id, or the family's pinned id when none qualifies. `models` is
// unvalidated API data, read at this one edge.
export function resolveModelId(models: unknown[], family: AiFamily, tier: AiTier): string {
  const qualifying = models.flatMap((raw) => {
    const parsed = resolvableModelSchema.safeParse(raw);
    return parsed.success && qualifies(parsed.data, family, tier) ? [parsed.data] : [];
  });
  if (qualifying.length === 0) {
    return PINNED_MODEL_IDS[family];
  }
  return qualifying.reduce((newest, candidate) =>
    Date.parse(candidate.created_at) > Date.parse(newest.created_at) ? candidate : newest,
  ).id;
}
