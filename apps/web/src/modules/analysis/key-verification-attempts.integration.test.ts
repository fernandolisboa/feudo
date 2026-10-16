import { describe, expect, it } from "vitest";

import { joinHousehold, seedHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import {
  createKeyVerificationAttemptRepository,
  HOUSEHOLD_HOURLY_LIMIT,
  USER_DAILY_LIMIT,
} from "./key-verification-attempts";

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
