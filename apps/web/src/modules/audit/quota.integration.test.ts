import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { user } from "@/modules/auth/schema";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";
import { getDb } from "@/platform/db/client";

import { recordAccessWithinQuota } from "./service";
import { financialDataAccess } from "./schema";

const SINCE = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe("recordAccessWithinQuota (integration)", () => {
  it("serializes a burst of concurrent calls for the same user: exactly one gets past the limit, the rest are refused and read nothing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      for (let i = 0; i < 2; i += 1) {
        await db
          .insert(financialDataAccess)
          .values({ householdId: userA.session.householdId, userId: userA.id, kind: "export" });
      }

      let reads = 0;
      const outcomes = await Promise.all(
        Array.from({ length: 5 }, () =>
          recordAccessWithinQuota(userA.session, "export", { limit: 3, since: SINCE }, () => {
            reads += 1;
            return Promise.resolve("document");
          }),
        ),
      );

      expect(outcomes.filter((outcome) => outcome.status === "ok")).toHaveLength(1);
      expect(outcomes.filter((outcome) => outcome.status === "limited")).toHaveLength(4);
      expect(reads).toBe(1);

      const rows = await db
        .select()
        .from(financialDataAccess)
        .where(eq(financialDataAccess.userId, userA.id));
      expect(rows.filter((row) => row.kind === "export")).toHaveLength(3);
    });
  });

  it("does not hang when a burst fills the pool while the holder's read needs it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      for (let i = 0; i < 2; i += 1) {
        await db
          .insert(financialDataAccess)
          .values({ householdId: userA.session.householdId, userId: userA.id, kind: "export" });
      }

      let reads = 0;
      const outcomes = await Promise.allSettled(
        Array.from({ length: 12 }, () =>
          recordAccessWithinQuota(userA.session, "export", { limit: 3, since: SINCE }, async () => {
            reads += 1;
            await Promise.all(
              Array.from({ length: 4 }, () => getDb().select({ id: user.id }).from(user)),
            );
            return "document";
          }),
        ),
      );

      const fulfilled = outcomes.flatMap((outcome) =>
        outcome.status === "fulfilled" ? [outcome.value] : [],
      );
      expect(fulfilled.filter((outcome) => outcome.status === "ok")).toHaveLength(1);
      expect(reads).toBe(1);
      const rows = await db
        .select()
        .from(financialDataAccess)
        .where(eq(financialDataAccess.userId, userA.id));
      expect(rows.filter((row) => row.kind === "export")).toHaveLength(3);
    });
  }, 30_000);

  it("never locks or counts another user's rows", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await db.insert(financialDataAccess).values(
        Array.from({ length: 3 }, () => ({
          householdId: userB.session.householdId,
          userId: userB.id,
          kind: "export" as const,
        })),
      );

      const outcome = await recordAccessWithinQuota(
        userA.session,
        "export",
        { limit: 3, since: SINCE },
        () => Promise.resolve("document"),
      );

      expect(outcome).toEqual({ status: "ok", value: "document" });
    });
  });
});
