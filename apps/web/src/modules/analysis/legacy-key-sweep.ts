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
  listLegacyApiKeys,
  replaceLegacyApiKey,
} from "./ai-settings-repository";
import { readEncryptionKey, type AnalysisEnv } from "./env";

export type LegacyApiKeySweepStep =
  { rewritten: number; unreadable: number; remaining: number } | { error: string };

// Rewrites every stored Anthropic key still in the pre-binding envelope as a
// bound one, so the read-time rebind (ai-settings.ts) is not the only way a
// row leaves v1: a household that never runs a reading again would otherwise
// keep its key. A step of the existing `GET /api/cron/daily`, not a cron of
// its own. `remaining` is a fresh count after the pass: it is what shows the
// sweep worked (unreadable rows stay in it by design).
export async function runLegacyApiKeySweepStep(
  db: Database,
  env: AnalysisEnv = process.env,
): Promise<LegacyApiKeySweepStep> {
  try {
    const encryptionKey = readEncryptionKey(env);
    let rewritten = 0;
    let unreadable = 0;
    for (const row of await listLegacyApiKeys(db)) {
      let plaintext: string;
      try {
        plaintext = decryptSecret(
          row.apiKeyCiphertext,
          encryptionKey,
          HOUSEHOLD_AI_KEY_PURPOSE,
          row.householdId,
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
      const replaced = await replaceLegacyApiKey(db, {
        householdId: row.householdId,
        from: row.apiKeyCiphertext,
        to: encryptSecret(plaintext, encryptionKey, HOUSEHOLD_AI_KEY_PURPOSE, row.householdId),
      });
      if (replaced) {
        rewritten += 1;
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
