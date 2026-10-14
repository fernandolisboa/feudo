import { describe, expect, it } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_MINIMUM_SCORES, DEFAULT_WEIGHT_LEVELS } from "@feudo/core";

import {
  isReadableComparisonOptions,
  minimumScoreFieldName,
  parseComparisonSettingsForm,
  parseStoredComparisonOptions,
  storedWeightLevelsSchema,
} from "./validation";

function form(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

function baseEntries(level: string): Record<string, string> {
  const entries: Record<string, string> = {
    candidateCount: "3",
    proConMinDifference: "10",
  };
  for (const criterion of BANK_PROFILE_CRITERIA) {
    entries[criterion] = level;
    entries[minimumScoreFieldName(criterion)] = String(DEFAULT_MINIMUM_SCORES[criterion]);
  }
  return entries;
}

describe("parseComparisonSettingsForm", () => {
  it("accepts a numeric level per criterion plus the comparison settings", () => {
    const result = parseComparisonSettingsForm(form({ ...baseEntries("3"), fees: "5" }));

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.levels.fees).toBe(5);
    expect(result.levels.cardBenefits).toBe(3);
    expect(result.options.candidateCount).toBe(3);
    expect(result.options.proConMinDifference).toBe(10);
    expect(result.options.minimumScores).toEqual(DEFAULT_MINIMUM_SCORES);
  });

  it("accepts essential or required as a level", () => {
    const result = parseComparisonSettingsForm(
      form({ ...baseEntries("0"), jointBanking: "essential", fees: "required" }),
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.levels.jointBanking).toBe("essential");
    expect(result.levels.fees).toBe("required");
  });

  it("refuses a set where every level is doesn't-count", () => {
    expect(parseComparisonSettingsForm(form(baseEntries("0")))).toEqual({ status: "all_zero" });
  });

  it.each([["6"], ["-1"], ["2.5"], [""], ["abc"], ["obligatory"]])(
    "refuses the level %j",
    (value) => {
      expect(parseComparisonSettingsForm(form({ ...baseEntries("3"), fees: value })).status).toBe(
        "invalid",
      );
    },
  );

  it("refuses a form missing a criterion", () => {
    const formData = form(baseEntries("3"));
    formData.delete("lockIn");

    expect(parseComparisonSettingsForm(formData)).toEqual({ status: "invalid" });
  });

  it("refuses a minimum score outside the 0-100 step-5 range", () => {
    expect(
      parseComparisonSettingsForm(
        form({ ...baseEntries("3"), [minimumScoreFieldName("fees")]: "61" }),
      ).status,
    ).toBe("invalid");
  });

  it("refuses a candidate count outside 1-5", () => {
    expect(
      parseComparisonSettingsForm(form({ ...baseEntries("3"), candidateCount: "6" })).status,
    ).toBe("invalid");
  });

  it("refuses a pro/con difference outside 5-30 step 5", () => {
    expect(
      parseComparisonSettingsForm(form({ ...baseEntries("3"), proConMinDifference: "11" })).status,
    ).toBe("invalid");
  });
});

describe("storedWeightLevelsSchema", () => {
  it("accepts a partial set mixing numbers and gate levels", () => {
    expect(storedWeightLevelsSchema.parse({ fees: 1, jointBanking: "required" })).toEqual({
      fees: 1,
      jointBanking: "required",
    });
  });

  it("accepts the full default set", () => {
    expect(storedWeightLevelsSchema.parse(DEFAULT_WEIGHT_LEVELS)).toEqual(DEFAULT_WEIGHT_LEVELS);
  });

  it("refuses an out-of-range or unknown level", () => {
    expect(storedWeightLevelsSchema.safeParse({ fees: 99 }).success).toBe(false);
    expect(storedWeightLevelsSchema.safeParse({ fees: "obligatory" }).success).toBe(false);
  });
});

describe("parseStoredComparisonOptions", () => {
  it("accepts a partial set", () => {
    expect(parseStoredComparisonOptions({ candidateCount: 2 })).toEqual({ candidateCount: 2 });
  });

  it("accepts an empty object", () => {
    expect(parseStoredComparisonOptions({})).toEqual({});
  });

  it("falls back to nothing for a step violation or an out-of-range value", () => {
    expect(parseStoredComparisonOptions({ proConMinDifference: 11 })).toEqual({});
    expect(parseStoredComparisonOptions({ candidateCount: 6 })).toEqual({});
    expect(parseStoredComparisonOptions({ minimumScores: { fees: 61 } })).toEqual({});
  });

  it("keeps the fields that are valid and drops only the one that fails, instead of failing the whole object", () => {
    expect(parseStoredComparisonOptions({ candidateCount: 99, proConMinDifference: 15 })).toEqual({
      proConMinDifference: 15,
    });
  });

  it("keeps the valid criteria of a partially invalid minimumScores object", () => {
    expect(
      parseStoredComparisonOptions({ minimumScores: { fees: 65, jointBanking: 999 } }),
    ).toEqual({ minimumScores: { fees: 65 } });
  });

  it("falls back to nothing for a value that is not an options-shaped object at all", () => {
    expect(parseStoredComparisonOptions("garbage")).toEqual({});
    expect(parseStoredComparisonOptions(null)).toEqual({});
    expect(parseStoredComparisonOptions([1, 2, 3])).toEqual({});
  });
});

describe("isReadableComparisonOptions", () => {
  it("accepts a plain object, even an empty one", () => {
    expect(isReadableComparisonOptions({})).toBe(true);
    expect(isReadableComparisonOptions({ candidateCount: 2 })).toBe(true);
  });

  it("refuses null, an array or a non-object value", () => {
    expect(isReadableComparisonOptions(null)).toBe(false);
    expect(isReadableComparisonOptions([1, 2, 3])).toBe(false);
    expect(isReadableComparisonOptions("garbage")).toBe(false);
    expect(isReadableComparisonOptions(42)).toBe(false);
  });
});
