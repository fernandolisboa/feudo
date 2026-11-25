import { describe, expect, it } from "vitest";

import { withTwoHouseholds } from "@/modules/households/test/with-two-households";

import {
  createAiSettingsRepository,
  DEFAULT_AI_SETTINGS,
  getAiSettings,
} from "./ai-settings-repository";
import { householdAiSettings } from "./schema";

describe("household_ai_settings isolation (integration)", () => {
  it("reads only the scoped household's own settings, defaulting to no key", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAiSettingsRepository(householdA.scope).save(db, {
        apiKey: { ciphertext: "enc:v2:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        categorySuggestionFamily: "haiku",
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
        categorySuggestionFamily: "sonnet",
        updatedByUserId: null,
      });

      const settingsB = await createAiSettingsRepository(householdB.scope).get(db);
      expect(settingsB).toBeUndefined();
    });
  });

  it("removeKey never clears another household's key", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAiSettingsRepository(householdA.scope).save(db, {
        apiKey: { ciphertext: "enc:v2:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        categorySuggestionFamily: "sonnet",
        updatedByUserId: null,
      });
      await createAiSettingsRepository(householdB.scope).save(db, {
        apiKey: { ciphertext: "enc:v2:eee:fff:ggg:hhh", last4: "hhh2" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        categorySuggestionFamily: "sonnet",
        updatedByUserId: null,
      });

      await createAiSettingsRepository(householdA.scope).removeKey(db, null);

      const settingsA = await createAiSettingsRepository(householdA.scope).get(db);
      const settingsB = await createAiSettingsRepository(householdB.scope).get(db);
      expect(settingsA).toMatchObject({ apiKeyCiphertext: null, apiKeyLast4: null });
      expect(settingsB).toMatchObject({
        apiKeyCiphertext: "enc:v2:eee:fff:ggg:hhh",
        apiKeyLast4: "hhh2",
      });
    });
  });

  it("keeps the current key when only the families are saved", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const repository = createAiSettingsRepository(householdA.scope);
      await repository.save(db, {
        apiKey: { ciphertext: "enc:v2:aaa:bbb:ccc:ddd", last4: "ddd1" },
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        categorySuggestionFamily: "sonnet",
        updatedByUserId: null,
      });

      await repository.save(db, {
        apiKey: undefined,
        monthlyFamily: "haiku",
        onDemandFamily: "haiku",
        categorySuggestionFamily: "haiku",
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

  it("defaults the new category_suggestion_family column to haiku for a row saved before it existed", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(householdAiSettings).values({
        householdId: householdA.scope.householdId,
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
      });

      expect(await getAiSettings(householdA.scope, db)).toMatchObject({
        categorySuggestionFamily: "haiku",
      });
    });
  });
});
