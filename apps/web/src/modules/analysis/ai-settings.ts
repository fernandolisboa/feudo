import type { HouseholdScope } from "@/modules/households";

import { errorName } from "@/lib/error-name";
import { decryptSecret, encryptSecret, HOUSEHOLD_AI_KEY_PURPOSE } from "@/platform/crypto";
import type { Database } from "@/platform/db/client";
import type { AiFamily } from "./ai-client";
import { createAiSettingsRepository, type AiSettings } from "./ai-settings-repository";
import { createKeyVerificationAttemptRepository } from "./key-verification-attempts";
import type { AiProvider } from "./provider";

export { getAiSettings, type AiSettings } from "./ai-settings-repository";

const LAST4_LENGTH = 4;

// Decrypts the household's own key, if it has one. A ciphertext that can no
// longer be opened (a rotated ENCRYPTION_KEY, a tampered row) is treated as
// "no key" rather than thrown: the household simply has no analyst until it
// registers a new one, instead of every reading crashing.
export function decryptHouseholdApiKey(
  settings: AiSettings,
  encryptionKey: string,
  householdId: string,
): string | null {
  if (settings.apiKeyCiphertext === null) {
    return null;
  }
  try {
    return decryptSecret(
      settings.apiKeyCiphertext,
      encryptionKey,
      HOUSEHOLD_AI_KEY_PURPOSE,
      householdId,
    );
  } catch (error) {
    console.warn(`analysis: could not decrypt the household's Anthropic key (${errorName(error)})`);
    return null;
  }
}

// The one predicate for "can this household's analyst run": a ciphertext
// this deploy's own ENCRYPTION_KEY cannot open (a rotated key, a tampered
// row) counts as no key everywhere it is checked — the gate on Visão
// geral/Reserva/Análises, Casa's hasKey/last4 line, the actions and the
// cron — never just "•••• abcd" shown as if the key still worked.
export function householdHasUsableKey(
  settings: AiSettings,
  encryptionKey: string | null,
  householdId: string,
): boolean {
  return (
    encryptionKey !== null && decryptHouseholdApiKey(settings, encryptionKey, householdId) !== null
  );
}

export type SaveAiSettingsCommand = {
  // null means "remove no key, change nothing about it"; a present string is
  // only ever the new plaintext key, never blank (actions.ts trims first).
  apiKey: string | null;
  monthlyFamily: AiFamily;
  onDemandFamily: AiFamily;
  // Never null: the member submitting the change is also who the
  // verification attempt is rate-limited by (key-verification-attempts.ts).
  // A caller with no session-derived user has no business saving a key.
  updatedByUserId: string;
};

export type SaveAiSettingsOutcome =
  | { status: "ok" }
  | { status: "invalid_key" }
  | { status: "unavailable" }
  | { status: "failed" }
  | { status: "rate_limited" };

// Verifies a new key against Anthropic before it is ever stored (never an
// unverified key); an unchanged key (apiKey: null) skips verification and
// only updates the families. A verification attempt is rate-limited per
// household and per submitting user (key-verification-attempts.ts) before
// provider.verifyKey is ever called, so a rejected attempt never reaches
// Anthropic and never counts toward anything else.
export async function saveAiSettings(
  scope: HouseholdScope,
  db: Database,
  provider: AiProvider,
  encryptionKey: string,
  input: SaveAiSettingsCommand,
): Promise<SaveAiSettingsOutcome> {
  let apiKey: { ciphertext: string; last4: string } | undefined;
  if (input.apiKey !== null) {
    const reservation = await createKeyVerificationAttemptRepository(scope)
      .reserve(db, { userId: input.updatedByUserId, now: new Date() })
      .catch((error: unknown) => {
        console.warn(`analysis: key verification rate limit check failed (${errorName(error)})`);
        return { status: "failed" as const };
      });
    if (reservation.status === "rate_limited") {
      return { status: "rate_limited" };
    }
    if (reservation.status === "failed") {
      return { status: "failed" };
    }
    const verified = await provider.verifyKey(input.apiKey);
    if (verified.status === "invalid") {
      return { status: "invalid_key" };
    }
    if (verified.status === "unavailable") {
      return { status: "unavailable" };
    }
    apiKey = {
      ciphertext: encryptSecret(
        input.apiKey,
        encryptionKey,
        HOUSEHOLD_AI_KEY_PURPOSE,
        scope.householdId,
      ),
      last4: input.apiKey.slice(-LAST4_LENGTH),
    };
  }
  try {
    await createAiSettingsRepository(scope).save(db, {
      apiKey,
      monthlyFamily: input.monthlyFamily,
      onDemandFamily: input.onDemandFamily,
      updatedByUserId: input.updatedByUserId,
    });
    return { status: "ok" };
  } catch {
    return { status: "failed" };
  }
}

export type RemoveAiKeyOutcome = { status: "ok" } | { status: "failed" };

export async function removeAiKey(
  scope: HouseholdScope,
  db: Database,
  updatedByUserId: string | null,
): Promise<RemoveAiKeyOutcome> {
  try {
    await createAiSettingsRepository(scope).removeKey(db, updatedByUserId);
    return { status: "ok" };
  } catch {
    return { status: "failed" };
  }
}
