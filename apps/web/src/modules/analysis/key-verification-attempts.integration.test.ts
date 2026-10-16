import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { joinHousehold, seedHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import {
  createKeyVerificationAttemptRepository,
  HOUSEHOLD_HOURLY_LIMIT,
  USER_DAILY_LIMIT,
} from "./key-verification-attempts";
import { runDailyPruneStep } from "./prune";
import { aiKeyVerificationAttempt } from "./schema";

describe("ai_key_verification_attempt isolation (integration)", () => {
  it("never lets household A's attempts count toward household B's hourly limit", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const repositoryA = createKeyVerificationAttemptRepository({ householdId: householdA });
      const repositoryB = createKeyVerificationAttemptRepository({ householdId: householdB });
      const now = new Date();

      for (let attempt = 0; attempt < HOUSEHOLD_HOURLY_LIMIT; attempt += 1) {
        expect(await repositoryA.reserve(db, { userId: userA.id, now })).toEqual({
          status: "reserved",
        });
      }
      expect(await repositoryA.reserve(db, { userId: userA.id, now })).toEqual({
        status: "rate_limited",
      });

      expect(await repositoryB.reserve(db, { userId: userB.id, now })).toEqual({
        status: "reserved",
      });
    });
  });
});

describe("createKeyVerificationAttemptRepository (integration)", () => {
  it("rate-limits the household after its own hourly limit, resetting once the window rolls forward", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createKeyVerificationAttemptRepository({ householdId: householdA });
      const now = new Date();
      for (let attempt = 0; attempt < HOUSEHOLD_HOURLY_LIMIT; attempt += 1) {
        expect(await repository.reserve(db, { userId: userA.id, now })).toEqual({
          status: "reserved",
        });
      }

      expect(await repository.reserve(db, { userId: userA.id, now })).toEqual({
        status: "rate_limited",
      });

      const anHourAndAMinuteLater = new Date(now.getTime() + 61 * 60_000);
      expect(
        await repository.reserve(db, { userId: userA.id, now: anHourAndAMinuteLater }),
      ).toEqual({ status: "reserved" });
    });
  });

  it("rate-limits a single member by their own daily total across every household they belong to", async () => {
    await withTwoUsers(async ({ db, userA, householdA, householdB }) => {
      await joinHousehold(db, userA.id, householdB);
      const householdC = await seedHousehold(db, "Household C");
      await joinHousehold(db, userA.id, householdC, "owner");
      const householdD = await seedHousehold(db, "Household D");
      await joinHousehold(db, userA.id, householdD, "owner");
      const repositories = [householdA, householdB, householdC, householdD].map((householdId) =>
        createKeyVerificationAttemptRepository({ householdId }),
      );
      const now = new Date();
      const attemptsPerHousehold = [3, 3, 2, 2];

      for (const [index, repository] of repositories.entries()) {
        for (let attempt = 0; attempt < (attemptsPerHousehold[index] ?? 0); attempt += 1) {
          expect(await repository.reserve(db, { userId: userA.id, now })).toEqual({
            status: "reserved",
          });
        }
      }

      expect(attemptsPerHousehold.reduce((total, count) => total + count, 0)).toBe(
        USER_DAILY_LIMIT,
      );

      const thirdHouseholdRepository = repositories[2];
      if (!thirdHouseholdRepository) {
        throw new Error("expected a third household's repository");
      }
      expect(await thirdHouseholdRepository.reserve(db, { userId: userA.id, now })).toEqual({
        status: "rate_limited",
      });
    });
  });

  it("prunes rows older than 24h across every household, not only the one that last reserved", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const now = new Date("2026-10-16T12:00:00.000Z");
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60_000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60_000);
      await db.insert(aiKeyVerificationAttempt).values([
        { householdId: householdA, userId: userA.id, attemptedAt: twoDaysAgo },
        { householdId: householdA, userId: userA.id, attemptedAt: oneHourAgo },
        { householdId: householdB, userId: userB.id, attemptedAt: twoDaysAgo },
        { householdId: householdB, userId: userB.id, attemptedAt: oneHourAgo },
      ]);

      expect(await runDailyPruneStep(db, now)).toEqual({ deleted: 2 });

      const remaining = await db
        .select({ householdId: aiKeyVerificationAttempt.householdId })
        .from(aiKeyVerificationAttempt)
        .where(eq(aiKeyVerificationAttempt.attemptedAt, oneHourAgo));
      expect(remaining).toHaveLength(2);
      const stale = await db
        .select({ householdId: aiKeyVerificationAttempt.householdId })
        .from(aiKeyVerificationAttempt)
        .where(eq(aiKeyVerificationAttempt.attemptedAt, twoDaysAgo));
      expect(stale).toHaveLength(0);
    });
  });

  it("shares the household's hourly limit across every member, not a separate pool each", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA);
      const repository = createKeyVerificationAttemptRepository({ householdId: householdA });
      const now = new Date();
      for (let attempt = 0; attempt < HOUSEHOLD_HOURLY_LIMIT; attempt += 1) {
        expect(await repository.reserve(db, { userId: userA.id, now })).toEqual({
          status: "reserved",
        });
      }

      expect(await repository.reserve(db, { userId: userB.id, now })).toEqual({
        status: "rate_limited",
      });
    });
  });
});
