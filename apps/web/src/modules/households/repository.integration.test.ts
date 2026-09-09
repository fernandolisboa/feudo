import { describe, expect, it } from "vitest";

import { createHouseholdSettingsRepository } from "./repository";
import { withTwoHouseholds } from "./test/with-two-households";

describe("household settings repository isolation (integration)", () => {
  it("reads only the scoped household's own settings", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const settingsA = await createHouseholdSettingsRepository(householdA.scope).get(db);
      const settingsB = await createHouseholdSettingsRepository(householdB.scope).get(db);

      expect(settingsA).toEqual(householdA.settings);
      expect(settingsB).toEqual(householdB.settings);
    });
  });

  it("does not write another household's settings", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createHouseholdSettingsRepository(householdA.scope).update(db, {
        reserveMultiple: 12,
      });

      const settingsB = await createHouseholdSettingsRepository(householdB.scope).get(db);
      expect(settingsB).toEqual(householdB.settings);
    });
  });
});
