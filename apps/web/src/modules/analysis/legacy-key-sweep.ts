import { errorName } from "@/lib/error-name";

import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyMismatchError,
  HOUSEHOLD_AI_KEY_PURPOSE,
  MalformedCiphertextError,
} from "@/platform/crypto";
import type { Database } from "@/platform/db/client";
import {
  countLegacyApiKeys,
  createAiSettingsRepository,
  listLegacyApiKeys,
} from "./ai-settings-repository";
import { readEncryptionKey, type AnalysisEnv } from "./env";

export type LegacyApiKeySweepStep =
  { rewritten: number; unreadable: number; remaining: number } | { error: string };

// The read-time rebind (ai-settings.ts) is not the only way out of v1: a
// household that never runs a reading again would keep its key. `remaining`
// is a fresh count that keeps unreadable rows by design; it is what shows the
// sweep worked. The key is read only when a row needs it, so a deployment
// without one still runs.
export async function runLegacyApiKeySweepStep(
  db: Database,
  env: AnalysisEnv = process.env,
): Promise<LegacyApiKeySweepStep> {
  try {
    const rows = await listLegacyApiKeys(db);
    let rewritten = 0;
    let unreadable = 0;
    if (rows.length > 0) {
      const encryptionKey = readEncryptionKey(env);
      for (const { scope, ciphertext } of rows) {
        let to: string;
        try {
          to = encryptSecret(
            decryptSecret(ciphertext, encryptionKey, HOUSEHOLD_AI_KEY_PURPOSE, scope.householdId),
            encryptionKey,
            HOUSEHOLD_AI_KEY_PURPOSE,
            scope.householdId,
          );
        } catch (error) {
          if (
            error instanceof EncryptionKeyMismatchError ||
            error instanceof MalformedCiphertextError
          ) {
            unreadable += 1;
            continue;
          }
          throw error;
        }
        const replaced = await createAiSettingsRepository(scope).replaceKeyCiphertext(db, {
          from: ciphertext,
          to,
        });
        if (replaced) {
          rewritten += 1;
        }
      }
    }
    const remaining = await countLegacyApiKeys(db);
    console.info(
      `analysis: legacy API key sweep rewritten=${String(rewritten)} unreadable=${String(unreadable)} remaining=${String(remaining)}`,
    );
    return { rewritten, unreadable, remaining };
  } catch (error) {
    return { error: errorName(error) };
  }
}
