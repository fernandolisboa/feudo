import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({ getCurrentSession: getCurrentSessionMock }));

import type { Database } from "@/platform/db/client";
import { user } from "@/modules/auth/schema";
import { withTestDb } from "@/platform/db/test/harness";

import { userTour } from "./schema";
import { getTourState, recordTourOutcome, resetTours, updateTourAutoStart } from "./service";
import { TOURS } from "./tours";

const userAId = "tour-isolation-user-a";
const userBId = "tour-isolation-user-b";

beforeEach(() => {
  getCurrentSessionMock.mockReset();
});

async function insertUser(db: Database, id: string): Promise<void> {
  await db.insert(user).values({
    id,
    name: `Tour Isolation ${id}`,
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
}

async function seedTwoUsers(db: Database): Promise<void> {
  await insertUser(db, userAId);
  await insertUser(db, userBId);
}

function signInAs(userId: string): void {
  getCurrentSessionMock.mockResolvedValue({
    userId,
    name: userId,
    email: `${userId}@example.com`,
    householdId: null,
    theme: "caderno",
  });
}

describe("guided tour state", () => {
  it("starts with auto-start on and no tour seen", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);

      expect(await getTourState({ userId: userAId })).toEqual({
        autoStart: true,
        seenVersions: {},
      });
    });
  });

  it("records an outcome at the tour's current version, for the signed-in user only", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);

      expect(
        await recordTourOutcome({
          tourId: "overview",
          outcome: "dismissed",
          turnOffAutoStart: false,
        }),
      ).toEqual({ status: "ok" });

      expect(await getTourState({ userId: userAId })).toEqual({
        autoStart: true,
        seenVersions: { overview: TOURS.overview.version },
      });
      expect(await getTourState({ userId: userBId })).toEqual({
        autoStart: true,
        seenVersions: {},
      });
      const rowsForB = await db.select().from(userTour).where(eq(userTour.userId, userBId));
      expect(rowsForB).toEqual([]);
    });
  });

  it("overwrites an earlier outcome for the same tour instead of adding a row", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);
      await db.insert(userTour).values({
        userId: userAId,
        tourId: "overview",
        tourVersion: 0,
        outcome: "dismissed",
      });

      await recordTourOutcome({
        tourId: "overview",
        outcome: "completed",
        turnOffAutoStart: false,
      });

      const rows = await db.select().from(userTour).where(eq(userTour.userId, userAId));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tourVersion).toBe(TOURS.overview.version);
      expect(rows[0]?.outcome).toBe("completed");
    });
  });

  it("'Não mostrar tutoriais' records the dismissal and turns auto-start off for that user only", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);

      await recordTourOutcome({
        tourId: "household",
        outcome: "dismissed",
        turnOffAutoStart: true,
      });

      expect(await getTourState({ userId: userAId })).toEqual({
        autoStart: false,
        seenVersions: { household: TOURS.household.version },
      });
      expect((await getTourState({ userId: userBId })).autoStart).toBe(true);
    });
  });

  it("changes the auto-start switch for the signed-in user only", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);

      signInAs(userBId);
      expect(await updateTourAutoStart({ autoStart: "off" })).toEqual({ status: "ok" });
      expect((await getTourState({ userId: userAId })).autoStart).toBe(true);
      expect((await getTourState({ userId: userBId })).autoStart).toBe(false);

      expect(await updateTourAutoStart({ autoStart: "on" })).toEqual({ status: "ok" });
      expect((await getTourState({ userId: userBId })).autoStart).toBe(true);
    });
  });

  it("replaying all tutorials deletes the signed-in user's outcomes, never another user's", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);
      await recordTourOutcome({
        tourId: "overview",
        outcome: "completed",
        turnOffAutoStart: false,
      });
      signInAs(userBId);
      await recordTourOutcome({
        tourId: "overview",
        outcome: "dismissed",
        turnOffAutoStart: false,
      });

      signInAs(userAId);
      expect(await resetTours()).toEqual({ status: "ok" });

      expect((await getTourState({ userId: userAId })).seenVersions).toEqual({});
      expect((await getTourState({ userId: userBId })).seenVersions).toEqual({
        overview: TOURS.overview.version,
      });
    });
  });

  it("rejects a tour id outside the tour list and writes nothing", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);

      expect(
        await recordTourOutcome({
          tourId: "reserve",
          outcome: "dismissed",
          turnOffAutoStart: false,
        }),
      ).toEqual({ status: "invalid" });
      expect(await db.select().from(userTour)).toEqual([]);
    });
  });

  it("writes nothing without a session", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      getCurrentSessionMock.mockResolvedValue(null);

      expect(
        await recordTourOutcome({
          tourId: "overview",
          outcome: "dismissed",
          turnOffAutoStart: true,
        }),
      ).toEqual({ status: "unauthenticated" });
      expect(await updateTourAutoStart({ autoStart: "off" })).toEqual({
        status: "unauthenticated",
      });
      expect(await resetTours()).toEqual({ status: "unauthenticated" });
      expect(await db.select().from(userTour)).toEqual([]);
      expect((await getTourState({ userId: userAId })).autoStart).toBe(true);
    });
  });

  it("deletes a user's tour progress with the user", async () => {
    await withTestDb(async (db) => {
      await seedTwoUsers(db);
      signInAs(userAId);
      await recordTourOutcome({
        tourId: "overview",
        outcome: "completed",
        turnOffAutoStart: false,
      });

      await db.delete(user).where(eq(user.id, userAId));

      expect(await db.select().from(userTour).where(eq(userTour.userId, userAId))).toEqual([]);
    });
  });
});
