import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { invitation, user } from "@/modules/auth/schema";
import { seedHousehold, seedUser, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { deleteInvitationsForAccountPurge } from "./departure";

import type { Database } from "@/platform/db/client";

async function invite(
  db: Database,
  input: { id: string; householdId: string; inviterId: string; email: string },
): Promise<void> {
  await db.insert(invitation).values({
    id: input.id,
    organizationId: input.householdId,
    inviterId: input.inviterId,
    email: input.email,
    role: "member",
    status: "accepted",
    expiresAt: new Date(Date.now() + 3_600_000),
  });
}

describe("deleteInvitationsForAccountPurge (integration)", () => {
  it("deletes the invitations sent to the user's address in any household, whatever the case, and keeps everyone else's", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const [bRow] = await db.select({ email: user.email }).from(user).where(eq(user.id, userB.id));
      if (!bRow) throw new Error("test setup: user B not found");
      const thirdHousehold = await seedHousehold(db, "Household C");
      const userC = await seedUser(db, "Caio", thirdHousehold);
      await invite(db, {
        id: "to-b-in-a",
        householdId: householdA,
        inviterId: userA.id,
        email: bRow.email,
      });
      await invite(db, {
        id: "to-b-upper",
        householdId: thirdHousehold,
        inviterId: userC.id,
        email: bRow.email.toUpperCase(),
      });
      await invite(db, {
        id: "to-other-in-a",
        householdId: householdA,
        inviterId: userA.id,
        email: "other@example.com",
      });
      await invite(db, {
        id: "to-c-in-a",
        householdId: householdA,
        inviterId: userA.id,
        email: userC.session.email,
      });

      await db.transaction((tx) => deleteInvitationsForAccountPurge(tx, userB.id));

      const remaining = await db.select({ id: invitation.id }).from(invitation);
      expect(remaining.map((row) => row.id).sort()).toEqual(["to-c-in-a", "to-other-in-a"]);
    });
  });
});
