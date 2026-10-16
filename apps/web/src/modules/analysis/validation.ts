import { z } from "zod";

import { AI_FAMILIES } from "./ai-client";

export const aiFamilySchema = z.enum(AI_FAMILIES);

const API_KEY_MAX_LENGTH = 200;

// Blank means "keep the current key" (preprocess strips it to undefined
// before the optional check); a present value must look like an Anthropic
// key. The key is otherwise read as opaque text: the real check is
// verifying it against Anthropic before it is ever stored (ai-settings.ts).
const optionalApiKeySchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().trim().max(API_KEY_MAX_LENGTH).startsWith("sk-ant-").optional(),
);

export const saveAiSettingsFormSchema = z.object({
  apiKey: optionalApiKeySchema,
  monthlyFamily: aiFamilySchema,
  onDemandFamily: aiFamilySchema,
});

export type SaveAiSettingsFormInput = z.infer<typeof saveAiSettingsFormSchema>;
