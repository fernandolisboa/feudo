import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";
import type { Database } from "@/platform/db/client";

import { categorizeTransaction } from "./categorization-service";
import { getCategorizationNudgeProps, getGuidedCategorizationProps } from "./guided-categorization";

const NOW = new Date("2026-10-13T12:00:00.000Z");

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

describe("guided categorization (integration)", () => {
  it("queues the household's uncategorized transactions, largest first, with suggestions from its own history", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "bakery-done",
            date: "2026-08-02",
            description: "PADARIA DO ZE 0208",
            type: "debit",
            amountCentavos: -1500,
          }),
          seedTransaction({
            providerTransactionId: "bakery-open",
            date: "2026-09-02",
            description: "PADARIA DO ZE 0209",
            type: "debit",
            amountCentavos: -1800,
          }),
          seedTransaction({
            providerTransactionId: "income-open",
            date: "2026-09-05",
            description: "TED RECEBIDA EMPRESA X",
            type: "credit",
            amountCentavos: 900000,
          }),
          seedTransaction({
            providerTransactionId: "too-old",
            date: "2026-02-01",
            description: "LOJA ANTIGA",
            type: "debit",
            amountCentavos: -999999,
          }),
        ],
      });
      await categorizeTransaction(
        {
          transactionId: await transactionIdFor(db, "bakery-done"),
          subcategory: { type: "product", id: "food.groceries" },
          createRule: "off",
        },
        userA.session,
        db,
      );

      const props = await getGuidedCategorizationProps(userA.session, NOW);

      expect(props.sinceLabel).toBe("abril de 2026");
      expect(props.items.map((item) => item.description)).toEqual([
        "TED RECEBIDA EMPRESA X",
        "PADARIA DO ZE 0209",
      ]);
      expect(props.items[0]?.suggestion).toMatchObject({
        value: "product:income.other",
        label: "Renda · Outras rendas",
      });
      expect(props.items[1]?.suggestion).toEqual({
        value: "product:food.groceries",
        label: "Alimentação · Mercado",
        reason: "1 transação com esta descrição já está em Alimentação · Mercado.",
      });
      expect(props.items[1]?.pattern).toBe("PADARIA DO ZE");
    });
  });

  it("drops every transaction a rule saved from the wizard catches", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: ["1", "2", "3"].map((suffix) =>
          seedTransaction({
            providerTransactionId: `shop-${suffix}`,
            date: `2026-09-1${suffix}`,
            description: `BAZAR DA ESQUINA ${suffix}`,
            type: "debit",
            amountCentavos: -2000,
          }),
        ),
      });

      const before = await getGuidedCategorizationProps(userA.session, NOW);
      expect(before.items.map((item) => item.similarCount)).toEqual([2, 2, 2]);

      await categorizeTransaction(
        {
          transactionId: await transactionIdFor(db, "shop-1"),
          subcategory: { type: "product", id: "shopping.other" },
          createRule: "on",
          pattern: before.items[0]?.pattern ?? "",
          direction: "debit",
        },
        userA.session,
        db,
      );

      const after = await getGuidedCategorizationProps(userA.session, NOW);
      expect(after.items).toEqual([]);
      await expect(getCategorizationNudgeProps(userA.session, NOW)).resolves.toBeNull();
    });
  });

  it("never shows one household's uncategorized transactions to another", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "a-open",
            date: "2026-09-05",
            description: "PIX RECEBIDO CLIENTE",
            type: "credit",
            amountCentavos: 120000,
          }),
        ],
      });

      const propsB = await getGuidedCategorizationProps(userB.session, NOW);
      expect(propsB.items).toEqual([]);
      expect(propsB.hasTransactions).toBe(false);
      await expect(getCategorizationNudgeProps(userB.session, NOW)).resolves.toBeNull();

      const nudgeA = await getCategorizationNudgeProps(userA.session, NOW);
      expect(nudgeA?.count).toBe(1);
    });
  });
});
