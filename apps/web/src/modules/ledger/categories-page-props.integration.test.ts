import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createCategorizationRepository } from "./categorization-repository";
import { getCategoriesPageProps } from "./categories-page-props";
import { t } from "./strings";

// The 3 complete months strictly before "now": June, July and August, so
// September (still running) never counts toward the streak.
const NOW = new Date("2026-09-15T12:00:00.000Z");

describe("getCategoriesPageProps (integration)", () => {
  it("lists rules in precedence order with their pattern, direction and target labels", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createCategorizationRepository(householdScope(userA.session));
      await repository.saveRule(
        db,
        {
          pattern: "CONDOMINIO",
          direction: "debit",
          subcategory: { type: "product", id: "housing.condo" },
        },
        userA.id,
      );
      await repository.saveRule(
        db,
        {
          pattern: "PIX ENVIADO CONDOMINIO",
          direction: "debit",
          subcategory: { type: "product", id: "housing.rent" },
        },
        userA.id,
      );

      const props = await getCategoriesPageProps(userA.session, NOW);

      expect(
        props.rules.map((rule) => ({
          pattern: rule.pattern,
          appliesTo: rule.appliesTo,
          target: rule.target,
        })),
      ).toEqual([
        {
          pattern: "PIX ENVIADO CONDOMINIO",
          appliesTo: t.categoriesPage.ruleTable.debit,
          target: `${t.categories.housing} · ${t.subcategories["housing.rent"]}`,
        },
        {
          pattern: "CONDOMINIO",
          appliesTo: t.categoriesPage.ruleTable.debit,
          target: `${t.categories.housing} · ${t.subcategories["housing.condo"]}`,
        },
      ]);
      expect(props.rules.every((rule) => rule.id.length > 0)).toBe(true);
    });
  });

  it("suggests a fixed subcategory when a variable spend repeats with a similar amount in each of the 3 complete months before now", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "mkt-jun",
            date: "2026-06-05",
            description: "SUPERMERCADO BOM PRECO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9900,
          }),
          seedTransaction({
            providerTransactionId: "mkt-jul",
            date: "2026-07-05",
            description: "SUPERMERCADO BOM PRECO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9950,
          }),
          seedTransaction({
            providerTransactionId: "mkt-aug",
            date: "2026-08-05",
            description: "SUPERMERCADO BOM PRECO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -10000,
          }),
        ],
      });

      const props = await getCategoriesPageProps(userA.session, NOW);

      expect(props.suggestions).toEqual([
        {
          subcategoryValue: "product:food.groceries",
          subcategoryLabel: t.subcategories["food.groceries"],
          description: "SUPERMERCADO BOM PRECO",
        },
      ]);
    });
  });

  it("does not suggest a fixed subcategory when one of the 3 months is missing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "mkt-jun-only",
            date: "2026-06-05",
            description: "SUPERMERCADO BOM PRECO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9900,
          }),
          seedTransaction({
            providerTransactionId: "mkt-aug-only",
            date: "2026-08-05",
            description: "SUPERMERCADO BOM PRECO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9900,
          }),
        ],
      });

      const props = await getCategoriesPageProps(userA.session, NOW);

      expect(props.suggestions).toEqual([]);
    });
  });

  // Padding's own load-bearing pin lives in page-props.integration.test.ts
  // ("pairs a debit on the last day of the month..."): with pairing intact,
  // June's and August's debits below stay unpaired without the pad and land
  // on a different subcategory than July's (still paired, both legs inside
  // the window either way), so this test alone cannot tell a missing pad
  // apart from a correct one. What it does pin: if pairing were broken
  // outright, all three months would collapse onto the same provider-mapped
  // "food.groceries" subcategory and this recurring streak would wrongly
  // surface as a suggestion.
  it("keeps a recurring own-account transfer pair out of fixed-cost suggestions across three months", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          // June's other leg lands before the 3-month window (which starts
          // June 1st): one business day earlier, on the preceding Friday.
          seedTransaction({
            providerTransactionId: "transfer-jun-debit",
            providerAccountId: "acc-1",
            date: "2026-06-01",
            description: "TRANSFERENCIA CASA",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9900,
          }),
          seedTransaction({
            providerTransactionId: "transfer-jun-credit",
            providerAccountId: "acc-2",
            date: "2026-05-29",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 9900,
          }),
          seedTransaction({
            providerTransactionId: "transfer-jul-debit",
            providerAccountId: "acc-1",
            date: "2026-07-01",
            description: "TRANSFERENCIA CASA",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9950,
          }),
          seedTransaction({
            providerTransactionId: "transfer-jul-credit",
            providerAccountId: "acc-2",
            date: "2026-07-02",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 9950,
          }),
          // August's other leg lands after the window (which ends August
          // 31st): two business days later, in the following September.
          seedTransaction({
            providerTransactionId: "transfer-aug-debit",
            providerAccountId: "acc-1",
            date: "2026-08-31",
            description: "TRANSFERENCIA CASA",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -10000,
          }),
          seedTransaction({
            providerTransactionId: "transfer-aug-credit",
            providerAccountId: "acc-2",
            date: "2026-09-02",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 10000,
          }),
        ],
      });

      const props = await getCategoriesPageProps(userA.session, NOW);

      expect(props.suggestions).toEqual([]);
    });
  });

  it("reflects a kind override in the categories list", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createCategorizationRepository(householdScope(userA.session));
      await repository.setKind(db, { type: "product", id: "leisure.travel" }, "fixed");

      const props = await getCategoriesPageProps(userA.session, NOW);

      const leisure = props.categories.find((category) => category.categoryId === "leisure");
      const travel = leisure?.subcategories.find(
        (subcategory) => subcategory.ref.id === "leisure.travel",
      );
      expect(travel).toMatchObject({ kind: "fixed", defaultKind: "variable" });
    });
  });
});
