import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { getTransactionsPageProps } from "./page-props";

// 01:30 UTC on 1 October is still 30 September in America/Sao_Paulo, the
// default time zone of a household with no settings row.
const NOW = new Date("2026-10-01T01:30:00.000Z");

describe("getTransactionsPageProps (integration)", () => {
  it("defaults to the current month in the household's time zone and never moves past it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ date: "2026-09-30" })],
      });

      const props = await getTransactionsPageProps(userA.session, {}, NOW);

      expect(props).toMatchObject({
        month: "2026-09",
        monthLabel: "setembro de 2026",
        previousMonth: "2026-08",
        nextMonth: null,
        selectedAccountId: null,
        total: 1,
        page: 1,
        hasMore: false,
      });
      expect(props.transactions.map((transaction) => transaction.date)).toEqual(["2026-09-30"]);
      expect(props.accounts.map((account) => account.name)).toEqual(["Conta corrente"]);
    });
  });

  it("reads the month, account and page from the URL and drops what it cannot use", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const seeded = await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          seedTransaction({ providerTransactionId: "t1", date: "2026-08-10" }),
          seedTransaction({
            providerTransactionId: "t2",
            date: "2026-08-11",
            providerAccountId: "acc-2",
          }),
        ],
      });
      const other = await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "other-item",
      });
      const savings = seeded.accountIdsByProvider.get("acc-2") ?? "";

      const filtered = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-08", conta: savings },
        NOW,
      );
      expect(filtered).toMatchObject({
        month: "2026-08",
        nextMonth: "2026-09",
        selectedAccountId: savings,
        total: 1,
      });
      expect(filtered.transactions.map((transaction) => transaction.accountName)).toEqual([
        "Poupança",
      ]);

      const foreignAccount = other.accountIdsByProvider.get("acc-1") ?? "";
      const unusable = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-8", conta: foreignAccount, pagina: "0" },
        NOW,
      );
      expect(unusable).toMatchObject({
        month: "2026-09",
        selectedAccountId: null,
        page: 1,
        total: 0,
      });

      const pastTheEnd = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-08", pagina: "7" },
        NOW,
      );
      expect(pastTheEnd).toMatchObject({ page: 1, total: 2, hasMore: false });
      expect(pastTheEnd.transactions).toHaveLength(2);
    });
  });
});
