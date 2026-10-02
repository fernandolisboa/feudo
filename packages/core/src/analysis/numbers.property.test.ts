import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { formatBasisPointsPercent } from "../money/format";
import { formatMoney, roundHalfAwayFromZero } from "../money/money";
import { extractNumberTokens } from "./numbers";

const centavosArb = fc.integer({ min: 0, max: 999_999_999_999 });
const basisPointsArb = fc.integer({ min: -1_000_000, max: 1_000_000 });

const tokenTextCharArb = fc.constantFrom(..."0123456789.,%/-+ R$abcXYZãç ".split(""));
const tokenTextArb = fc.array(tokenTextCharArb, { maxLength: 24 }).map((chars) => chars.join(""));

describe("extractNumberTokens property tests", () => {
  it("renders formatMoney as exactly one token equal to the canonical reais value", () => {
    fc.assert(
      fc.property(centavosArb, (amountCentavos) => {
        const tokens = extractNumberTokens(formatMoney({ amountCentavos, currency: "BRL" }));
        const reais = Math.trunc(amountCentavos / 100);
        const cents = amountCentavos % 100;
        const decimal = String(cents).padStart(2, "0").replace(/0+$/, "");
        const expected = decimal === "" ? String(reais) : `${String(reais)}.${decimal}`;
        expect(tokens).toEqual([expected]);
      }),
    );
  });

  it("renders formatBasisPointsPercent as exactly one token, magnitude only", () => {
    fc.assert(
      fc.property(basisPointsArb, (basisPoints) => {
        const tokens = extractNumberTokens(formatBasisPointsPercent(basisPoints));
        const tenths = Math.abs(roundHalfAwayFromZero(basisPoints / 10));
        const whole = Math.trunc(tenths / 10);
        const decimal = tenths % 10;
        const expected = decimal === 0 ? String(whole) : `${String(whole)}.${String(decimal)}`;
        expect(tokens).toEqual([expected]);
      }),
    );
  });

  it("tokenizes a space-joined concatenation as the concatenation of each side's tokens", () => {
    fc.assert(
      fc.property(tokenTextArb, tokenTextArb, (a, b) => {
        const joined = extractNumberTokens(`${a} ${b}`);
        const expected = [...extractNumberTokens(a), ...extractNumberTokens(b)];
        expect(joined).toEqual(expected);
      }),
    );
  });
});
