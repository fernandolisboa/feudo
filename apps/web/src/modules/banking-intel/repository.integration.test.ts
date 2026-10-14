import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { DEFAULT_COMPARISON_SETTINGS, DEFAULT_WEIGHT_LEVELS } from "@feudo/core";

import { householdScope } from "@/modules/households";
import { withTwoHouseholds } from "@/modules/households/test/with-two-households";
import { bankAccount, bankConnection } from "@/modules/sync/schema";
import { seedAccount, seedSyncedConnection } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import type { Database } from "@/platform/db/client";
import {
  createCriteriaWeightsRepository,
  listHouseholdInstitutionLabels,
  type StoredSettings,
} from "./repository";
import { bankCriteriaWeights } from "./schema";

const FEES_FIRST: StoredSettings = {
  levels: { ...DEFAULT_WEIGHT_LEVELS, fees: 5, cardBenefits: 0 },
  options: DEFAULT_COMPARISON_SETTINGS,
};
const CARDS_FIRST: StoredSettings = {
  levels: { ...DEFAULT_WEIGHT_LEVELS, fees: 1, cardBenefits: 5 },
  options: { ...DEFAULT_COMPARISON_SETTINGS, candidateCount: 2 },
};

async function renameConnection(db: Database, connectionId: string, label: string): Promise<void> {
  await db
    .update(bankConnection)
    .set({ institutionName: label })
    .where(eq(bankConnection.id, connectionId));
}

describe("criteria weights repository isolation (integration)", () => {
  it("reads only the scoped household's own weights and options", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createCriteriaWeightsRepository(householdA.scope).save(db, FEES_FIRST);

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: FEES_FIRST.levels,
        options: { status: "found", value: FEES_FIRST.options, droppedFields: [] },
      });
      expect(await createCriteriaWeightsRepository(householdB.scope).get(db)).toEqual({
        status: "none",
      });
    });
  });

  it("never overwrites another household's weights or options when saving its own", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createCriteriaWeightsRepository(householdA.scope).save(db, FEES_FIRST);
      await createCriteriaWeightsRepository(householdB.scope).save(db, CARDS_FIRST);
      await createCriteriaWeightsRepository(householdB.scope).save(db, {
        ...CARDS_FIRST,
        levels: { ...CARDS_FIRST.levels, lockIn: 0 },
      });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: FEES_FIRST.levels,
        options: { status: "found", value: FEES_FIRST.options, droppedFields: [] },
      });
      expect(await createCriteriaWeightsRepository(householdB.scope).get(db)).toEqual({
        status: "found",
        levels: { ...CARDS_FIRST.levels, lockIn: 0 },
        options: { status: "found", value: CARDS_FIRST.options, droppedFields: [] },
      });
      const rows = await db.select().from(bankCriteriaWeights);
      expect(rows).toHaveLength(2);
    });
  });

  it("never clears another household's weights", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createCriteriaWeightsRepository(householdB.scope).save(db, CARDS_FIRST);

      await createCriteriaWeightsRepository(householdA.scope).clear(db);

      expect(await createCriteriaWeightsRepository(householdB.scope).get(db)).toEqual({
        status: "found",
        levels: CARDS_FIRST.levels,
        options: { status: "found", value: CARDS_FIRST.options, droppedFields: [] },
      });
    });
  });

  it("reports a stored weights set that fails validation instead of trusting it", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db
        .insert(bankCriteriaWeights)
        .values({ householdId: householdA.id, weights: { fees: 99 } });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "unreadable",
      });
    });
  });

  it("reports options as absent, not unreadable, for a row saved before options existed", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db
        .insert(bankCriteriaWeights)
        .values({ householdId: householdA.id, weights: DEFAULT_WEIGHT_LEVELS });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: DEFAULT_WEIGHT_LEVELS,
        options: { status: "absent" },
      });
    });
  });

  it("keeps a stored option field that is still valid and drops only the one that fails, without failing the weights", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(bankCriteriaWeights).values({
        householdId: householdA.id,
        weights: DEFAULT_WEIGHT_LEVELS,
        options: { candidateCount: 99, proConMinDifference: 15 },
      });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: DEFAULT_WEIGHT_LEVELS,
        options: {
          status: "found",
          value: { proConMinDifference: 15 },
          droppedFields: ["candidateCount"],
        },
      });
    });
  });

  it("reports unreadable options, not absent, for a column that is not options-shaped at all", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(bankCriteriaWeights).values({
        householdId: householdA.id,
        weights: DEFAULT_WEIGHT_LEVELS,
        options: "not an object",
      });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: DEFAULT_WEIGHT_LEVELS,
        options: { status: "unreadable" },
      });
    });
  });
});

describe("listHouseholdInstitutionLabels (integration)", () => {
  it("lists the connection labels of the household's own accounts only", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      const nubank = await seedSyncedConnection(db, userA, { household: scopeA });
      await renameConnection(db, nubank.connectionId, "Nubank");
      const itau = await seedSyncedConnection(db, userB, { household: scopeB });
      await renameConnection(db, itau.connectionId, "Itaú");

      expect(await listHouseholdInstitutionLabels(db, scopeA)).toEqual(["Nubank"]);
      expect(await listHouseholdInstitutionLabels(db, scopeB)).toEqual(["Itaú"]);
    });
  });

  it("ignores a connection whose accounts are all unassigned", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scopeA = householdScope(userA.session);
      const inter = await seedSyncedConnection(db, userA, {
        household: scopeA,
        itemId: "1a2b3c4d-0000-4000-8000-000000000001",
        accounts: [seedAccount({ providerItemId: "1a2b3c4d-0000-4000-8000-000000000001" })],
      });
      await renameConnection(db, inter.connectionId, "Inter");
      await db
        .update(bankAccount)
        .set({ householdId: null })
        .where(eq(bankAccount.connectionId, inter.connectionId));

      expect(await listHouseholdInstitutionLabels(db, scopeA)).toEqual([]);
    });
  });
});
