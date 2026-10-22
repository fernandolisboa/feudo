import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { user } from "@/modules/auth/schema";
import { bankConnection, bankConnectionConsent, providerCredential } from "@/modules/sync/schema";
import { seedHousehold, seedUser } from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import { runUnverifiedSignUpPruneStep } from "./unverified-sign-up-prune";

const NOW = new Date("2026-10-22T12:00:00.000Z");
const DAY_MS = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

async function signUp(
  db: Database,
  id: string,
  options: { emailVerified: boolean; ageDays: number },
): Promise<string> {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: options.emailVerified,
    termsVersion: "test",
    termsAcceptedAt: daysAgo(options.ageDays),
    createdAt: daysAgo(options.ageDays),
  });
  return id;
}

async function remainingUserIds(db: Database): Promise<string[]> {
  const rows = await db.select({ id: user.id }).from(user);
  return rows.map((row) => row.id).sort();
}

describe("runUnverifiedSignUpPruneStep (integration)", () => {
  it("deletes an unverified sign-up older than 7 days and keeps recent, at-cutoff, verified and anchored ones", async () => {
    await withTestDb(async (db) => {
      await signUp(db, "stale-unverified", { emailVerified: false, ageDays: 8 });
      await signUp(db, "recent-unverified", { emailVerified: false, ageDays: 6 });
      await signUp(db, "at-cutoff-unverified", { emailVerified: false, ageDays: 7 });
      await signUp(db, "old-verified", { emailVerified: true, ageDays: 30 });

      const withMember = await seedUser(db, "with-member", await seedHousehold(db, "Casa"));
      await db
        .update(user)
        .set({ emailVerified: false, createdAt: daysAgo(30) })
        .where(eq(user.id, withMember.id));

      const withConnection = await signUp(db, "with-connection", {
        emailVerified: false,
        ageDays: 30,
      });
      const [consent] = await db
        .insert(bankConnectionConsent)
        .values({ userId: withConnection, scopeVersion: "v", scopeText: "text" })
        .returning({ id: bankConnectionConsent.id });
      if (!consent) throw new Error("test setup: consent was not created");
      await db.insert(bankConnection).values({
        userId: withConnection,
        provider: "pluggy",
        providerItemId: "item-1",
        institutionName: "Banco Fixture",
        institutionProviderId: "601",
        consentId: consent.id,
      });

      const withCredential = await signUp(db, "with-credential", {
        emailVerified: false,
        ageDays: 30,
      });
      await db.insert(providerCredential).values({
        userId: withCredential,
        provider: "pluggy",
        ciphertext: "x",
        lastValidatedAt: NOW,
      });

      const result = await runUnverifiedSignUpPruneStep(db, NOW);

      expect(result).toEqual({ deleted: 1 });
      expect(await remainingUserIds(db)).toEqual(
        [
          "at-cutoff-unverified",
          "old-verified",
          "recent-unverified",
          withMember.id,
          withConnection,
          withCredential,
        ].sort(),
      );
    });
  });
});
