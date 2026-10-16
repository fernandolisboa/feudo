import { describe, expect, it } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_WEIGHT_LEVELS, resolveCriteriaWeights } from "@feudo/core";

import {
  isReadableComparisonOptions,
  isReadableWeightLevels,
  parseAccountTypeFilterForm,
  parseAccountTypeOverrideForm,
  parseComparisonSettingsForm,
  parseOverrideForm,
  parseStoredComparisonOptions,
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
  }
  return entries;
}

describe("parseComparisonSettingsForm", () => {
  it("accepts a numeric level per criterion plus the comparison settings, never the account-type filter", () => {
    const result = parseComparisonSettingsForm(form({ ...baseEntries("3"), fees: "5" }));

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.levels.fees).toBe(5);
    expect(result.levels.cardBenefits).toBe(3);
    expect(result.options).toEqual({ candidateCount: 3, proConMinDifference: 10 });
    expect(result.options).not.toHaveProperty("accountTypeFilter");
  });

  it("refuses a set where every level is doesn't-count", () => {
    expect(parseComparisonSettingsForm(form(baseEntries("0")))).toEqual({ status: "all_zero" });
  });

  it.each([["6"], ["-1"], ["2.5"], [""], ["abc"], ["essential"], ["required"]])(
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

  it("ignores any account-type filter fields a stale form still posts, rather than failing or reading them", () => {
    const result = parseComparisonSettingsForm(
      form({ ...baseEntries("3"), jointBanking: "essential" }),
    );

    expect(result.status).toBe("ok");
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

describe("isReadableWeightLevels", () => {
  it("accepts a plain object, even a legacy row carrying the retired jointBanking key", () => {
    expect(isReadableWeightLevels(DEFAULT_WEIGHT_LEVELS)).toBe(true);
    expect(isReadableWeightLevels({ fees: 1, jointBanking: "required" })).toBe(true);
    expect(isReadableWeightLevels({ fees: "essential" })).toBe(true);
  });

  it("refuses null, an array or a non-object value", () => {
    expect(isReadableWeightLevels(null)).toBe(false);
    expect(isReadableWeightLevels([1, 2, 3])).toBe(false);
    expect(isReadableWeightLevels("garbage")).toBe(false);
    expect(isReadableWeightLevels(42)).toBe(false);
  });

  it("lets resolveCriteriaWeights (packages/core) map a legacy row leniently once it is readable", () => {
    const legacy = { fees: "essential", jointBanking: "required", cardBenefits: 2 };
    expect(isReadableWeightLevels(legacy)).toBe(true);
    expect(resolveCriteriaWeights(legacy)).toEqual({
      ...DEFAULT_WEIGHT_LEVELS,
      fees: 5,
      cardBenefits: 2,
    });
  });
});

describe("parseStoredComparisonOptions", () => {
  it("accepts a partial set with nothing dropped", () => {
    expect(parseStoredComparisonOptions({ candidateCount: 2 })).toEqual({
      value: { candidateCount: 2 },
      droppedFields: [],
    });
  });

  it("accepts an empty object", () => {
    expect(parseStoredComparisonOptions({})).toEqual({ value: {}, droppedFields: [] });
  });

  it("falls back to nothing and names the field for a step violation or an out-of-range value", () => {
    expect(parseStoredComparisonOptions({ proConMinDifference: 11 })).toEqual({
      value: {},
      droppedFields: ["proConMinDifference"],
    });
    expect(parseStoredComparisonOptions({ candidateCount: 6 })).toEqual({
      value: {},
      droppedFields: ["candidateCount"],
    });
  });

  it("keeps the fields that are valid and drops only the one that fails, instead of failing the whole object", () => {
    expect(parseStoredComparisonOptions({ candidateCount: 99, proConMinDifference: 15 })).toEqual({
      value: { proConMinDifference: 15 },
      droppedFields: ["candidateCount"],
    });
  });

  it("drops minimumScores silently, since it is retired data, never a warning", () => {
    expect(
      parseStoredComparisonOptions({ candidateCount: 2, minimumScores: { fees: 65 } }),
    ).toEqual({
      value: { candidateCount: 2 },
      droppedFields: [],
    });
  });

  it("parses accountTypeFilter field by field, dropping only an invalid field present", () => {
    expect(
      parseStoredComparisonOptions({
        accountTypeFilter: { jointBanking: "required", jointOnly: "yes", mei: "optional" },
      }),
    ).toEqual({
      value: { accountTypeFilter: { jointBanking: "required", mei: "optional" } },
      droppedFields: ["accountTypeFilter.jointOnly"],
    });
  });

  it("names accountTypeFilter itself when it is present but not object-shaped", () => {
    expect(parseStoredComparisonOptions({ accountTypeFilter: "garbage" })).toEqual({
      value: {},
      droppedFields: ["accountTypeFilter"],
    });
    expect(parseStoredComparisonOptions({ accountTypeFilter: [1, 2, 3] })).toEqual({
      value: {},
      droppedFields: ["accountTypeFilter"],
    });
    expect(parseStoredComparisonOptions({ accountTypeFilter: null })).toEqual({
      value: {},
      droppedFields: ["accountTypeFilter"],
    });
  });

  it("never names a filter field the household simply never set", () => {
    expect(
      parseStoredComparisonOptions({ accountTypeFilter: { jointBanking: "required" } }),
    ).toEqual({
      value: { accountTypeFilter: { jointBanking: "required" } },
      droppedFields: [],
    });
  });

  it("falls back to nothing, with no individual field named, for a value that is not an options-shaped object at all", () => {
    expect(parseStoredComparisonOptions("garbage")).toEqual({ value: {}, droppedFields: [] });
    expect(parseStoredComparisonOptions(null)).toEqual({ value: {}, droppedFields: [] });
    expect(parseStoredComparisonOptions([1, 2, 3])).toEqual({ value: {}, droppedFields: [] });
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

describe("parseAccountTypeFilterForm", () => {
  it("accepts the four filter fields", () => {
    expect(
      parseAccountTypeFilterForm(
        form({
          jointBanking: "required",
          jointOnly: "true",
          jointInvestment: "optional",
          mei: "required",
        }),
      ),
    ).toEqual({
      status: "ok",
      value: {
        jointBanking: "required",
        jointOnly: true,
        jointInvestment: "optional",
        mei: "required",
      },
    });
  });

  it("refuses a missing or invalid field", () => {
    expect(
      parseAccountTypeFilterForm(
        form({
          jointBanking: "essential",
          jointOnly: "false",
          jointInvestment: "optional",
          mei: "optional",
        }),
      ).status,
    ).toBe("invalid");
    const missing = form({ jointOnly: "false", jointInvestment: "optional", mei: "optional" });
    expect(parseAccountTypeFilterForm(missing).status).toBe("invalid");
  });
});

describe("parseOverrideForm", () => {
  const valid = {
    institutionId: "nubank",
    criterion: "fees",
    seenReviewedAt: "2026-10-02",
    score: "40",
    note: "  A tarifa subiu.  ",
    sourceUrl: "",
  };

  it("accepts a correction to a profiled bank, trims the note and treats an empty link as none", () => {
    expect(parseOverrideForm(form(valid))).toEqual({
      status: "ok",
      value: {
        institutionId: "nubank",
        criterion: "fees",
        seenReviewedAt: "2026-10-02",
        score: 40,
        note: "A tarifa subiu.",
        sourceUrl: null,
      },
    });
    expect(
      parseOverrideForm(form({ ...valid, sourceUrl: "https://nubank.com.br/tarifas" })),
    ).toMatchObject({ status: "ok", value: { sourceUrl: "https://nubank.com.br/tarifas" } });
  });

  it("refuses an unknown bank or criterion, the retired jointBanking criterion, a score outside 0 to 100 and an empty note", () => {
    for (const entries of [
      { ...valid, institutionId: "banco-inexistente" },
      { ...valid, criterion: "vibes" },
      { ...valid, criterion: "jointBanking" },
      { ...valid, seenReviewedAt: "" },
      { ...valid, score: "101" },
      { ...valid, score: "-1" },
      { ...valid, score: "4.5" },
      { ...valid, note: "   " },
      { ...valid, note: "x".repeat(501) },
    ]) {
      expect(parseOverrideForm(form(entries)), JSON.stringify(entries)).toEqual({
        status: "invalid",
      });
    }
  });

  it("asks for an https link when the source is anything else", () => {
    for (const sourceUrl of ["http://nubank.com.br", "javascript:alert(1)", "nubank.com.br"]) {
      expect(parseOverrideForm(form({ ...valid, sourceUrl })), sourceUrl).toEqual({
        status: "invalid_source",
      });
    }
  });
});

describe("parseAccountTypeOverrideForm", () => {
  const valid = {
    institutionId: "nubank",
    accountType: "joint",
    seenReviewedAt: "2026-10-02",
    offered: "true",
    note: "  Agora abre conta conjunta.  ",
    sourceUrl: "",
  };

  it("accepts a correction to a profiled bank's account type, trims the note and treats an empty link as none", () => {
    expect(parseAccountTypeOverrideForm(form(valid))).toEqual({
      status: "ok",
      value: {
        institutionId: "nubank",
        accountType: "joint",
        seenReviewedAt: "2026-10-02",
        offered: true,
        note: "Agora abre conta conjunta.",
        sourceUrl: null,
      },
    });
  });

  it("refuses an unknown bank or account type and an empty note", () => {
    for (const entries of [
      { ...valid, institutionId: "banco-inexistente" },
      { ...valid, accountType: "poupanca" },
      { ...valid, note: "   " },
      { ...valid, note: "x".repeat(501) },
    ]) {
      expect(parseAccountTypeOverrideForm(form(entries)), JSON.stringify(entries)).toEqual({
        status: "invalid",
      });
    }
  });

  it("asks for an https link when the source is anything else", () => {
    expect(
      parseAccountTypeOverrideForm(form({ ...valid, sourceUrl: "http://nubank.com.br" })),
    ).toEqual({ status: "invalid_source" });
  });
});
