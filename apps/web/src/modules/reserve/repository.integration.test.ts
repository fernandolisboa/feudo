import { describe, expect, it } from "vitest";

import { withTwoHouseholds } from "@/modules/households/test/with-two-households";
import { withTestDb } from "@/platform/db/test/harness";

import {
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
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
});
