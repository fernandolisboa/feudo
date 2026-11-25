import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  matchesPattern,
  normalizeDescription,
  rulePatternFromDescription,
  stripInstallmentMarker,
  stripStoredPatternInstallmentMarker,
} from "./description";

const wordArb = fc.stringMatching(/^[A-Za-z]{1,10}$/);
const numberArb = fc.stringMatching(/^[0-9]{1,6}$/);
const tokenArb = fc.oneof(wordArb, numberArb);
const descriptionArb = fc
  .array(tokenArb, { minLength: 1, maxLength: 10 })
  .map((tokens) => tokens.join(" "));
const noMarkerDescriptionArb = descriptionArb.filter(
  (description) => !/PARC\d{2}(\/\d{2})?\s*$/.test(description.toUpperCase()),
);

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

const merchantArb = fc.stringMatching(/^[A-Za-z]{1,12}$/);
const twoDigitsArb = fc.stringMatching(/^[0-9]{2}$/);

describe("installment marker property tests", () => {
  it("strips a trailing installment marker, glued or spaced, down to the same base text", () => {
    fc.assert(
      fc.property(
        noMarkerDescriptionArb.filter((description) => description.trim() !== ""),
        merchantArb,
        twoDigitsArb,
        twoDigitsArb,
        (prefix, merchant, current, total) => {
          const base = normalizeDescription(`${prefix} ${merchant}`);
          fc.pre(base !== "");
          const spaced = normalizeDescription(`${prefix} ${merchant} PARC${current}/${total}`);
          const glued = normalizeDescription(`${prefix} ${merchant}PARC${current}/${total}`);
          expect(spaced).toBe(base);
          expect(glued).toBe(base);
        },
      ),
    );
  });

  const stackedMarkerArb = fc
    .tuple(
      noMarkerDescriptionArb.filter((description) => description.trim() !== ""),
      fc.array(fc.tuple(twoDigitsArb, twoDigitsArb), { minLength: 2, maxLength: 4 }),
    )
    .map(([base, markers]) =>
      [base, ...markers.map(([current, total]) => `PARC${current}/${total}`)].join(" "),
    );

  it("stays idempotent for any description, with or without a marker, stacked or not", () => {
    fc.assert(
      fc.property(fc.oneof(descriptionArb, stackedMarkerArb), (description) => {
        const once = normalizeDescription(description);
        expect(normalizeDescription(once)).toBe(once);
      }),
    );
  });

  it("leaves a description with no installment marker unchanged by the marker strip alone", () => {
    fc.assert(
      fc.property(noMarkerDescriptionArb, (description) => {
        const normalized = normalizeDescription(description);
        expect(stripInstallmentMarker(normalized)).toBe(normalized);
      }),
    );
  });

  it("never yields a stripped pattern that fails to match the description it came from", () => {
    fc.assert(
      fc.property(
        descriptionArb.filter((description) => description.trim() !== ""),
        twoDigitsArb,
        twoDigitsArb,
        (base, current, total) => {
          const description = `${base} PARC${current}/${total}`;
          const normalized = normalizeDescription(description);
          fc.pre(normalized !== "");
          const pattern = stripInstallmentMarker(normalized);
          if (pattern === "") {
            return;
          }
          expect(matchesPattern(normalized, pattern)).toBe(true);
        },
      ),
    );
  });

  it("keeps an old stored pattern (base + PARC and the counter alone, with no trailing total) matching every fresh installment of the same purchase", () => {
    fc.assert(
      fc.property(
        noMarkerDescriptionArb.filter((description) => description.trim() !== ""),
        twoDigitsArb,
        twoDigitsArb,
        twoDigitsArb,
        (base, storedCurrent, freshCurrent, total) => {
          const baseNormalized = normalizeDescription(base);
          fc.pre(baseNormalized !== "");

          const oldStoredPattern = `${baseNormalized} PARC${storedCurrent}`;
          const preparedPattern = stripStoredPatternInstallmentMarker(oldStoredPattern);
          expect(preparedPattern).toBe(baseNormalized);

          const freshDescription = `${base} PARC${freshCurrent}/${total}`;
          const freshNormalized = normalizeDescription(freshDescription);
          expect(freshNormalized).toBe(baseNormalized);
          expect(matchesPattern(freshNormalized, preparedPattern)).toBe(true);
        },
      ),
    );
  });
});
