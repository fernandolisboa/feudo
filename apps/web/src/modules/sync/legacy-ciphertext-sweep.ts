import { errorName } from "@/lib/error-name";

import {
  decryptSecret,
  encryptSecret,
  EncryptionKeyMismatchError,
  MalformedCiphertextError,
  PROVIDER_CREDENTIALS_PURPOSE,
} from "@/platform/crypto";
import type { Database } from "@/platform/db/client";
import { readEncryptionKey, type SyncEnv } from "./env";
import {
  countLegacyCredentials,
  listLegacyCredentials,
  replaceLegacyCredential,
} from "./repository";

export type LegacyCredentialSweepStep =
  { rewritten: number; unreadable: number; remaining: number } | { error: string };

// Rewrites every stored credential still in the pre-binding envelope as a
// bound one, so the read-time rebind (service.ts) is not the only way a row
// leaves v1: a user who never syncs again would otherwise keep theirs. A
// step of the existing `GET /api/cron/daily`, not a cron of its own.
// `remaining` is a fresh count after the pass: it is what shows the sweep
// worked (unreadable rows stay in it by design).
export async function runLegacyCredentialSweepStep(
  db: Database,
  env: SyncEnv = process.env,
): Promise<LegacyCredentialSweepStep> {
  try {
    const encryptionKey = readEncryptionKey(env);
    let rewritten = 0;
    let unreadable = 0;
    for (const row of await listLegacyCredentials(db)) {
      let plaintext: string;
      try {
        plaintext = decryptSecret(
          row.ciphertext,
          encryptionKey,
          PROVIDER_CREDENTIALS_PURPOSE,
          row.userId,
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
      const replaced = await replaceLegacyCredential(db, {
        id: row.id,
        from: row.ciphertext,
        to: encryptSecret(plaintext, encryptionKey, PROVIDER_CREDENTIALS_PURPOSE, row.userId),
      });
      if (replaced) {
        rewritten += 1;
      }
    }
    const remaining = await countLegacyCredentials(db);
    console.info(
      `sync: legacy credential sweep rewritten=${String(rewritten)} unreadable=${String(unreadable)} remaining=${String(remaining)}`,
    );
    return { rewritten, unreadable, remaining };
  } catch (error) {
    return { error: errorName(error) };
  }
}
