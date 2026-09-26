import { describe, expect, it } from "vitest";
import {
  isKind,
  isProductCategoryId,
  isProductSubcategoryId,
  KINDS,
  PRODUCT_CATEGORY_IDS,
  PRODUCT_SUBCATEGORIES,
  productSubcategory,
} from "./taxonomy";

describe("PRODUCT_SUBCATEGORIES", () => {
  it("has a unique id for every subcategory", () => {
    const ids = PRODUCT_SUBCATEGORIES.map((subcategory) => subcategory.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every product category at least one subcategory", () => {
    for (const categoryId of PRODUCT_CATEGORY_IDS) {
      const hasSubcategory = PRODUCT_SUBCATEGORIES.some(
        (subcategory) => subcategory.categoryId === categoryId,
      );
      expect(hasSubcategory, categoryId).toBe(true);
    }
  });

  it("only references category ids from PRODUCT_CATEGORY_IDS", () => {
    for (const subcategory of PRODUCT_SUBCATEGORIES) {
      expect(isProductCategoryId(subcategory.categoryId), subcategory.id).toBe(true);
    }
  });

  it("only uses declared kinds", () => {
    for (const subcategory of PRODUCT_SUBCATEGORIES) {
      expect(isKind(subcategory.kind), subcategory.id).toBe(true);
    }
  });
});

describe("isKind", () => {
  it("accepts every declared kind", () => {
    for (const kind of KINDS) {
      expect(isKind(kind)).toBe(true);
    }
  });

  it("rejects an unknown kind", () => {
    expect(isKind("unknown")).toBe(false);
  });
});

describe("isProductCategoryId", () => {
  it("rejects an unknown category id", () => {
    expect(isProductCategoryId("unknown")).toBe(false);
  });
});

describe("isProductSubcategoryId", () => {
  it("rejects an unknown subcategory id", () => {
    expect(isProductSubcategoryId("unknown.unknown")).toBe(false);
  });
});

describe("productSubcategory", () => {
  it("returns the subcategory for a known id", () => {
    expect(productSubcategory("housing.rent")).toEqual({
      id: "housing.rent",
      categoryId: "housing",
      kind: "fixed",
    });
  });

  it("throws for an unknown id", () => {
    expect(() => productSubcategory("unknown.unknown" as never)).toThrow();
  });
});
