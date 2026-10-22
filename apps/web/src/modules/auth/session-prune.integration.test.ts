import { describe, expect, it } from "vitest";

import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { session } from "./schema";
import { runSessionPruneStep } from "./session-prune";

import type { Database } from "@/platform/db/client";

const HOUR_MS = 3_600_000;

async function openSession(
  db: Database,
  id: string,
  userId: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(session).values({
    id,
    token: id,
    userId,
    expiresAt,
    updatedAt: new Date(),
    ipAddress: "203.0.113.7",
    userAgent: "test-agent",
  });
}

describe("runSessionPruneStep (integration)", () => {
  it("deletes only expired sessions, leaving the live ones of every user", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const now = new Date();
      await openSession(db, "a-expired", userA.id, new Date(now.getTime() - HOUR_MS));
      await openSession(db, "a-live", userA.id, new Date(now.getTime() + HOUR_MS));
      await openSession(db, "b-live", userB.id, new Date(now.getTime() + HOUR_MS));

      const result = await runSessionPruneStep(db, now);

      expect(result).toEqual({ deleted: 1 });
      const remaining = await db.select({ id: session.id }).from(session);
      expect(remaining.map((row) => row.id).sort()).toEqual(["a-live", "b-live"]);
    });
  });
});
