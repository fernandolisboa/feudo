import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_COMPARISON_SETTINGS, DEFAULT_WEIGHT_LEVELS } from "@feudo/core";

const getMock = vi.hoisted(() => vi.fn());

vi.mock("./repository", () => ({
  createCriteriaWeightsRepository: () => ({ get: getMock }),
}));

import type { HouseholdScope } from "@/modules/households";
import type { Database } from "@/platform/db/client";
import { getHouseholdCriteriaWeights } from "./service";

const scope: HouseholdScope = { householdId: "household-1" };
const db = {} as Database;

beforeEach(() => {
  getMock.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getHouseholdCriteriaWeights", () => {
  it("warns naming only the dropped option fields, never the household id or the invalid values", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: DEFAULT_WEIGHT_LEVELS,
      options: {
        status: "found",
        value: { proConMinDifference: 15 },
        droppedFields: ["candidateCount", "minimumScores.jointBanking"],
      },
    });

    await getHouseholdCriteriaWeights(scope, db);

    expect(console.warn).toHaveBeenCalledTimes(1);
    const [message] = vi.mocked(console.warn).mock.calls[0] as [string];
    expect(message).toContain("candidateCount");
    expect(message).toContain("minimumScores.jointBanking");
    expect(message).not.toContain(scope.householdId);
    expect(message).not.toContain("99");
  });

  it("does not warn when the stored options have nothing dropped", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: DEFAULT_WEIGHT_LEVELS,
      options: { status: "found", value: {}, droppedFields: [] },
    });

    await getHouseholdCriteriaWeights(scope, db);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not warn for options that were never stored at all", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: DEFAULT_WEIGHT_LEVELS,
      options: { status: "absent" },
    });

    const result = await getHouseholdCriteriaWeights(scope, db);

    expect(console.warn).not.toHaveBeenCalled();
    expect(result.options).toEqual(DEFAULT_COMPARISON_SETTINGS);
    expect(result.isCustom).toBe(true);
  });

  it("is not custom when only the account-type filter was ever saved, with no weights or weights-panel options", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: {},
      options: {
        status: "found",
        value: { accountTypeFilter: { jointBanking: "required" } },
        droppedFields: [],
      },
    });

    const result = await getHouseholdCriteriaWeights(scope, db);

    expect(result.isCustom).toBe(false);
  });

  it("is custom when the weights-panel options were saved, even with no weights of its own", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: {},
      options: { status: "found", value: { candidateCount: 2 }, droppedFields: [] },
    });

    const result = await getHouseholdCriteriaWeights(scope, db);

    expect(result.isCustom).toBe(true);
  });

  it("warns once for unreadable options, without also reporting dropped fields", async () => {
    getMock.mockResolvedValue({
      status: "found",
      levels: DEFAULT_WEIGHT_LEVELS,
      options: { status: "unreadable" },
    });

    await getHouseholdCriteriaWeights(scope, db);

    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
