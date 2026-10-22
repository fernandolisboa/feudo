import { errorName } from "@/lib/error-name";

import type { Database } from "@/platform/db/client";
import { readEncryptionKey, type SyncEnv } from "./env";
import {
  countLegacyCredentials,
  createSyncUserRepository,
  listLegacyCredentials,
} from "./repository";
import {
  deserializeCredentials,
  isUnreadableCredentialsFailure,
  serializeCredentials,
} from "./service";

export type LegacyCredentialSweepStep =
  { rewritten: number; unreadable: number; remaining: number } | { error: string };

// The read-time rebind (service.ts) is not the only way out of v1: a user who
// never syncs again would keep theirs. `remaining` is a fresh count that
// keeps unreadable rows by design; it is what shows the sweep worked. The key
// is read only when a row needs it, so a deployment without one still runs.
export async function runLegacyCredentialSweepStep(
  db: Database,
  env: SyncEnv = process.env,
): Promise<LegacyCredentialSweepStep> {
  try {
    const rows = await listLegacyCredentials(db);
    let rewritten = 0;
    let unreadable = 0;
    if (rows.length > 0) {
      const encryptionKey = readEncryptionKey(env);
      for (const { scope, ciphertext } of rows) {
        let to: string;
        try {
          to = serializeCredentials(
            deserializeCredentials(ciphertext, encryptionKey, scope.userId),
            encryptionKey,
            scope.userId,
          );
        } catch (error) {
          if (isUnreadableCredentialsFailure(error)) {
            unreadable += 1;
            continue;
          }
          throw error;
        }
        const replaced = await createSyncUserRepository(scope).replaceCredentialCiphertext(db, {
          from: ciphertext,
          to,
        });
        if (replaced) {
          rewritten += 1;
        }
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
