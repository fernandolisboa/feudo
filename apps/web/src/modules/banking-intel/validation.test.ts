import { describe, expect, it } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_CRITERIA_WEIGHTS } from "@feudo/core";

import { parseCriteriaWeightsForm, storedCriteriaWeightsSchema } from "./validation";

function form(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

function allAs(value: string): Record<string, string> {
  return Object.fromEntries(BANK_PROFILE_CRITERIA.map((criterion) => [criterion, value]));
}

describe("parseCriteriaWeightsForm", () => {
  it("accepts one weight from 0 to 5 per criterion", () => {
    expect(parseCriteriaWeightsForm(form({ ...allAs("0"), fees: "5" }))).toEqual({
      status: "ok",
      weights: { ...Object.fromEntries(BANK_PROFILE_CRITERIA.map((c) => [c, 0])), fees: 5 },
    });
  });

  it("refuses a set where every weight is zero", () => {
    expect(parseCriteriaWeightsForm(form(allAs("0")))).toEqual({ status: "all_zero" });
  });

  it.each([["6"], ["-1"], ["2.5"], [""], ["abc"]])("refuses the weight %j", (value) => {
    expect(parseCriteriaWeightsForm(form({ ...allAs("3"), fees: value }))).toEqual({
      status: "invalid",
    });
  });

  it("refuses a form missing a criterion", () => {
    const formData = form(allAs("3"));
    formData.delete("lockIn");

    expect(parseCriteriaWeightsForm(formData)).toEqual({ status: "invalid" });
  });
});

describe("storedCriteriaWeightsSchema", () => {
  it("accepts a partial set", () => {
    expect(storedCriteriaWeightsSchema.parse({ fees: 1 })).toEqual({ fees: 1 });
  });

  it("accepts the full default set", () => {
    expect(storedCriteriaWeightsSchema.parse(DEFAULT_CRITERIA_WEIGHTS)).toEqual(
      DEFAULT_CRITERIA_WEIGHTS,
    );
  });

  it("refuses an out-of-range weight", () => {
    expect(storedCriteriaWeightsSchema.safeParse({ fees: 99 }).success).toBe(false);
  });
});
