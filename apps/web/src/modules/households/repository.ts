import { eq } from "drizzle-orm";

import { householdSettings } from "@/db/schema";

import type { Database } from "@/db/client";
import type { HouseholdScope } from "./scope";

export type HouseholdSettings = {
  timeZone: string;
  reserveMultiple: number;
};

// Every repository is constructed with the household taken from the session
// (ADR-0001): no method below accepts a household id, only the scope closed
// over at construction time.
export function createHouseholdSettingsRepository(scope: HouseholdScope) {
  return {
    async get(db: Database): Promise<HouseholdSettings | undefined> {
      const rows = await db
        .select({
          timeZone: householdSettings.timeZone,
          reserveMultiple: householdSettings.reserveMultiple,
        })
        .from(householdSettings)
        .where(eq(householdSettings.householdId, scope.householdId))
        .limit(1);
      return rows[0];
    },

    async create(db: Database, settings: HouseholdSettings): Promise<void> {
      await db.insert(householdSettings).values({ householdId: scope.householdId, ...settings });
    },

    async update(db: Database, patch: Partial<HouseholdSettings>): Promise<void> {
      await db
        .update(householdSettings)
        .set(patch)
        .where(eq(householdSettings.householdId, scope.householdId));
    },
  };
}

export type HouseholdSettingsRepository = ReturnType<typeof createHouseholdSettingsRepository>;
