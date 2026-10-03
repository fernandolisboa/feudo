import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import {
  getCategoriesPageProps,
  getOverviewPageProps,
  getTransactionsPageProps,
} from "@/modules/ledger";
import { getReservePageProps } from "@/modules/reserve";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { financialDataAccess } from "./schema";

import type { Database } from "@/platform/db/client";

const NOW = new Date("2026-10-01T01:30:00.000Z");
const SECRET_DESCRIPTION = "PIX SEGREDO FINANCEIRO ULTRASSECRETO";
const SECRET_AMOUNT_CENTAVOS = -987654;

async function listAccessRows(db: Database) {
  return db.select().from(financialDataAccess);
}

describe("financial-data access recording (integration, ADR-0008)", () => {
  it("records one entry per read, with only the four allowed columns and no financial value in any of them", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "secret",
            description: SECRET_DESCRIPTION,
            amountCentavos: SECRET_AMOUNT_CENTAVOS,
            date: "2026-09-10",
          }),
        ],
      });

      await getOverviewPageProps(userA.session, {}, NOW);
      await getTransactionsPageProps(userA.session, {}, NOW);
      await getCategoriesPageProps(userA.session, NOW);
      await getReservePageProps(userA.session, NOW);

      const rows = await listAccessRows(db);

      expect(rows.map((row) => row.kind).sort()).toEqual([
        "categories",
        "overview",
        "reserve",
        "transactions",
      ]);

      for (const row of rows) {
        expect(Object.keys(row).sort()).toEqual(
          ["accessedAt", "householdId", "id", "kind", "userId"].sort(),
        );
        expect(row.householdId).toBe(userA.session.householdId);
        expect(row.userId).toBe(userA.id);

        const serialized = JSON.stringify(row);
        expect(serialized).not.toContain(SECRET_DESCRIPTION);
        expect(serialized).not.toContain(String(SECRET_AMOUNT_CENTAVOS));
        expect(serialized).not.toContain("987654");
      }
    });
  });

  it("never records household B's read into household A's log", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await getOverviewPageProps(userA.session, {}, NOW);
      await getOverviewPageProps(userB.session, {}, NOW);

      const rows = await listAccessRows(db);
      const householdIds = new Set(rows.map((row) => row.householdId));

      expect(householdIds).toEqual(new Set([userA.session.householdId, userB.session.householdId]));
      expect(rows.filter((row) => row.householdId === userA.session.householdId)).toHaveLength(1);
      expect(rows.filter((row) => row.householdId === userB.session.householdId)).toHaveLength(1);
    });
  });
});
