import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { organization } from "@/modules/auth/schema";
import { householdScope } from "@/modules/households";
import { withTwoHouseholds } from "@/modules/households/test/with-two-households";
import {
  moveSeededAccount,
  seedAccount,
  seedSyncedConnection,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import {
  createReserveMarkRepository,
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
  listHouseholdIdsForMonthClose,
} from "./repository";
import type { HouseholdScope } from "@/modules/households";

const RECORD = {
  closedMonth: "2026-08" as const,
  averageFixedCostCentavos: 90000,
  monthsUsed: 3,
  isEstimate: false,
  reserveMultiple: 6,
  targetCentavos: 540000,
  currency: "BRL",
};

describe("reserve target record repository isolation (integration)", () => {
  it("reads only the scoped household's own records", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createReserveTargetRecordRepository(householdA.scope).insert(db, RECORD);
      await createReserveTargetRecordRepository(householdB.scope).insert(db, {
        ...RECORD,
        averageFixedCostCentavos: 50000,
        targetCentavos: 300000,
      });

      const recordA = await createReserveTargetRecordRepository(householdA.scope).getByMonth(
        db,
        "2026-08",
      );
      const recordB = await createReserveTargetRecordRepository(householdB.scope).getByMonth(
        db,
        "2026-08",
      );

      expect(recordA?.targetCentavos).toBe(540000);
      expect(recordB?.targetCentavos).toBe(300000);
    });
  });

  it("does not let one household's insert collide with another's unique (household, month) constraint", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createReserveTargetRecordRepository(householdA.scope).insert(db, RECORD);
      const insertedB = await createReserveTargetRecordRepository(householdB.scope).insert(
        db,
        RECORD,
      );

      expect(insertedB).not.toBeUndefined();
    });
  });

  it("getLatestBefore never returns another household's record", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createReserveTargetRecordRepository(householdB.scope).insert(db, {
        ...RECORD,
        closedMonth: "2026-07",
      });

      const latestForA = await createReserveTargetRecordRepository(
        householdA.scope,
      ).getLatestBefore(db, "2026-08");

      expect(latestForA).toBeUndefined();
    });
  });

  it("onConflictDoNothing makes a second insert for the same household and month a no-op", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const repository = createReserveTargetRecordRepository(householdA.scope);
      const first = await repository.insert(db, RECORD);
      const second = await repository.insert(db, { ...RECORD, targetCentavos: 999999 });

      expect(first).not.toBeUndefined();
      expect(second).toBeUndefined();
      const stored = await repository.getByMonth(db, "2026-08");
      expect(stored?.targetCentavos).toBe(540000);
    });
  });
});

describe("reserve target notice repository isolation (integration)", () => {
  it("reads only the scoped household's own undismissed notice", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createReserveTargetNoticeRepository(householdA.scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 300000,
        newTargetCentavos: 400000,
      });
      await createReserveTargetNoticeRepository(householdB.scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 100000,
        newTargetCentavos: 200000,
      });

      const noticeA = await createReserveTargetNoticeRepository(householdA.scope).getUndismissed(
        db,
      );
      const noticeB = await createReserveTargetNoticeRepository(householdB.scope).getUndismissed(
        db,
      );

      expect(noticeA?.newTargetCentavos).toBe(400000);
      expect(noticeB?.newTargetCentavos).toBe(200000);
    });
  });

  it("cannot dismiss another household's notice: the call is a no-op, not an error", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await createReserveTargetNoticeRepository(householdB.scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 100000,
        newTargetCentavos: 200000,
      });
      const noticeB = await createReserveTargetNoticeRepository(householdB.scope).getUndismissed(
        db,
      );
      if (!noticeB) throw new Error("test setup: notice B was not created");

      const dismissedByA = await createReserveTargetNoticeRepository(householdA.scope).dismiss(
        db,
        noticeB.id,
      );

      expect(dismissedByA).toBe(false);
      const stillUndismissed = await createReserveTargetNoticeRepository(
        householdB.scope,
      ).getUndismissed(db);
      expect(stillUndismissed?.id).toBe(noticeB.id);
    });
  });

  it("dismissing an unknown notice id is a no-op, not an error", async () => {
    await withTestDb(async (db) => {
      const scope: HouseholdScope = { householdId: crypto.randomUUID() };
      const dismissed = await createReserveTargetNoticeRepository(scope).dismiss(
        db,
        crypto.randomUUID(),
      );
      expect(dismissed).toBe(false);
    });
  });

  it("dismisses the scoped household's own notice", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      await createReserveTargetNoticeRepository(householdA.scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 100000,
        newTargetCentavos: 200000,
      });
      const notice = await createReserveTargetNoticeRepository(householdA.scope).getUndismissed(db);
      if (!notice) throw new Error("test setup: notice was not created");

      const dismissed = await createReserveTargetNoticeRepository(householdA.scope).dismiss(
        db,
        notice.id,
      );

      expect(dismissed).toBe(true);
      const afterDismissal = await createReserveTargetNoticeRepository(
        householdA.scope,
      ).getUndismissed(db);
      expect(afterDismissal).toBeUndefined();
    });
  });

  it("dismissing an already-dismissed notice is idempotent: ok again, not not_found", async () => {
    await withTwoHouseholds(async ({ db, householdA }) => {
      const repository = createReserveTargetNoticeRepository(householdA.scope);
      await repository.insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 100000,
        newTargetCentavos: 200000,
      });
      const notice = await repository.getUndismissed(db);
      if (!notice) throw new Error("test setup: notice was not created");

      const first = await repository.dismiss(db, notice.id);
      const second = await repository.dismiss(db, notice.id);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });

  it("dismissing one notice also supersedes every older undismissed notice of the same household", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const repository = createReserveTargetNoticeRepository(householdA.scope);
      await repository.insert(db, {
        closedMonth: "2026-07",
        previousTargetCentavos: 100000,
        newTargetCentavos: 200000,
      });
      await repository.insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 200000,
        newTargetCentavos: 300000,
      });
      const otherHouseholdRepository = createReserveTargetNoticeRepository(householdB.scope);
      await otherHouseholdRepository.insert(db, {
        closedMonth: "2026-07",
        previousTargetCentavos: 50000,
        newTargetCentavos: 90000,
      });

      const latest = await repository.getUndismissed(db);
      if (!latest || latest.closedMonth !== "2026-08") {
        throw new Error("test setup: latest notice was not the August one");
      }

      const dismissed = await repository.dismiss(db, latest.id);

      expect(dismissed).toBe(true);
      expect(await repository.getUndismissed(db)).toBeUndefined();
      expect(await otherHouseholdRepository.getUndismissed(db)).not.toBeUndefined();
    });
  });
});

describe("listHouseholdIdsForMonthClose (integration)", () => {
  it("lists every household, not just one session's own", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const scopes = await listHouseholdIdsForMonthClose(db);
      const ids = scopes.map((scope) => scope.householdId);
      expect(ids).toEqual(expect.arrayContaining([householdA.id, householdB.id]));
    });
  });

  it("skips a household pending deletion, so a restore finds nothing written meanwhile", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      await db
        .update(organization)
        .set({ deletionRequestedAt: new Date() })
        .where(eq(organization.id, householdA.id));

      const ids = (await listHouseholdIdsForMonthClose(db)).map((scope) => scope.householdId);

      expect(ids).toContain(householdB.id);
      expect(ids).not.toContain(householdA.id);
    });
  });

  it("orders households deterministically by id", async () => {
    await withTwoHouseholds(async ({ db, householdA, householdB }) => {
      const scopes = await listHouseholdIdsForMonthClose(db);
      const ids = scopes.map((scope) => scope.householdId);
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
      expect(ids).toEqual(expect.arrayContaining([householdA.id, householdB.id]));
    });
  });
});

const MARK = { isReserve: true, liquidity: "daily" as const, institutionId: "inter" };

describe("reserve mark repository isolation (integration)", () => {
  it("lists only the scoped household's accounts, never a credit card, each with its own mark", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      const seededA = await seedSyncedConnection(db, userA, {
        household: scopeA,
        accounts: [
          seedAccount({ providerAccountId: "a-checking" }),
          seedAccount({ providerAccountId: "a-card", type: "credit_card", name: "Cartão" }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: scopeB,
        accounts: [seedAccount({ providerAccountId: "b-checking", name: "Conta da B" })],
      });
      const checkingA = seededA.accountIdsByProvider.get("a-checking") ?? "";
      expect(
        await createReserveMarkRepository(scopeA).set(
          db,
          { accountId: checkingA, ...MARK },
          userA.id,
        ),
      ).toBe("ok");

      const positionsA = await createReserveMarkRepository(scopeA).listPositions(db);
      const positionsB = await createReserveMarkRepository(scopeB).listPositions(db);

      expect(positionsA.map((row) => [row.accountId, row.isReserve, row.liquidity])).toEqual([
        [checkingA, true, "daily"],
      ]);
      expect(positionsB.map((row) => [row.name, row.isReserve, row.liquidity])).toEqual([
        ["Conta da B", false, null],
      ]);
    });
  });

  it("refuses to mark another household's account, writing nothing", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      const seededB = await seedSyncedConnection(db, userB, {
        household: scopeB,
        accounts: [seedAccount({ providerAccountId: "b-checking" })],
      });
      const accountB = seededB.accountIdsByProvider.get("b-checking") ?? "";

      const outcome = await createReserveMarkRepository(scopeA).set(
        db,
        { accountId: accountB, ...MARK },
        userA.id,
      );

      expect(outcome).toBe("not_found");
      const [rowB] = await createReserveMarkRepository(scopeB).listPositions(db);
      expect(rowB?.isReserve).toBe(false);
      expect(rowB?.institutionId).toBeNull();
    });
  });

  it("refuses to mark a credit card or an unknown account", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scopeA = householdScope(userA.session);
      const seeded = await seedSyncedConnection(db, userA, {
        household: scopeA,
        accounts: [seedAccount({ providerAccountId: "card", type: "credit_card" })],
      });
      const repository = createReserveMarkRepository(scopeA);

      expect(
        await repository.set(
          db,
          { accountId: seeded.accountIdsByProvider.get("card") ?? "", ...MARK },
          userA.id,
        ),
      ).toBe("not_found");
      expect(await repository.set(db, { accountId: "missing", ...MARK }, userA.id)).toBe(
        "not_found",
      );
    });
  });

  it("updates a mark in place", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scopeA = householdScope(userA.session);
      const seeded = await seedSyncedConnection(db, userA, { household: scopeA });
      const accountId = seeded.accountIdsByProvider.get("acc-1") ?? "";
      const repository = createReserveMarkRepository(scopeA);

      await repository.set(db, { accountId, ...MARK }, userA.id);
      await repository.set(
        db,
        { accountId, isReserve: false, liquidity: null, institutionId: "unlisted" },
        userA.id,
      );

      expect(await repository.listPositions(db)).toMatchObject([
        { accountId, isReserve: false, liquidity: null, institutionId: "unlisted" },
      ]);
    });
  });

  it("leaves a household's mark behind when its account moves to another household", async () => {
    await withTwoUsers(async ({ db, userA, householdB }) => {
      const scopeA = householdScope(userA.session);
      const seeded = await seedSyncedConnection(db, userA, { household: scopeA });
      const accountId = seeded.accountIdsByProvider.get("acc-1") ?? "";
      await createReserveMarkRepository(scopeA).set(db, { accountId, ...MARK }, userA.id);
      await joinHousehold(db, userA.id, householdB);

      expect(await moveSeededAccount(db, userA, accountId, householdB)).toBe("ok");

      const inB = await createReserveMarkRepository({ householdId: householdB }).listPositions(db);
      expect(inB).toMatchObject([{ accountId, isReserve: false, liquidity: null }]);
      expect(await createReserveMarkRepository(scopeA).listPositions(db)).toEqual([]);
    });
  });
});
