import { describe, expect, it } from "vitest";
import { evaluateTermsAcceptance } from "./terms-policy";

describe("evaluateTermsAcceptance", () => {
  it("accepts when the checkbox was checked", () => {
    expect(evaluateTermsAcceptance(true)).toEqual({ accepted: true });
  });

  it("refuses when the checkbox was not checked", () => {
    expect(evaluateTermsAcceptance(false)).toEqual({
      accepted: false,
      reason: "terms_not_accepted",
    });
  });
});
