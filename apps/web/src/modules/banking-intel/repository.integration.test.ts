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
  createAccountTypeOverridesRepository,
  createCriteriaWeightsRepository,
  createCriterionOverridesRepository,
  listHouseholdInstitutionLabels,
  type StoredSettings,
} from "./repository";
import { bankAccountTypeOverride, bankCriteriaWeights, bankCriterionOverride } from "./schema";

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

  it("reports a stored weights set that is not even object-shaped instead of trusting it", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db
        .insert(bankCriteriaWeights)
        .values({ householdId: householdA.id, weights: "garbage" });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "unreadable",
      });
    });
  });

  it("reads a legacy row carrying the retired jointBanking key and an essential/required level, leaving them for resolveCriteriaWeights to map", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(bankCriteriaWeights).values({
        householdId: householdA.id,
        weights: { fees: "essential", jointBanking: "required", cardBenefits: 2 },
      });

      expect(await createCriteriaWeightsRepository(householdA.scope).get(db)).toEqual({
        status: "found",
        levels: { fees: "essential", jointBanking: "required", cardBenefits: 2 },
        options: { status: "absent" },
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

const NUBANK_FEES = {
  institutionId: "nubank",
  criterion: "fees" as const,
  score: 30,
  note: "A tarifa subiu.",
  sourceUrl: "https://nubank.com.br/tarifas",
  baseReviewedAt: "2026-10-13",
};

describe("criterion overrides repository isolation (integration)", () => {
  it("lists only the scoped household's own corrections", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createCriterionOverridesRepository(householdA.scope).save(db, NUBANK_FEES);

      const listA = await createCriterionOverridesRepository(householdA.scope).list(db);
      expect(listA.skipped).toBe(0);
      expect(listA.overrides).toEqual([{ ...NUBANK_FEES, updatedAt: expect.any(Date) as Date }]);
      expect(await createCriterionOverridesRepository(householdB.scope).list(db)).toEqual({
        overrides: [],
        skipped: 0,
      });
    });
  });

  it("never overwrites, removes or rebases another household's correction of the same criterion", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const repositoryA = createCriterionOverridesRepository(householdA.scope);
      const repositoryB = createCriterionOverridesRepository(householdB.scope);
      await repositoryA.save(db, NUBANK_FEES);
      await repositoryB.save(db, { ...NUBANK_FEES, score: 90, sourceUrl: null });
      await repositoryB.save(db, { ...NUBANK_FEES, score: 80, sourceUrl: null });

      expect(await repositoryB.rebase(db, NUBANK_FEES, "2026-11-01")).toBe(true);
      await repositoryB.remove(db, NUBANK_FEES);

      const listA = await repositoryA.list(db);
      expect(listA.overrides.map((row) => [row.score, row.baseReviewedAt])).toEqual([
        [30, "2026-10-13"],
      ]);
      expect((await repositoryB.list(db)).overrides).toEqual([]);
      expect(await repositoryB.rebase(db, NUBANK_FEES, "2026-11-01")).toBe(false);
      expect(await db.select().from(bankCriterionOverride)).toHaveLength(1);
    });
  });

  it("skips a row naming an institution or a criterion Feudo no longer profiles", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(bankCriterionOverride).values([
        { householdId: householdA.id, ...NUBANK_FEES, institutionId: "banco-extinto" },
        { householdId: householdA.id, ...NUBANK_FEES, criterion: "criterioAntigo" },
      ]);

      expect(await createCriterionOverridesRepository(householdA.scope).list(db)).toEqual({
        overrides: [],
        skipped: 2,
      });
    });
  });

  it("ignores a row naming the retired jointBanking criterion silently, not counted as unreadable", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db
        .insert(bankCriterionOverride)
        .values([{ householdId: householdA.id, ...NUBANK_FEES, criterion: "jointBanking" }]);

      expect(await createCriterionOverridesRepository(householdA.scope).list(db)).toEqual({
        overrides: [],
        skipped: 0,
      });
    });
  });

  it("refuses a score outside 0 to 100 at the database", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await expect(
        createCriterionOverridesRepository(householdA.scope).save(db, {
          ...NUBANK_FEES,
          score: 101,
        }),
      ).rejects.toThrow();
    });
  });
});

const NUBANK_JOINT = {
  institutionId: "nubank",
  accountType: "joint" as const,
  offered: true,
  note: "Agora abre conta conjunta para novos clientes.",
  sourceUrl: "https://nubank.com.br/conta-conjunta",
  baseReviewedAt: "2026-10-13",
};

describe("account-type overrides repository isolation (integration)", () => {
  it("lists only the scoped household's own corrections", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createAccountTypeOverridesRepository(householdA.scope).save(db, NUBANK_JOINT);

      const listA = await createAccountTypeOverridesRepository(householdA.scope).list(db);
      expect(listA.skipped).toBe(0);
      expect(listA.overrides).toEqual([{ ...NUBANK_JOINT, updatedAt: expect.any(Date) as Date }]);
      expect(await createAccountTypeOverridesRepository(householdB.scope).list(db)).toEqual({
        overrides: [],
        skipped: 0,
      });
    });
  });

  it("never overwrites, removes or rebases another household's correction of the same account type", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const repositoryA = createAccountTypeOverridesRepository(householdA.scope);
      const repositoryB = createAccountTypeOverridesRepository(householdB.scope);
      await repositoryA.save(db, NUBANK_JOINT);
      await repositoryB.save(db, { ...NUBANK_JOINT, offered: false, sourceUrl: null });
      await repositoryB.save(db, { ...NUBANK_JOINT, offered: false, note: "Confirmado de novo." });

      expect(await repositoryB.rebase(db, NUBANK_JOINT, "2026-11-01")).toBe(true);
      await repositoryB.remove(db, NUBANK_JOINT);

      const listA = await repositoryA.list(db);
      expect(listA.overrides.map((row) => [row.offered, row.baseReviewedAt])).toEqual([
        [true, "2026-10-13"],
      ]);
      expect((await repositoryB.list(db)).overrides).toEqual([]);
      expect(await repositoryB.rebase(db, NUBANK_JOINT, "2026-11-01")).toBe(false);
      expect(await db.select().from(bankAccountTypeOverride)).toHaveLength(1);
    });
  });

  it("skips a row naming an institution or an account type Feudo no longer profiles", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await db.insert(bankAccountTypeOverride).values([
        { householdId: householdA.id, ...NUBANK_JOINT, institutionId: "banco-extinto" },
        { householdId: householdA.id, ...NUBANK_JOINT, accountType: "poupanca" },
      ]);

      expect(await createAccountTypeOverridesRepository(householdA.scope).list(db)).toEqual({
        overrides: [],
        skipped: 2,
      });
    });
  });
});
