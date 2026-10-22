import { describe, expect, it } from "vitest";

import { withTwoHouseholds } from "@/modules/households/test/with-two-households";

import {
  createAiSettingsRepository,
  DEFAULT_AI_SETTINGS,
  getAiSettings,
} from "./ai-settings-repository";

describe("household_ai_settings isolation (integration)", () => {
  it("reads only the scoped household's own settings, defaulting to no key", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAiSettingsRepository(householdA.scope).save(db, {
        apiKey: { ciphertext: "enc:v1:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        updatedByUserId: null,
      });

      const settingsA = await createAiSettingsRepository(householdA.scope).get(db);
      const settingsB = await createAiSettingsRepository(householdB.scope).get(db);

      expect(settingsA).toMatchObject({
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        apiKeyLast4: "ddd1",
      });
      expect(settingsB).toBeUndefined();
    });
  });

  it("does not write another household's settings", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAiSettingsRepository(householdA.scope).save(db, {
        apiKey: undefined,
        monthlyFamily: "sonnet",
        onDemandFamily: "sonnet",
        updatedByUserId: null,
      });

      const settingsB = await createAiSettingsRepository(householdB.scope).get(db);
      expect(settingsB).toBeUndefined();
    });
  });

  it("removeKey never clears another household's key", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAiSettingsRepository(householdA.scope).save(db, {
        apiKey: { ciphertext: "enc:v1:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        updatedByUserId: null,
      });
      await createAiSettingsRepository(householdB.scope).save(db, {
        apiKey: { ciphertext: "enc:v1:eee:fff:ggg:hhh", last4: "hhh2" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        updatedByUserId: null,
      });

      await createAiSettingsRepository(householdA.scope).removeKey(db, null);

      const settingsA = await createAiSettingsRepository(householdA.scope).get(db);
      const settingsB = await createAiSettingsRepository(householdB.scope).get(db);
      expect(settingsA).toMatchObject({ apiKeyCiphertext: null, apiKeyLast4: null });
      expect(settingsB).toMatchObject({
        apiKeyCiphertext: "enc:v1:eee:fff:ggg:hhh",
        apiKeyLast4: "hhh2",
      });
    });
  });

  it("replaceKeyCiphertext rewrites only the scoped household's key, and only while it is unchanged", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const saveKey = (scope: typeof householdA.scope, ciphertext: string) =>
        createAiSettingsRepository(scope).save(db, {
          apiKey: { ciphertext, last4: "same" },
          monthlyFamily: "opus",
          onDemandFamily: "sonnet",
          updatedByUserId: null,
        });
      await saveKey(householdA.scope, "enc:v1:shared");
      await saveKey(householdB.scope, "enc:v1:shared");

      await createAiSettingsRepository(householdA.scope).replaceKeyCiphertext(db, {
        from: "enc:v1:shared",
        to: "enc:v2:rebound",
      });
      await createAiSettingsRepository(householdA.scope).replaceKeyCiphertext(db, {
        from: "enc:v1:shared",
        to: "enc:v2:stale-rewrite",
      });

      expect(await createAiSettingsRepository(householdA.scope).get(db)).toMatchObject({
        apiKeyCiphertext: "enc:v2:rebound",
        apiKeyLast4: "same",
      });
      expect(await createAiSettingsRepository(householdB.scope).get(db)).toMatchObject({
        apiKeyCiphertext: "enc:v1:shared",
      });
    });
  });

  it("keeps the current key when only the families are saved", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const repository = createAiSettingsRepository(householdA.scope);
      await repository.save(db, {
        apiKey: { ciphertext: "enc:v1:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        updatedByUserId: null,
      });

      await repository.save(db, {
        apiKey: undefined,
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        updatedByUserId: null,
      });

      expect(await repository.get(db)).toMatchObject({
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        apiKeyLast4: "ddd1",
      });
    });
  });

  it("defaults an unseeded household to opus/sonnet with no key", async () => {
    await withTwoHouseholds(async ({ db, householdB }) => {
      expect(await getAiSettings(householdB.scope, db)).toEqual(DEFAULT_AI_SETTINGS);
    });
  });
});
