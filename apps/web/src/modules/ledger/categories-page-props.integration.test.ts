import { describe, expect, it } from "vitest";

import { householdScope } from "@/modules/households";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
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
