import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { markInternalTransfer } from "./categorization-service";
import { computeLinkSuggestions } from "./link-suggestions";
import { readHouseholdLedger } from "./ledger-read";
import { confirmAllLinks, confirmLink, dismissLink, undoLink } from "./transaction-link-service";
import { transactionIdFor } from "./test/transaction-id-for";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const SEPTEMBER = { from: "2026-09-01", to: "2026-09-30" };

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
        { debitTransactionId, creditTransactionId, kind: "offset" },
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
        { debitTransactionId, creditTransactionId, kind: "funding" },
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
        { debitTransactionId: aDebit, creditTransactionId: bCredit, kind: "offset" },
        userA.session,
        db,
        NOW,
      );
      expect(crafted).toEqual({ status: "not_found" });

      const unrelated = await confirmLink(
        {
          debitTransactionId: "00000000-0000-0000-0000-000000000000",
          creditTransactionId: aDebit,
          kind: "offset",
        },
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

      const offsetADebit = await transactionIdFor(db, "offset-a-debit");
      const offsetACredit = await transactionIdFor(db, "offset-a-credit");
      const offsetBDebit = await transactionIdFor(db, "offset-b-debit");
      const offsetBCredit = await transactionIdFor(db, "offset-b-credit");

      const outcome = await confirmAllLinks(
        {
          kind: "offset",
          pairs: [
            { debitTransactionId: offsetADebit, creditTransactionId: offsetACredit },
            { debitTransactionId: offsetBDebit, creditTransactionId: offsetBCredit },
          ],
        },
        userA.session,
        db,
        NOW,
      );
      expect(outcome).toEqual({ status: "ok", confirmedCount: 2, requestedCount: 2 });

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
        await confirmLink(
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.session,
          db,
          NOW,
        ),
      ).toEqual({ status: "ok" });

      expect(await undoLink(debitTransactionId, userB.session, db)).toEqual({
        status: "not_found",
      });
      expect(await undoLink(debitTransactionId, userA.session, db)).toEqual({ status: "ok" });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([{ debitTransactionId, creditTransactionId, kind: "offset" }]);
    });
  });

  it("never suggests, and refuses to confirm, a transaction carrying any explicit transfer mark", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "marked-debit",
            date: "2026-09-14",
            type: "debit",
            amountCentavos: -1700,
          }),
          seedTransaction({
            providerTransactionId: "marked-credit",
            date: "2026-09-14",
            type: "credit",
            amountCentavos: 1700,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "marked-debit");
      const creditTransactionId = await transactionIdFor(db, "marked-credit");

      expect(await markInternalTransfer(debitTransactionId, false, userA.session, db)).toEqual({
        status: "ok",
      });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([]);

      expect(
        await confirmLink(
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.session,
          db,
          NOW,
        ),
      ).toEqual({ status: "not_found" });
    });
  });

  it("refuses a single confirm whose posted kind no longer matches the live suggestion", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "kind-mismatch-debit",
            date: "2026-09-15",
            description: "PAGAMENTO FATURA CARTAO",
            type: "debit",
            amountCentavos: -4400,
          }),
          seedTransaction({
            providerTransactionId: "kind-mismatch-credit",
            date: "2026-09-15",
            type: "credit",
            amountCentavos: 4400,
          }),
        ],
      });
      const debitTransactionId = await transactionIdFor(db, "kind-mismatch-debit");
      const creditTransactionId = await transactionIdFor(db, "kind-mismatch-credit");

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([{ debitTransactionId, creditTransactionId, kind: "funding" }]);

      expect(
        await confirmLink(
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.session,
          db,
          NOW,
        ),
      ).toEqual({ status: "not_found" });

      const { suggestions: stillLive } = await computeLinkSuggestions(userA.session, NOW);
      expect(stillLive).toEqual([{ debitTransactionId, creditTransactionId, kind: "funding" }]);
    });
  });

  it("confirms only the displayed pairs that still intersect the live suggestion list, reporting both counts", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [
          seedAccount({ providerAccountId: "acc-1" }),
          seedAccount({ providerAccountId: "acc-2", name: "Conta 2" }),
        ],
        transactions: [
          seedTransaction({
            providerTransactionId: "all-a-debit",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            type: "debit",
            amountCentavos: -1500,
          }),
          seedTransaction({
            providerTransactionId: "all-a-credit",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            type: "credit",
            amountCentavos: 1500,
          }),
          seedTransaction({
            providerTransactionId: "all-b-debit",
            providerAccountId: "acc-2",
            date: "2026-09-06",
            type: "debit",
            amountCentavos: -2500,
          }),
          seedTransaction({
            providerTransactionId: "all-b-credit",
            providerAccountId: "acc-2",
            date: "2026-09-06",
            type: "credit",
            amountCentavos: 2500,
          }),
        ],
      });
      const allADebit = await transactionIdFor(db, "all-a-debit");
      const allACredit = await transactionIdFor(db, "all-a-credit");
      const allBDebit = await transactionIdFor(db, "all-b-debit");
      const allBCredit = await transactionIdFor(db, "all-b-credit");

      // The member only ever saw the first pair; a crafted or stale id for a
      // pair they never saw, posted alongside it, must not ride along.
      const outcome = await confirmAllLinks(
        {
          kind: "offset",
          pairs: [
            { debitTransactionId: allADebit, creditTransactionId: allACredit },
            {
              debitTransactionId: "00000000-0000-0000-0000-000000000000",
              creditTransactionId: allBCredit,
            },
          ],
        },
        userA.session,
        db,
        NOW,
      );
      expect(outcome).toEqual({ status: "ok", confirmedCount: 1, requestedCount: 2 });

      const { suggestions } = await computeLinkSuggestions(userA.session, NOW);
      expect(suggestions).toEqual([
        { debitTransactionId: allBDebit, creditTransactionId: allBCredit, kind: "offset" },
      ]);
    });
  });
});
