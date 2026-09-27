import { describe, expect, it } from "vitest";

import { decodeSubcategoryRef, encodeSubcategoryRef } from "./subcategory-ref";

const HOUSEHOLD_ID = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";

describe("subcategory refs in forms", () => {
  it("round-trips product and household refs", () => {
    expect(
      decodeSubcategoryRef(encodeSubcategoryRef({ type: "product", id: "housing.rent" })),
    ).toEqual({ type: "product", id: "housing.rent" });
    expect(
      decodeSubcategoryRef(encodeSubcategoryRef({ type: "household", id: HOUSEHOLD_ID })),
    ).toEqual({ type: "household", id: HOUSEHOLD_ID });
  });

  it("rejects unknown product ids, malformed household ids and unknown types", () => {
    expect(decodeSubcategoryRef("product:housing.castle")).toBeNull();
    expect(decodeSubcategoryRef("household:not-a-uuid")).toBeNull();
    expect(decodeSubcategoryRef(`other:${HOUSEHOLD_ID}`)).toBeNull();
    expect(decodeSubcategoryRef("housing.rent")).toBeNull();
    expect(decodeSubcategoryRef("")).toBeNull();
  });
});
