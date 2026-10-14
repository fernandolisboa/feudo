import { describe, expect, it } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_MINIMUM_SCORES, DEFAULT_WEIGHT_LEVELS } from "@feudo/core";

import {
  minimumScoreFieldName,
  parseComparisonSettingsForm,
  storedComparisonOptionsSchema,
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

describe("storedComparisonOptionsSchema", () => {
  it("accepts a partial set", () => {
    expect(storedComparisonOptionsSchema.parse({ candidateCount: 2 })).toEqual({
      candidateCount: 2,
    });
  });

  it("accepts an empty object", () => {
    expect(storedComparisonOptionsSchema.parse({})).toEqual({});
  });

  it("refuses a step violation or an out-of-range value", () => {
    expect(storedComparisonOptionsSchema.safeParse({ proConMinDifference: 11 }).success).toBe(
      false,
    );
    expect(storedComparisonOptionsSchema.safeParse({ candidateCount: 6 }).success).toBe(false);
    expect(storedComparisonOptionsSchema.safeParse({ minimumScores: { fees: 61 } }).success).toBe(
      false,
    );
  });
});
