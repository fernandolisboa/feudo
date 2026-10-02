import { describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";

import { householdScope, type HouseholdSession } from "@/modules/households";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type SeededUser } from "@/modules/sync/test/with-two-users";

import type { Database } from "@/platform/db/client";
import { AI_MODELS, type AiClient, type AiFailure } from "./ai-client";
import { createFakeAiClient } from "./fake-client";
import { CURRENT_ANALYST_PROMPT } from "./prompts";
import { createAnalysisRepository } from "./repository";
import { householdAnalysis } from "./schema";
import {
  requestOnDemandAnalysis,
  runMonthlyAnalysisStep,
  RUNNING_STALE_MS,
  type AnalysisDeps,
} from "./service";
import { FIXTURE_INPUT } from "./test/fixtures";

const fakeDeps: AnalysisDeps = { client: createFakeAiClient(), prompt: CURRENT_ANALYST_PROMPT };

function failingDeps(status: AiFailure): AnalysisDeps {
  const client: AiClient = {
    complete: () => Promise.resolve({ status, model: null, usage: null }),
  };
  return { client, prompt: CURRENT_ANALYST_PROMPT };
}

function options(now: Date = new Date()) {
  return { now, deadline: new Date(Date.now() + 5 * 60_000) };
}

function inHousehold(user: SeededUser, householdId: string): HouseholdSession {
  return { ...user.session, householdId };
}

async function seedLedger(db: Database, owner: SeededUser, householdId: string): Promise<void> {
  const itemId = `item-${householdId}`;
  await seedSyncedConnection(db, owner, {
    household: { householdId },
    itemId,
    accounts: [seedAccount({ providerAccountId: `${itemId}-acc`, providerItemId: itemId })],
    transactions: [
      seedTransaction({
        providerTransactionId: `${itemId}-salary`,
        providerAccountId: `${itemId}-acc`,
        date: "2026-09-05",
        description: "SALARIO",
        type: "credit",
        amountCentavos: 500000,
      }),
      seedTransaction({
        providerTransactionId: `${itemId}-groceries`,
        providerAccountId: `${itemId}-acc`,
        date: "2026-09-07",
        description: "COMPRA MERCADO",
        type: "debit",
        amountCentavos: -20000,
      }),
    ],
  });
}

async function rowsOf(db: Database, householdId: string) {
  return db
    .select()
    .from(householdAnalysis)
    .where(eq(householdAnalysis.householdId, householdId))
    .orderBy(asc(householdAnalysis.createdAt));
}

function reservation(localDay: string) {
  return {
    row: {
      period: FIXTURE_INPUT.month,
      localDay,
      promptVersion: CURRENT_ANALYST_PROMPT.version,
      requestedModel: AI_MODELS.standard,
      input: FIXTURE_INPUT,
      requestedByUserId: null,
    },
    limit: 3,
    staleBefore: new Date(Date.now() - RUNNING_STALE_MS),
  };
}

describe("household_analysis isolation (integration)", () => {
  it("never lets household A read, count or complete household B's readings", async () => {
    await withTwoUsers(async ({ db, userB, householdA, householdB }) => {
      await seedLedger(db, userB, householdB);
      expect(await requestOnDemandAnalysis(userB.session, db, fakeDeps, options())).toEqual({
        status: "ok",
      });
      const [othersRow] = await rowsOf(db, householdB);
      if (!othersRow) {
        throw new Error("household B has no reading");
      }

      const repositoryA = createAnalysisRepository({ householdId: householdA });
      expect(await repositoryA.latestSucceeded(db)).toBeNull();
      expect(await repositoryA.countOnDemandOn(db, othersRow.localDay)).toBe(0);
      expect(await repositoryA.hasRunningSince(db, new Date(0))).toBe(false);

      await repositoryA.fail(db, othersRow.id, {
        model: null,
        inputTokens: null,
        outputTokens: null,
        failureReason: "tampered",
      });
      const [after] = await rowsOf(db, householdB);
      expect(after).toMatchObject({ status: "succeeded", failureReason: null });
      expect(await rowsOf(db, householdA)).toEqual([]);
    });
  });

  it("keeps each household's daily quota apart", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await seedLedger(db, userA, householdA);
      await seedLedger(db, userB, householdB);
      for (let press = 0; press < 3; press += 1) {
        await requestOnDemandAnalysis(userA.session, db, fakeDeps, options());
      }

      expect(await requestOnDemandAnalysis(userA.session, db, fakeDeps, options())).toEqual({
        status: "quota_exhausted",
      });
      expect(await requestOnDemandAnalysis(userB.session, db, fakeDeps, options())).toEqual({
        status: "ok",
      });
    });
  });
});

describe("requestOnDemandAnalysis (integration)", () => {
  it("stores the reading with its input, prompt version, models and requester", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedLedger(db, userA, householdA);

      expect(await requestOnDemandAnalysis(userA.session, db, fakeDeps, options())).toEqual({
        status: "ok",
      });

      const [row] = await rowsOf(db, householdA);
      expect(row).toMatchObject({
        kind: "on_demand",
        status: "succeeded",
        promptVersion: CURRENT_ANALYST_PROMPT.version,
        requestedModel: AI_MODELS.standard,
        model: `fake-${AI_MODELS.standard}`,
        requestedByUserId: userA.id,
        failureReason: null,
      });
      expect(row?.input).toMatchObject({ kind: "on_demand" });
      expect(row?.output).toMatchObject({ citedKeys: expect.any(Array) as unknown });
      expect(row?.completedAt).toBeInstanceOf(Date);
      expect(
        await createAnalysisRepository(householdScope(userA.session)).latestSucceeded(db),
      ).not.toBeNull();
    });
  });

  it("shares three readings a day between members and counts a failed one", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      await seedLedger(db, userA, householdA);
      const partner = inHousehold(userB, householdA);

      const outcomes = [
        await requestOnDemandAnalysis(userA.session, db, failingDeps("unavailable"), options()),
        await requestOnDemandAnalysis(partner, db, fakeDeps, options()),
        await requestOnDemandAnalysis(userA.session, db, fakeDeps, options()),
        await requestOnDemandAnalysis(partner, db, fakeDeps, options()),
      ];

      expect(outcomes.map((outcome) => outcome.status)).toEqual([
        "failed",
        "ok",
        "ok",
        "quota_exhausted",
      ]);
      const rows = await rowsOf(db, householdA);
      expect(rows.map((row) => row.status)).toEqual(["failed", "succeeded", "succeeded"]);
      expect(rows[0]).toMatchObject({ failureReason: "unavailable" });
    });
  });

  it("refuses a second reading while one is running, and frees a stale one", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedLedger(db, userA, householdA);
      const repository = createAnalysisRepository({ householdId: householdA });
      const now = new Date();
      const reserved = await repository.reserveOnDemand(db, reservation("2026-10-01"));
      expect(reserved.status).toBe("reserved");

      expect(await requestOnDemandAnalysis(userA.session, db, fakeDeps, options(now))).toEqual({
        status: "in_progress",
      });

      const later = new Date(now.getTime() + RUNNING_STALE_MS + 60_000);
      expect(await requestOnDemandAnalysis(userA.session, db, fakeDeps, options(later))).toEqual({
        status: "ok",
      });
      const rows = await rowsOf(db, householdA);
      expect(rows[0]).toMatchObject({ status: "failed", failureReason: "abandoned" });
    });
  });

  it("spends nothing on a household with no account", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      expect(await requestOnDemandAnalysis(userA.session, db, fakeDeps, options())).toEqual({
        status: "no_accounts",
      });
      expect(await rowsOf(db, householdA)).toEqual([]);
    });
  });

  it("is off when no AI provider is configured", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedLedger(db, userA, householdA);
      const off: AnalysisDeps = { client: null, prompt: CURRENT_ANALYST_PROMPT };
      expect(await requestOnDemandAnalysis(userA.session, db, off, options())).toEqual({
        status: "disabled",
      });
      expect(await rowsOf(db, householdA)).toEqual([]);
    });
  });
});

describe("runMonthlyAnalysisStep (integration)", () => {
  it("writes one deep reading per household with an account, and skips them on the next run", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await seedLedger(db, userA, householdA);
      await seedLedger(db, userB, householdB);

      expect(await runMonthlyAnalysisStep(db, fakeDeps, options())).toEqual({
        ok: true,
        disabled: false,
        succeeded: 2,
        failed: 0,
        skipped: 0,
        unreached: 0,
      });
      expect(await runMonthlyAnalysisStep(db, fakeDeps, options())).toMatchObject({
        succeeded: 0,
        skipped: 2,
      });

      for (const householdId of [householdA, householdB]) {
        const rows = await rowsOf(db, householdId);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
          kind: "monthly",
          status: "succeeded",
          requestedModel: AI_MODELS.deep,
          requestedByUserId: null,
        });
      }
    });
  });

  it("stops retrying a month after three failures", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedLedger(db, userA, householdA);
      const failing = failingDeps("unavailable");

      for (let run = 0; run < 3; run += 1) {
        expect(await runMonthlyAnalysisStep(db, failing, options())).toMatchObject({
          ok: false,
          failed: 1,
        });
      }
      expect(await runMonthlyAnalysisStep(db, failing, options())).toMatchObject({
        ok: true,
        failed: 0,
        skipped: 1,
      });
      expect(await rowsOf(db, householdA)).toHaveLength(3);
    });
  });

  it("does nothing when the analyst is off", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedLedger(db, userA, householdA);
      const off: AnalysisDeps = { client: null, prompt: CURRENT_ANALYST_PROMPT };
      expect(await runMonthlyAnalysisStep(db, off, options())).toMatchObject({ disabled: true });
      expect(await rowsOf(db, householdA)).toEqual([]);
    });
  });
});
