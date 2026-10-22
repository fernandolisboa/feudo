import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  isLegacyEnvelope,
  PROVIDER_CREDENTIALS_PURPOSE,
} from "@/platform/crypto";
import { encryptLegacySecret } from "@/platform/test/legacy-envelope";
import { runLegacyCredentialSweepStep } from "./legacy-ciphertext-sweep";
import { createSyncUserRepository } from "./repository";
import { providerCredential } from "./schema";
import { withTwoUsers } from "./test/with-two-users";

import type { Database } from "@/platform/db/client";

const KEY = "integration-test-encryption-key-with-32-chars";
const OTHER_KEY = "another-integration-encryption-key-32-chars!";
const ENV = { ENCRYPTION_KEY: KEY };
const SECRET_A = '{"clientId":"a","clientSecret":"secret-a"}';
const SECRET_B = '{"clientId":"b","clientSecret":"secret-b"}';

async function storedCiphertext(db: Database, userId: string): Promise<string | undefined> {
  const [row] = await db
    .select({ ciphertext: providerCredential.ciphertext })
    .from(providerCredential)
    .where(eq(providerCredential.userId, userId));
  return row?.ciphertext;
}

describe("legacy credential sweep (integration)", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rewrites a v1 row nobody reads as v2, bound to its own owner", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      for (const [user, secret] of [
        [userA, SECRET_A],
        [userB, SECRET_B],
      ] as const) {
        await createSyncUserRepository(user.scope).saveCredential(db, {
          provider: "pluggy",
          ciphertext: encryptLegacySecret(secret, KEY, PROVIDER_CREDENTIALS_PURPOSE),
          validatedAt: new Date(),
        });
      }

      const result = await runLegacyCredentialSweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 2, unreadable: 0, remaining: 0 });
      const ciphertextA = (await storedCiphertext(db, userA.id)) ?? "";
      const ciphertextB = (await storedCiphertext(db, userB.id)) ?? "";
      expect(isLegacyEnvelope(ciphertextA)).toBe(false);
      expect(isLegacyEnvelope(ciphertextB)).toBe(false);
      expect(decryptSecret(ciphertextA, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id)).toBe(
        SECRET_A,
      );
      expect(decryptSecret(ciphertextB, KEY, PROVIDER_CREDENTIALS_PURPOSE, userB.id)).toBe(
        SECRET_B,
      );
      expect(() =>
        decryptSecret(ciphertextA, KEY, PROVIDER_CREDENTIALS_PURPOSE, userB.id),
      ).toThrow();
      expect(() =>
        decryptSecret(ciphertextB, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id),
      ).toThrow();
    });
  });

  it("leaves a row that is already v2 untouched", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const bound = encryptSecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id);
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: bound,
        validatedAt: new Date(),
      });
      await createSyncUserRepository(userB.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: encryptLegacySecret(SECRET_B, KEY, PROVIDER_CREDENTIALS_PURPOSE),
        validatedAt: new Date(),
      });

      const result = await runLegacyCredentialSweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 1, unreadable: 0, remaining: 0 });
      expect(await storedCiphertext(db, userA.id)).toBe(bound);
    });
  });

  it("counts a v1 row it cannot decrypt as unreadable, leaves it as is and keeps going", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const foreign = encryptLegacySecret(SECRET_A, OTHER_KEY, PROVIDER_CREDENTIALS_PURPOSE);
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: foreign,
        validatedAt: new Date(),
      });
      await createSyncUserRepository(userB.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: encryptLegacySecret(SECRET_B, KEY, PROVIDER_CREDENTIALS_PURPOSE),
        validatedAt: new Date(),
      });

      const result = await runLegacyCredentialSweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 1, unreadable: 1, remaining: 1 });
      expect(await storedCiphertext(db, userA.id)).toBe(foreign);
      expect(
        decryptSecret(
          (await storedCiphertext(db, userB.id)) ?? "",
          KEY,
          PROVIDER_CREDENTIALS_PURPOSE,
          userB.id,
        ),
      ).toBe(SECRET_B);
    });
  });

  it("logs only the three counts", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: encryptLegacySecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE),
        validatedAt: new Date(),
      });

      await runLegacyCredentialSweepStep(db, ENV);

      expect(console.info).toHaveBeenCalledExactlyOnceWith(
        "sync: legacy credential sweep rewritten=1 unreadable=0 remaining=0",
      );
    });
  });

  it("returns an error summary, touching nothing, when ENCRYPTION_KEY is missing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const legacy = encryptLegacySecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE);
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: legacy,
        validatedAt: new Date(),
      });

      const result = await runLegacyCredentialSweepStep(db, {});

      expect(result).toEqual({ error: "MissingSecretError" });
      expect(await storedCiphertext(db, userA.id)).toBe(legacy);
    });
  });

  it("counts a v1 row whose plaintext is not valid credentials as unreadable", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const notCredentials = encryptLegacySecret("not json", KEY, PROVIDER_CREDENTIALS_PURPOSE);
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: notCredentials,
        validatedAt: new Date(),
      });

      const result = await runLegacyCredentialSweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 0, unreadable: 1, remaining: 1 });
      expect(await storedCiphertext(db, userA.id)).toBe(notCredentials);
    });
  });

  it("needs no ENCRYPTION_KEY when no row is v1", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const bound = encryptSecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id);
      await createSyncUserRepository(userA.scope).saveCredential(db, {
        provider: "pluggy",
        ciphertext: bound,
        validatedAt: new Date(),
      });

      const result = await runLegacyCredentialSweepStep(db, {});

      expect(result).toEqual({ rewritten: 0, unreadable: 0, remaining: 0 });
      expect(await storedCiphertext(db, userA.id)).toBe(bound);
    });
  });

  it("replaceCredentialCiphertext does nothing for another user's row or when the row changed since it was read", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repository = createSyncUserRepository(userA.scope);
      const stale = encryptLegacySecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE);
      await repository.saveCredential(db, {
        provider: "pluggy",
        ciphertext: stale,
        validatedAt: new Date(),
      });
      const saved = encryptSecret(SECRET_B, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id);
      await repository.saveCredential(db, {
        provider: "pluggy",
        ciphertext: saved,
        validatedAt: new Date(),
      });
      const to = encryptSecret(SECRET_A, KEY, PROVIDER_CREDENTIALS_PURPOSE, userA.id);

      expect(await repository.replaceCredentialCiphertext(db, { from: stale, to })).toBe(false);
      expect(await storedCiphertext(db, userA.id)).toBe(saved);
      expect(
        await createSyncUserRepository(userB.scope).replaceCredentialCiphertext(db, {
          from: saved,
          to,
        }),
      ).toBe(false);
      expect(await storedCiphertext(db, userA.id)).toBe(saved);
      expect(await repository.replaceCredentialCiphertext(db, { from: saved, to })).toBe(true);
      expect(await storedCiphertext(db, userA.id)).toBe(to);
    });
  });
});
