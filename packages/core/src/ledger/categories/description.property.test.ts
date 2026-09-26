import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { matchesPattern, normalizeDescription, rulePatternFromDescription } from "./description";

const wordArb = fc.stringMatching(/^[A-Za-z]{1,10}$/);
const numberArb = fc.stringMatching(/^[0-9]{1,6}$/);
const tokenArb = fc.oneof(wordArb, numberArb);
const descriptionArb = fc
  .array(tokenArb, { minLength: 1, maxLength: 10 })
  .map((tokens) => tokens.join(" "));

describe("rulePatternFromDescription property tests", () => {
  it("returns a pattern that matches its own normalized description whenever it is non-empty", () => {
    fc.assert(
      fc.property(descriptionArb, (description) => {
        const pattern = rulePatternFromDescription(description);
        if (pattern === "") {
          return;
        }
        expect(matchesPattern(normalizeDescription(description), pattern)).toBe(true);
      }),
    );
  });
});
