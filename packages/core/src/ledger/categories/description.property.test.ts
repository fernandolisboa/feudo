import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { normalizeDescription } from "./description";

describe("normalizeDescription property tests", () => {
  it("is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const once = normalizeDescription(text);
        expect(normalizeDescription(once)).toBe(once);
      }),
    );
  });

  it("only ever produces uppercase letters, digits and single spaces", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const normalized = normalizeDescription(text);
        expect(normalized).toMatch(/^([A-Z0-9]+( [A-Z0-9]+)*)?$/);
      }),
    );
  });
});
