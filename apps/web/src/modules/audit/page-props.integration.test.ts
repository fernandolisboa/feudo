import { describe, expect, it } from "vitest";

import { user } from "@/modules/auth/schema";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { getRecentAccessPageProps } from "./page-props";
import { createFinancialDataAccessRepository } from "./repository";

import type { FinancialDataAccessScope } from "./scope";
import type { Database } from "@/platform/db/client";

async function addMember(db: Database, householdId: string, name: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
  await joinHousehold(db, id, householdId, "member");
  return id;
}

describe("getRecentAccessPageProps (integration)", () => {
  it("shows the viewer's own entries, most recent first, each with a pt-BR kind label", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope: FinancialDataAccessScope = {
        householdId: userA.session.householdId,
        userId: userA.id,
      };
      const repository = createFinancialDataAccessRepository(scope);
      await repository.record(db, "overview");
      await repository.record(db, "export");

      const rows = await getRecentAccessPageProps(userA.session);

      expect(rows.map((row) => row.kindLabel)).toEqual(["Exportação de dados", "Visão geral"]);
      expect(rows.every((row) => row.whenLabel.length > 0)).toBe(true);
    });
  });

  it("never shows another member's access, even within the same household", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const partnerId = await addMember(db, householdA, "Partner");
      const partnerScope: FinancialDataAccessScope = { householdId: householdA, userId: partnerId };
      await createFinancialDataAccessRepository(partnerScope).record(db, "reserve");

      const rows = await getRecentAccessPageProps(userA.session);

      expect(rows).toEqual([]);
    });
  });
});
