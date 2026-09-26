import { describe, expect, it } from "vitest";

import { buildTaxonomyView } from "./taxonomy-view";
import { t } from "./strings";

describe("buildTaxonomyView", () => {
  it("orders a category's subcategories as the product ships them, then the household's own alphabetically", () => {
    const view = buildTaxonomyView({
      overrides: new Map(),
      householdSubcategories: new Map([
        ["h-2", { id: "h-2", categoryId: "housing", name: "Zelador", kind: "variable" }],
        ["h-1", { id: "h-1", categoryId: "housing", name: "Alarme", kind: "fixed" }],
      ]),
    });

    const housing = view.categories.find((category) => category.categoryId === "housing");
    expect(housing?.subcategories.map((subcategory) => subcategory.label)).toEqual([
      t.subcategories["housing.rent"],
      t.subcategories["housing.condo"],
      t.subcategories["housing.mortgage"],
      t.subcategories["housing.utilities"],
      t.subcategories["housing.property-tax"],
      t.subcategories["housing.repairs"],
      "Alarme",
      "Zelador",
    ]);
  });

  it("reflects a household kind override on a product subcategory while keeping its shipped default", () => {
    const view = buildTaxonomyView({
      overrides: new Map([["leisure.travel", "fixed"]]),
      householdSubcategories: new Map(),
    });

    const leisure = view.categories.find((category) => category.categoryId === "leisure");
    const travel = leisure?.subcategories.find(
      (subcategory) =>
        subcategory.ref.type === "product" && subcategory.ref.id === "leisure.travel",
    );
    expect(travel).toMatchObject({ kind: "fixed", defaultKind: "variable" });
    expect(view.kindOf({ type: "product", id: "leisure.travel" })).toBe("fixed");
  });

  it("returns null from labelOf and kindOf for a household subcategory id it does not know", () => {
    const view = buildTaxonomyView({ overrides: new Map(), householdSubcategories: new Map() });

    expect(view.labelOf({ type: "household", id: "missing" })).toBeNull();
    expect(view.kindOf({ type: "household", id: "missing" })).toBeNull();
  });
});
