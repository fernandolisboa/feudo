import { formatMoney } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import { listFinancialDataAccessForExport } from "@/modules/audit";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { confirmLink } from "./transaction-link-service";
import { getLinkSuggestionsProps } from "./link-suggestions-page-props";
import { transactionIdFor } from "./test/transaction-id-for";
import { t } from "./strings";

const NOW = new Date("2026-10-13T12:00:00.000Z");

describe("getLinkSuggestionsProps (integration)", () => {
  it("lists each suggestion with its date, amount, account, both descriptions and kind in words, and records a transactions access", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "withdrawal",
            date: "2026-09-10",
            description: "RESGATE RDB",
            type: "credit",
            amountCentavos: 15000,
          }),
          seedTransaction({
            providerTransactionId: "bill",
            date: "2026-09-10",
            description: "PAGAMENTO FATURA CARTAO",
            type: "debit",
            amountCentavos: -15000,
          }),
        ],
      });

      const props = await getLinkSuggestionsProps(userA.session, NOW);

      expect(props.pendingCount).toBe(1);
      expect(props.items).toEqual([
        {
          debitTransactionId: await transactionIdFor(db, "bill"),
          creditTransactionId: await transactionIdFor(db, "withdrawal"),
          kind: "funding",
          dateLabel: "10/09/2026",
          amountLabel: formatMoney({ amountCentavos: 15000, currency: "BRL" }),
          accountLabel: "Banco Fixture · Conta corrente",
          debitDescription: "PAGAMENTO FATURA CARTAO",
          creditDescription: "RESGATE RDB",
          kindLabel: t.links.kind.funding,
        },
      ]);

      const access = await listFinancialDataAccessForExport(userA.session);
      expect(access.some((row) => row.kind === "transactions")).toBe(true);
    });
  });

  it("drops a confirmed pair from the suggestion list", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "d1",
            date: "2026-09-11",
            type: "debit",
            amountCentavos: -4200,
          }),
          seedTransaction({
            providerTransactionId: "c1",
            date: "2026-09-11",
            type: "credit",
            amountCentavos: 4200,
          }),
        ],
      });
      const firstPass = await getLinkSuggestionsProps(userA.session, NOW);
      expect(firstPass.pendingCount).toBe(1);
      const [item] = firstPass.items;
      if (!item) {
        throw new Error("expected one suggestion");
      }

      await confirmLink(
        {
          debitTransactionId: item.debitTransactionId,
          creditTransactionId: item.creditTransactionId,
          kind: item.kind,
        },
        userA.session,
        db,
        NOW,
      );

      const secondPass = await getLinkSuggestionsProps(userA.session, NOW);
      expect(secondPass.pendingCount).toBe(0);
      expect(secondPass.items).toEqual([]);
    });
  });
});
