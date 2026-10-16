import Anthropic from "@anthropic-ai/sdk";

import { errorName } from "@/lib/error-name";
import type { AiClient } from "./ai-client";
import { createAnthropicAiClient } from "./anthropic-client";
import type { AiProviderName } from "./env";
import { createFakeAiClient } from "./fake-client";

export type VerifyKeyOutcome = { status: "ok" } | { status: "invalid" } | { status: "unavailable" };

// The household's own key, never Feudo's: verified against Anthropic before
// it is ever stored (actions.ts), and turned into a client only at the
// moment a reading needs one. `clientFor(null)` means "this household has
// no key": off for Anthropic, but the fake provider ignores it entirely so
// preview and e2e keep working with no key registered at all.
export type AiProvider = {
  verifyKey(apiKey: string): Promise<VerifyKeyOutcome>;
  clientFor(apiKey: string | null): AiClient | null;
};

async function verifyAnthropicKey(apiKey: string): Promise<VerifyKeyOutcome> {
  try {
    const client = new Anthropic({ apiKey, maxRetries: 0 });
    await client.models.list({ limit: 1 });
    return { status: "ok" };
  } catch (error) {
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      return { status: "invalid" };
    }
    console.warn(`analysis: key verification failed (${errorName(error)})`);
    return { status: "unavailable" };
  }
}

const anthropicProvider: AiProvider = {
  verifyKey: verifyAnthropicKey,
  clientFor(apiKey) {
    return apiKey === null ? null : createAnthropicAiClient(apiKey);
  },
};

const fakeProvider: AiProvider = {
  verifyKey(apiKey) {
    return Promise.resolve(apiKey.trim() === "" ? { status: "invalid" } : { status: "ok" });
  },
  clientFor() {
    return createFakeAiClient();
  },
};

export function createAiProvider(name: AiProviderName): AiProvider | null {
  switch (name) {
    case "off":
      return null;
    case "fake":
      return fakeProvider;
    case "anthropic":
      return anthropicProvider;
  }
}
