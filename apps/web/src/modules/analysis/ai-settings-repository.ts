import { eq, sql } from "drizzle-orm";

import type { HouseholdScope } from "@/modules/households";

import type { Database } from "@/platform/db/client";
import { DEFAULT_MONTHLY_FAMILY, DEFAULT_ON_DEMAND_FAMILY, type AiFamily } from "./ai-client";
import { householdAiSettings } from "./schema";

export type AiSettings = {
  monthlyFamily: AiFamily;
  onDemandFamily: AiFamily;
  apiKeyCiphertext: string | null;
  apiKeyLast4: string | null;
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  monthlyFamily: DEFAULT_MONTHLY_FAMILY,
  onDemandFamily: DEFAULT_ON_DEMAND_FAMILY,
  apiKeyCiphertext: null,
  apiKeyLast4: null,
};

export type SaveAiSettingsInput = {
  // undefined means "keep the current key" (actions.ts's blank-field rule);
  // the repository never guesses that from an empty ciphertext.
  apiKey: { ciphertext: string; last4: string } | undefined;
  monthlyFamily: AiFamily;
  onDemandFamily: AiFamily;
  updatedByUserId: string | null;
};

// Every method is bound to the household taken from the session (ADR-0001):
// none accepts a household id. Absent row = DEFAULT_AI_SETTINGS and no key.
export function createAiSettingsRepository(scope: HouseholdScope) {
  const inHousehold = eq(householdAiSettings.householdId, scope.householdId);

  return {
    async get(db: Database): Promise<AiSettings | undefined> {
      const rows = await db
        .select({
          monthlyFamily: householdAiSettings.monthlyFamily,
          onDemandFamily: householdAiSettings.onDemandFamily,
          apiKeyCiphertext: householdAiSettings.apiKeyCiphertext,
          apiKeyLast4: householdAiSettings.apiKeyLast4,
        })
        .from(householdAiSettings)
        .where(inHousehold)
        .limit(1);
      return rows[0];
    },

    async save(db: Database, input: SaveAiSettingsInput): Promise<void> {
      await db
        .insert(householdAiSettings)
        .values({
          householdId: scope.householdId,
          apiKeyCiphertext: input.apiKey?.ciphertext ?? null,
          apiKeyLast4: input.apiKey?.last4 ?? null,
          monthlyFamily: input.monthlyFamily,
          onDemandFamily: input.onDemandFamily,
          updatedByUserId: input.updatedByUserId,
        })
        .onConflictDoUpdate({
          target: householdAiSettings.householdId,
          set: {
            monthlyFamily: input.monthlyFamily,
            onDemandFamily: input.onDemandFamily,
            updatedByUserId: input.updatedByUserId,
            updatedAt: sql`now()`,
            ...(input.apiKey === undefined
              ? {}
              : { apiKeyCiphertext: input.apiKey.ciphertext, apiKeyLast4: input.apiKey.last4 }),
          },
        });
    },

    async removeKey(db: Database, updatedByUserId: string | null): Promise<void> {
      await db
        .update(householdAiSettings)
        .set({
          apiKeyCiphertext: null,
          apiKeyLast4: null,
          updatedByUserId,
          updatedAt: sql`now()`,
        })
        .where(inHousehold);
    },
  };
}

export type AiSettingsRepository = ReturnType<typeof createAiSettingsRepository>;

export async function getAiSettings(scope: HouseholdScope, db: Database): Promise<AiSettings> {
  const row = await createAiSettingsRepository(scope).get(db);
  return row ?? DEFAULT_AI_SETTINGS;
}
