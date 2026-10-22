import { describe, expect, it } from "vitest";

import { invitation } from "@/modules/auth/schema";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { runDailyPruneStep } from "./invitation-prune";

const HOUR_MS = 3_600_000;

describe("runDailyPruneStep (integration)", () => {
  it("deletes cancelled and expired invitations whatever their status, keeping the live ones in every household", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const now = Date.now();
      const past = new Date(now - HOUR_MS);
      const future = new Date(now + HOUR_MS);
      const rows = [
        {
          id: "canceled",
          householdId: householdA,
          inviter: userA.id,
          status: "canceled",
          at: future,
        },
        {
          id: "expired-pending",
          householdId: householdA,
          inviter: userA.id,
          status: "pending",
          at: past,
        },
        {
          id: "expired-accepted",
          householdId: householdA,
          inviter: userA.id,
          status: "accepted",
          at: past,
        },
        {
          id: "expired-rejected",
          householdId: householdB,
          inviter: userB.id,
          status: "rejected",
          at: past,
        },
        {
          id: "live-pending-a",
          householdId: householdA,
          inviter: userA.id,
          status: "pending",
          at: future,
        },
        {
          id: "live-accepted-b",
          householdId: householdB,
          inviter: userB.id,
          status: "accepted",
          at: future,
        },
      ];
      await db.insert(invitation).values(
        rows.map((row) => ({
          id: row.id,
          organizationId: row.householdId,
          inviterId: row.inviter,
          email: `${row.id}@example.com`,
          role: "member",
          status: row.status,
          expiresAt: row.at,
        })),
      );

      const result = await runDailyPruneStep(db);

      expect(result).toEqual({ deleted: 4 });
      const remaining = await db.select({ id: invitation.id }).from(invitation);
      expect(remaining.map((row) => row.id).sort()).toEqual(["live-accepted-b", "live-pending-a"]);
    });
  });
});
