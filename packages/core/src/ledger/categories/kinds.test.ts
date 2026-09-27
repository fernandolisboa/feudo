import { describe, expect, it } from "vitest";
import { kindOf, type KindContext } from "./kinds";

function context(
  overrides: KindContext["overrides"] = new Map(),
  households: KindContext["householdSubcategories"] = new Map(),
): KindContext {
  return { overrides, householdSubcategories: households };
}

describe("kindOf", () => {
  it("returns the product default kind when there is no override", () => {
    expect(kindOf({ type: "product", id: "housing.rent" }, context())).toBe("fixed");
  });

  it("returns the household override kind when one exists for a product subcategory", () => {
    const ctx = context(new Map([["housing.rent", "variable"]]));
    expect(kindOf({ type: "product", id: "housing.rent" }, ctx)).toBe("variable");
  });

  it("returns the kind of a known household subcategory", () => {
    const ctx = context(
      new Map(),
      new Map([
        [
          "custom-1",
          { id: "custom-1", categoryId: "shopping", name: "Presentes", kind: "variable" },
        ],
      ]),
    );
    expect(kindOf({ type: "household", id: "custom-1" }, ctx)).toBe("variable");
  });

  it("returns null for an unknown household subcategory id", () => {
    expect(kindOf({ type: "household", id: "does-not-exist" }, context())).toBeNull();
  });
});
