import { describe, expect, it } from "vitest";

import { householdScope, updateReserveMultiple } from "@/modules/households";
import { householdSettings } from "@/modules/households/schema";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { seedHousehold, seedUser, withTwoUsers } from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import {
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
} from "./repository";
import { closeReserveTargetMonthForHousehold, runReserveMonthCloseStep } from "./service";

import type { Database } from "@/platform/db/client";
import type { HouseholdScope } from "@/modules/households";
import type { SeededUser } from "@/modules/sync/test/with-two-users";

// 01:30 UTC on 1 October 2026 is 30 September 2026, 22:30 in
// America/Sao_Paulo (the default time zone with no settings row) — the same
// instant overview-page-props.integration.test.ts anchors its own month on.
const NOW = new Date("2026-10-01T01:30:00.000Z");

function condoPayment(
  month: string,
  amountCentavos: number,
  id: string,
): ReturnType<typeof seedTransaction> {
  return seedTransaction({
    providerTransactionId: id,
    date: `${month}-10`,
    description: "PIX ENVIADO CONDOMINIO",
    type: "debit",
    amountCentavos: -amountCentavos,
  });
}

function uniformFixedTransactions(months: readonly string[], amountCentavos: number) {
  return months.map((month, index) =>
    condoPayment(month, amountCentavos, `condo-${month}-${String(index)}`),
  );
}

async function seedFixedHistory(
  db: Database,
  owner: SeededUser,
  household: HouseholdScope,
  months: readonly string[],
  amountCentavos: number,
): Promise<void> {
  await seedSyncedConnection(db, owner, {
    household,
    transactions: uniformFixedTransactions(months, amountCentavos),
  });
}

describe("closeReserveTargetMonthForHousehold (integration)", () => {
  it("records a target for the closed month from the household's own six-month window", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedFixedHistory(db, userA, scope, ["2026-06", "2026-07", "2026-08"], 80000);

      const outcome = await closeReserveTargetMonthForHousehold(db, scope, NOW);

      expect(outcome).toEqual({ status: "recorded", notified: false });
      const record = await createReserveTargetRecordRepository(scope).getByMonth(db, "2026-08");
      expect(record).toMatchObject({
        closedMonth: "2026-08",
        averageFixedCostCentavos: 80000,
        monthsUsed: 3,
        isEstimate: false,
        reserveMultiple: 6,
        targetCentavos: 480000,
        currency: "BRL",
      });
    });
  });

  it("is idempotent: a second run for the same closed month changes nothing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedFixedHistory(db, userA, scope, ["2026-06", "2026-07", "2026-08"], 80000);

      await closeReserveTargetMonthForHousehold(db, scope, NOW);
      const second = await closeReserveTargetMonthForHousehold(db, scope, NOW);

      expect(second).toEqual({ status: "skipped" });
      const record = await createReserveTargetRecordRepository(scope).getByMonth(db, "2026-08");
      expect(record?.targetCentavos).toBe(480000);
    });
  });

  it("skips recording with no categorized month in the window at all", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);

      const outcome = await closeReserveTargetMonthForHousehold(db, scope, NOW);

      expect(outcome).toEqual({ status: "skipped" });
      const record = await createReserveTargetRecordRepository(scope).getByMonth(db, "2026-08");
      expect(record).toBeUndefined();
    });
  });

  it("creates a notice when the target moves by strictly more than 10% from the previous record", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
      await seedFixedHistory(db, userA, scope, months, 120000);
      await createReserveTargetRecordRepository(scope).insert(db, {
        closedMonth: "2026-07",
        averageFixedCostCentavos: 100000,
        monthsUsed: 6,
        isEstimate: false,
        reserveMultiple: 6,
        targetCentavos: 600000,
        currency: "BRL",
      });

      const outcome = await closeReserveTargetMonthForHousehold(db, scope, NOW);

      expect(outcome).toEqual({ status: "recorded", notified: true });
      const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
      expect(notice).toMatchObject({
        closedMonth: "2026-08",
        previousTargetCentavos: 600000,
        newTargetCentavos: 720000,
      });
    });
  });

  it("does not create a notice when the target moves by exactly 10%", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
      await seedFixedHistory(db, userA, scope, months, 110000);
      await createReserveTargetRecordRepository(scope).insert(db, {
        closedMonth: "2026-07",
        averageFixedCostCentavos: 100000,
        monthsUsed: 6,
        isEstimate: false,
        reserveMultiple: 6,
        targetCentavos: 600000,
        currency: "BRL",
      });

      const outcome = await closeReserveTargetMonthForHousehold(db, scope, NOW);

      expect(outcome).toEqual({ status: "recorded", notified: false });
      const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
      expect(notice).toBeUndefined();
    });
  });

  it("changing only the reserve multiple never notifies on its own", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
      await seedFixedHistory(db, userA, scope, months, 100000);
      await db.insert(householdSettings).values({
        householdId: scope.householdId,
        timeZone: "America/Sao_Paulo",
        reserveMultiple: 6,
      });

      const firstClose = new Date("2026-10-01T01:30:00.000Z");
      const first = await closeReserveTargetMonthForHousehold(db, scope, firstClose);
      expect(first).toEqual({ status: "recorded", notified: false });

      await updateReserveMultiple(scope, 9, db);

      const secondClose = new Date("2026-11-01T01:30:00.000Z");
      const second = await closeReserveTargetMonthForHousehold(db, scope, secondClose);

      expect(second).toEqual({ status: "recorded", notified: false });
      const secondRecord = await createReserveTargetRecordRepository(scope).getByMonth(
        db,
        "2026-09",
      );
      expect(secondRecord?.targetCentavos).toBe(900000);
      const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
      expect(notice).toBeUndefined();
    });
  });

  it("the household's own time zone decides which month closes, not UTC", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      await db.insert(householdSettings).values([
        { householdId: scopeA.householdId, timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        { householdId: scopeB.householdId, timeZone: "Pacific/Kiritimati", reserveMultiple: 6 },
      ]);
      const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
      await seedFixedHistory(db, userA, scopeA, months, 50000);
      await seedFixedHistory(db, userB, scopeB, months, 50000);

      const outcomeA = await closeReserveTargetMonthForHousehold(db, scopeA, NOW);
      const outcomeB = await closeReserveTargetMonthForHousehold(db, scopeB, NOW);

      expect(outcomeA).toEqual({ status: "recorded", notified: false });
      expect(outcomeB).toEqual({ status: "recorded", notified: false });
      const recordA = await createReserveTargetRecordRepository(scopeA).getByMonth(db, "2026-08");
      const recordB = await createReserveTargetRecordRepository(scopeB).getByMonth(db, "2026-09");
      expect(recordA).toBeTruthy();
      expect(recordB).toBeTruthy();
    });
  });

  it("a month close for one household never writes another household's record", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      await seedFixedHistory(db, userA, scopeA, ["2026-06", "2026-07", "2026-08"], 80000);
      await seedFixedHistory(db, userB, scopeB, ["2026-06", "2026-07", "2026-08"], 999999);

      await closeReserveTargetMonthForHousehold(db, scopeA, NOW);

      const recordB = await createReserveTargetRecordRepository(scopeB).getByMonth(db, "2026-08");
      expect(recordB).toBeUndefined();
    });
  });
});

describe("runReserveMonthCloseStep (integration)", () => {
  it("counts recorded, skipped and failed households independently, without one household's error failing the others", async () => {
    await withTestDb(async (db) => {
      const householdA = await seedHousehold(db, "Recorded household");
      const userA = await seedUser(db, "Ana", householdA);
      const scopeA = householdScope(userA.session);
      await seedFixedHistory(db, userA, scopeA, ["2026-06", "2026-07", "2026-08"], 80000);

      const householdB = await seedHousehold(db, "No-history household");
      await seedUser(db, "Bia", householdB);

      const householdC = await seedHousehold(db, "Misconfigured household");
      const userC = await seedUser(db, "Caio", householdC);
      const scopeC = householdScope(userC.session);
      await seedFixedHistory(db, userC, scopeC, ["2026-06", "2026-07", "2026-08"], 80000);
      await db.insert(householdSettings).values({
        householdId: householdC,
        timeZone: "America/Sao_Paulo",
        reserveMultiple: 20,
      });

      const result = await runReserveMonthCloseStep(db, NOW);

      expect(result).toEqual({
        ok: false,
        recorded: 1,
        notified: 0,
        skipped: 1,
        failed: 1,
        unreached: 0,
      });
      const recordC = await createReserveTargetRecordRepository(scopeC).getByMonth(db, "2026-08");
      expect(recordC).toBeUndefined();
    });
  });

  it("stops before the deadline and reports the rest unreached, without touching them", async () => {
    await withTestDb(async (db) => {
      const householdA = await seedHousehold(db, "Household A");
      const userA = await seedUser(db, "Ana", householdA);
      const scopeA = householdScope(userA.session);
      await seedFixedHistory(db, userA, scopeA, ["2026-06", "2026-07", "2026-08"], 80000);

      const householdB = await seedHousehold(db, "Household B");
      const userB = await seedUser(db, "Bia", householdB);
      const scopeB = householdScope(userB.session);
      await seedFixedHistory(db, userB, scopeB, ["2026-06", "2026-07", "2026-08"], 60000);

      const alreadyPastDeadline = new Date(0);
      const result = await runReserveMonthCloseStep(db, NOW, alreadyPastDeadline);

      expect(result).toEqual({
        ok: false,
        recorded: 0,
        notified: 0,
        skipped: 0,
        failed: 0,
        unreached: 2,
      });
      const recordA = await createReserveTargetRecordRepository(scopeA).getByMonth(db, "2026-08");
      const recordB = await createReserveTargetRecordRepository(scopeB).getByMonth(db, "2026-08");
      expect(recordA).toBeUndefined();
      expect(recordB).toBeUndefined();
    });
  });

  it("orders households deterministically by id, so a cut-short run resumes progress tomorrow", async () => {
    await withTestDb(async (db) => {
      const householdA = await seedHousehold(db, "Household A");
      await seedUser(db, "Ana", householdA);
      const householdB = await seedHousehold(db, "Household B");
      await seedUser(db, "Bia", householdB);

      const first = await runReserveMonthCloseStep(db, NOW, new Date(0));
      const second = await runReserveMonthCloseStep(db, NOW, new Date(0));

      expect(first).toMatchObject({ unreached: 2 });
      expect(second).toMatchObject({ unreached: 2 });
    });
  });
});
