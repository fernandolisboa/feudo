import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { financialDataAccess } from "@/modules/audit/schema";
import { householdScope } from "@/modules/households";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { handleTransactionsSpreadsheetRequest } from "./spreadsheet-request";

const NOW = new Date("2026-10-13T12:00:00.000Z");

function request(query: string): Request {
  return new Request(`https://feudo.test/api/transactions/spreadsheet?${query}`, {
    headers: { "sec-fetch-site": "same-origin" },
  });
}

describe("handleTransactionsSpreadsheetRequest (integration)", () => {
  it("exports every row the screen lists for the same filters, only from the session's household, and records the read", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "a-rent",
            date: "2026-09-10",
            description: "ALUGUEL SETEMBRO",
            amountCentavos: -250000,
          }),
          seedTransaction({
            providerTransactionId: "a-bakery",
            date: "2026-09-11",
            description: "PADARIA",
          }),
          seedTransaction({
            providerTransactionId: "a-august",
            date: "2026-08-10",
            description: "ALUGUEL AGOSTO",
          }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "other-item",
        transactions: [
          seedTransaction({
            providerTransactionId: "b-rent",
            date: "2026-09-10",
            description: "ALUGUEL DA OUTRA CASA",
          }),
        ],
      });

      const response = await handleTransactionsSpreadsheetRequest(
        request("formato=csv&mes=2026-09&busca=aluguel"),
        { getSession: () => Promise.resolve(userA.session), now: () => NOW },
      );
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain('10/09/2026;"ALUGUEL SETEMBRO";-2500,00;"BRL";');
      expect(body).not.toContain("PADARIA");
      expect(body).not.toContain("ALUGUEL AGOSTO");
      expect(body).not.toContain("ALUGUEL DA OUTRA CASA");

      const recorded = await db
        .select({ kind: financialDataAccess.kind })
        .from(financialDataAccess)
        .where(
          and(
            eq(financialDataAccess.householdId, householdA),
            eq(financialDataAccess.userId, userA.id),
          ),
        );
      expect(recorded.map((entry) => entry.kind)).toEqual(["transactions"]);
    });
  });

  it("never exports another household's rows, even when the URL names that household's account", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const other = await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "other-item",
        transactions: [
          seedTransaction({
            providerTransactionId: "b-only",
            date: "2026-09-10",
            description: "SO DA OUTRA CASA",
          }),
        ],
      });
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "a-only",
            date: "2026-09-12",
            description: "DA CASA A",
          }),
        ],
      });
      const foreignAccount = other.accountIdsByProvider.get("acc-1") ?? "";

      const response = await handleTransactionsSpreadsheetRequest(
        request(`formato=csv&mes=2026-09&conta=${encodeURIComponent(foreignAccount)}`),
        { getSession: () => Promise.resolve(userA.session), now: () => NOW },
      );
      const body = await response.text();

      expect(body).not.toContain("SO DA OUTRA CASA");
      expect(body).toContain("DA CASA A");
    });
  });
});
