import { organization } from "../../auth/schema";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import { createHouseholdSettingsRepository, type HouseholdSettings } from "../repository";
import { scopeForNewHousehold, type HouseholdScope } from "../scope";

export type SeededHousehold = { id: string; scope: HouseholdScope; settings: HouseholdSettings };

export type TwoHouseholds = {
  db: Database;
  householdA: SeededHousehold;
  householdB: SeededHousehold;
};

async function seedHousehold(
  db: Database,
  name: string,
  settings: HouseholdSettings,
): Promise<SeededHousehold> {
  const id = crypto.randomUUID();
  await db.insert(organization).values({ id, name, slug: id, createdAt: new Date() });

  const scope = scopeForNewHousehold(id);
  await createHouseholdSettingsRepository(scope).create(db, settings);

  return { id, scope, settings };
}

// Reusable isolation-test helper (ADR-0001): seeds two households with their
// own settings row and hands the caller both scopes, so a test can prove a
// scope built from household A never reads or writes household B's row.
// Every later household-scoped table's isolation test reuses this shape.
export async function withTwoHouseholds(
  run: (households: TwoHouseholds) => Promise<void>,
): Promise<void> {
  await withTestDb(async (db) => {
    const householdA = await seedHousehold(db, "Household A", {
      timeZone: "America/Sao_Paulo",
      reserveMultiple: 6,
    });
    const householdB = await seedHousehold(db, "Household B", {
      timeZone: "America/Recife",
      reserveMultiple: 9,
    });

    await run({ db, householdA, householdB });
  });
}
