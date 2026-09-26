import { describe, expect, it } from "vitest";
import { mapProviderCategory, PLUGGY_CATEGORY_MAP } from "./provider-mapping";
import { isProductSubcategoryId } from "./taxonomy";

describe("PLUGGY_CATEGORY_MAP", () => {
  it("maps every target to a valid product subcategory id or null", () => {
    for (const [category, subcategoryId] of Object.entries(PLUGGY_CATEGORY_MAP)) {
      if (subcategoryId !== null) {
        expect(isProductSubcategoryId(subcategoryId), `${category} -> ${subcategoryId}`).toBe(true);
      }
    }
  });
});

describe("mapProviderCategory", () => {
  it("maps a known category", () => {
    expect(mapProviderCategory("Salary")).toBe("income.salary");
  });

  it("is case-insensitive", () => {
    expect(mapProviderCategory("salary")).toBe("income.salary");
    expect(mapProviderCategory("SALARY")).toBe("income.salary");
  });

  it("trims surrounding whitespace", () => {
    expect(mapProviderCategory("  Salary  ")).toBe("income.salary");
  });

  it("maps a multi-word category with a comma", () => {
    expect(mapProviderCategory("Cinema, theater and concerts")).toBe("leisure.outings");
  });

  it("returns null for categories deliberately marked uncategorized", () => {
    expect(mapProviderCategory("Transfers")).toBeNull();
    expect(mapProviderCategory("Other")).toBeNull();
    expect(mapProviderCategory("Housing")).toBeNull();
  });

  it("returns null for an unknown category", () => {
    expect(mapProviderCategory("Some Unknown Category")).toBeNull();
  });

  it("returns null for a null category", () => {
    expect(mapProviderCategory(null)).toBeNull();
  });
});
