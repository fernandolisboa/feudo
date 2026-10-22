import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withTwoHouseholds } from "@/modules/households/test/with-two-households";
import {
  decryptSecret,
  encryptSecret,
  HOUSEHOLD_AI_KEY_PURPOSE,
  isLegacyEnvelope,
} from "@/platform/crypto";
import { encryptLegacySecret } from "@/platform/test/legacy-envelope";
import { createAiSettingsRepository, replaceLegacyApiKey } from "./ai-settings-repository";
import { runLegacyApiKeySweepStep } from "./legacy-key-sweep";
import { householdAiSettings } from "./schema";

import type { Database } from "@/platform/db/client";
import type { HouseholdScope } from "@/modules/households";

const KEY = "integration-test-encryption-key-with-32-chars";
const OTHER_KEY = "another-integration-encryption-key-32-chars!";
const ENV = { ENCRYPTION_KEY: KEY };
const API_KEY_A = "sk-ant-api03-key-of-household-a";
const API_KEY_B = "sk-ant-api03-key-of-household-b";

async function saveKey(
  db: Database,
  scope: HouseholdScope,
  ciphertext: string | undefined,
): Promise<void> {
  await createAiSettingsRepository(scope).save(db, {
    apiKey: ciphertext === undefined ? undefined : { ciphertext, last4: "last" },
    monthlyFamily: "opus",
    onDemandFamily: "sonnet",
    updatedByUserId: null,
  });
}

async function storedCiphertext(db: Database, householdId: string): Promise<string | null> {
  const [row] = await db
    .select({ ciphertext: householdAiSettings.apiKeyCiphertext })
    .from(householdAiSettings)
    .where(eq(householdAiSettings.householdId, householdId));
  return row?.ciphertext ?? null;
}

describe("legacy API key sweep (integration)", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rewrites a v1 key nobody reads as v2, bound to its own household", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await saveKey(
        db,
        householdA.scope,
        encryptLegacySecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      );
      await saveKey(
        db,
        householdB.scope,
        encryptLegacySecret(API_KEY_B, KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      );

      const result = await runLegacyApiKeySweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 2, unreadable: 0, remaining: 0 });
      const ciphertextA = (await storedCiphertext(db, householdA.id)) ?? "";
      const ciphertextB = (await storedCiphertext(db, householdB.id)) ?? "";
      expect(isLegacyEnvelope(ciphertextA)).toBe(false);
      expect(isLegacyEnvelope(ciphertextB)).toBe(false);
      expect(decryptSecret(ciphertextA, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdA.id)).toBe(
        API_KEY_A,
      );
      expect(decryptSecret(ciphertextB, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdB.id)).toBe(
        API_KEY_B,
      );
      expect(() =>
        decryptSecret(ciphertextA, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdB.id),
      ).toThrow();
      expect(() =>
        decryptSecret(ciphertextB, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdA.id),
      ).toThrow();
    });
  });

  it("leaves a v2 key and a household with no key untouched", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const bound = encryptSecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdA.id);
      await saveKey(db, householdA.scope, bound);
      await saveKey(db, householdB.scope, undefined);

      const result = await runLegacyApiKeySweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 0, unreadable: 0, remaining: 0 });
      expect(await storedCiphertext(db, householdA.id)).toBe(bound);
      expect(await storedCiphertext(db, householdB.id)).toBeNull();
    });
  });

  it("counts a v1 key it cannot decrypt as unreadable, leaves it as is and keeps going", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const foreign = encryptLegacySecret(API_KEY_A, OTHER_KEY, HOUSEHOLD_AI_KEY_PURPOSE);
      await saveKey(db, householdA.scope, foreign);
      await saveKey(
        db,
        householdB.scope,
        encryptLegacySecret(API_KEY_B, KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      );

      const result = await runLegacyApiKeySweepStep(db, ENV);

      expect(result).toEqual({ rewritten: 1, unreadable: 1, remaining: 1 });
      expect(await storedCiphertext(db, householdA.id)).toBe(foreign);
      expect(
        decryptSecret(
          (await storedCiphertext(db, householdB.id)) ?? "",
          KEY,
          HOUSEHOLD_AI_KEY_PURPOSE,
          householdB.id,
        ),
      ).toBe(API_KEY_B);
    });
  });

  it("logs only the three counts", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await saveKey(
        db,
        householdA.scope,
        encryptLegacySecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      );

      await runLegacyApiKeySweepStep(db, ENV);

      expect(console.info).toHaveBeenCalledExactlyOnceWith(
        "analysis: legacy API key sweep rewritten=1 unreadable=0 remaining=0",
      );
    });
  });

  it("returns an error summary, touching nothing, when ENCRYPTION_KEY is missing", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const legacy = encryptLegacySecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE);
      await saveKey(db, householdA.scope, legacy);

      const result = await runLegacyApiKeySweepStep(db, {});

      expect(result).toEqual({ error: "MissingEncryptionKeyError" });
      expect(await storedCiphertext(db, householdA.id)).toBe(legacy);
    });
  });

  it("replaceLegacyApiKey does nothing when the key changed since it was read", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const stale = encryptLegacySecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE);
      await saveKey(db, householdA.scope, stale);
      const saved = encryptSecret(API_KEY_B, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdA.id);
      await saveKey(db, householdA.scope, saved);

      const replaced = await replaceLegacyApiKey(db, {
        householdId: householdA.id,
        from: stale,
        to: encryptSecret(API_KEY_A, KEY, HOUSEHOLD_AI_KEY_PURPOSE, householdA.id),
      });

      expect(replaced).toBe(false);
      expect(await storedCiphertext(db, householdA.id)).toBe(saved);
    });
  });
});
