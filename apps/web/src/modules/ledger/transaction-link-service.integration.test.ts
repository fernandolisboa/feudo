import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { computeLinkSuggestions } from "./link-suggestions";
import { readHouseholdLedger } from "./ledger-read";
import { confirmAllLinks, confirmLink, dismissLink, undoLink } from "./transaction-link-service";

import type { Database } from "@/platform/db/client";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const SEPTEMBER = { from: "2026-09-01", to: "2026-09-30" };

async function transactionIdFor(db: Database, providerTransactionId: string): Promise<string> {
  const [row] = await db
    .select({ id: bankTransaction.id })
    .from(bankTransaction)
    .where(eq(bankTransaction.providerTransactionId, providerTransactionId));
  if (!row) {
    throw new Error(`seed did not create transaction ${providerTransactionId}`);
  }
  return row.id;
}

describe("transaction link service (integration)", () => {
  it("suggests an offset link for an equal-amount debit and credit on the same account and day, and confirms it as kind offset", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "offset-debit",
            date: "2026-09-10",
            description: "PIX ENVIADO PARA FULANO",
            type: "debit",
            amountCentavos: -20000,
          }),
          seedTransaction({
            providerTransactionId: "offset-credit",
            date: "2026-09-10",
            description: "PIX RECEBIDO DE CICLANO",
            type: "credit",
            amountCentavos: 20000,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "offset-debit");
      const creditTransactionId = await transactionIdFor(db, "offset-credit");

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([{ debitTransactionId, creditTransactionId, kind: "offset" }]);

      const outcome = await confirmLink(
        { debitTransactionId, creditTransactionId },
        userA.session,
        db,
        NOW,
      );
      expect(outcome).toEqual({ status: "ok" });

      const { rows } = await readHouseholdLedger(
        db,
        householdScope(userA.session),
        SEPTEMBER,
        null,
        "America/Sao_Paulo",
      );
      const debitRow = rows.find((row) => row.id === debitTransactionId);
      const creditRow = rows.find((row) => row.id === creditTransactionId);
      expect(debitRow?.categorization).toEqual({
        subcategory: { type: "product", id: "transfers.pass-through" },
        source: "link",
        ruleId: null,
      });
      expect(debitRow?.kind).toBe("transfer");
      expect(creditRow?.categorization?.source).toBe("link");

      const { suggestions: afterConfirm } = await computeLinkSuggestions(userA.session, NOW);
      expect(afterConfirm).toEqual([]);
    });
  });

  it("suggests a funding link when one side already resolves to a transfer on its own", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "funding-debit",
            date: "2026-09-12",
            description: "PAGAMENTO FATURA CARTAO",
            type: "debit",
            amountCentavos: -30000,
          }),
          seedTransaction({
            providerTransactionId: "funding-credit",
            date: "2026-09-12",
            description: "RESGATE RDB",
            type: "credit",
            amountCentavos: 30000,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "funding-debit");
      const creditTransactionId = await transactionIdFor(db, "funding-credit");

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([{ debitTransactionId, creditTransactionId, kind: "funding" }]);

      const outcome = await confirmLink(
        { debitTransactionId, creditTransactionId },
        userA.session,
        db,
        NOW,
      );
      expect(outcome).toEqual({ status: "ok" });

      const { rows } = await readHouseholdLedger(
        db,
        householdScope(userA.session),
        SEPTEMBER,
        null,
        "America/Sao_Paulo",
      );
      const creditRow = rows.find((row) => row.id === creditTransactionId);
      expect(creditRow?.categorization).toBeNull();
      expect(creditRow?.link).toEqual({ counterpartId: debitTransactionId, kind: "funding" });
    });
  });

  it("refuses to confirm a pair that is no longer a live suggestion, including a crafted one", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "a-debit",
            date: "2026-09-10",
            type: "debit",
            amountCentavos: -1000,
          }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "item-b",
        transactions: [
          seedTransaction({
            providerTransactionId: "b-credit",
            date: "2026-09-10",
            type: "credit",
            amountCentavos: 1000,
          }),
        ],
      });
      const aDebit = await transactionIdFor(db, "a-debit");
      const bCredit = await transactionIdFor(db, "b-credit");

      const crafted = await confirmLink(
        { debitTransactionId: aDebit, creditTransactionId: bCredit },
        userA.session,
        db,
        NOW,
      );
      expect(crafted).toEqual({ status: "not_found" });

      const unrelated = await confirmLink(
        { debitTransactionId: "00000000-0000-0000-0000-000000000000", creditTransactionId: aDebit },
        userA.session,
        db,
        NOW,
      );
      expect(unrelated).toEqual({ status: "not_found" });
    });
  });

  it("confirms every pair of one kind with confirmAllLinks, leaving the other kind untouched", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [
          seedAccount({ providerAccountId: "acc-1" }),
          seedAccount({ providerAccountId: "acc-2", name: "Conta 2" }),
        ],
        transactions: [
          seedTransaction({
            providerTransactionId: "offset-a-debit",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            type: "debit",
            amountCentavos: -1500,
          }),
          seedTransaction({
            providerTransactionId: "offset-a-credit",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            type: "credit",
            amountCentavos: 1500,
          }),
          seedTransaction({
            providerTransactionId: "offset-b-debit",
            providerAccountId: "acc-2",
            date: "2026-09-06",
            type: "debit",
            amountCentavos: -2500,
          }),
          seedTransaction({
            providerTransactionId: "offset-b-credit",
            providerAccountId: "acc-2",
            date: "2026-09-06",
            type: "credit",
            amountCentavos: 2500,
          }),
          seedTransaction({
            providerTransactionId: "funding-debit",
            providerAccountId: "acc-1",
            date: "2026-09-07",
            description: "PAGAMENTO FATURA CARTAO",
            type: "debit",
            amountCentavos: -3500,
          }),
          seedTransaction({
            providerTransactionId: "funding-credit",
            providerAccountId: "acc-1",
            date: "2026-09-07",
            type: "credit",
            amountCentavos: 3500,
          }),
        ],
      });

      const outcome = await confirmAllLinks("offset", userA.session, db, NOW);
      expect(outcome).toEqual({ status: "ok" });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([
        {
          debitTransactionId: await transactionIdFor(db, "funding-debit"),
          creditTransactionId: await transactionIdFor(db, "funding-credit"),
          kind: "funding",
        },
      ]);
    });
  });

  it("dismisses a pair, removing it from suggestions, only through the session's own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "d-debit",
            date: "2026-09-10",
            type: "debit",
            amountCentavos: -800,
          }),
          seedTransaction({
            providerTransactionId: "d-credit",
            date: "2026-09-10",
            type: "credit",
            amountCentavos: 800,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "d-debit");
      const creditTransactionId = await transactionIdFor(db, "d-credit");

      expect(
        await dismissLink({ debitTransactionId, creditTransactionId }, userB.session, db),
      ).toEqual({ status: "not_found" });

      expect(
        await dismissLink({ debitTransactionId, creditTransactionId }, userA.session, db),
      ).toEqual({ status: "ok" });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([]);
    });
  });

  it("undoes a confirmed link so the pair can be suggested again, only through the session's own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "u-debit",
            date: "2026-09-10",
            type: "debit",
            amountCentavos: -900,
          }),
          seedTransaction({
            providerTransactionId: "u-credit",
            date: "2026-09-10",
            type: "credit",
            amountCentavos: 900,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "u-debit");
      const creditTransactionId = await transactionIdFor(db, "u-credit");
      expect(
        await confirmLink({ debitTransactionId, creditTransactionId }, userA.session, db, NOW),
      ).toEqual({ status: "ok" });

      expect(await undoLink(debitTransactionId, userB.session, db)).toEqual({
        status: "not_found",
      });
      expect(await undoLink(debitTransactionId, userA.session, db)).toEqual({ status: "ok" });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([{ debitTransactionId, creditTransactionId, kind: "offset" }]);
    });
  });
});
