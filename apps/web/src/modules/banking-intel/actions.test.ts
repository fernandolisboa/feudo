import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BANK_PROFILE_CRITERIA,
  DEFAULT_MINIMUM_SCORES,
  DEFAULT_WEIGHT_LEVELS,
  type ComparisonSettings,
} from "@feudo/core";

const getViewerRoleMock = vi.hoisted(() => vi.fn());
const setHouseholdCriteriaWeightsMock = vi.hoisted(() => vi.fn());
const resetHouseholdCriteriaWeightsMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", householdId: "household-1" }),
  getViewerRole: getViewerRoleMock,
  canManageHouseholdSettings: (role: string) => role === "owner" || role === "admin",
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  setHouseholdCriteriaWeights: setHouseholdCriteriaWeightsMock,
  resetHouseholdCriteriaWeights: resetHouseholdCriteriaWeightsMock,
}));

import { initialActionState } from "@/lib/action-state";
import { resetCriteriaWeightsAction, updateComparisonSettingsAction } from "./actions";
import { t } from "./strings";
import { minimumScoreFieldName } from "./validation";

function defaultsForm(): FormData {
  const formData = new FormData();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const level = DEFAULT_WEIGHT_LEVELS[criterion];
    formData.set(criterion, String(level));
    formData.set(minimumScoreFieldName(criterion), String(DEFAULT_MINIMUM_SCORES[criterion]));
  }
  formData.set("candidateCount", "3");
  formData.set("proConMinDifference", "10");
  return formData;
}

beforeEach(() => {
  getViewerRoleMock.mockReset().mockResolvedValue("admin");
  setHouseholdCriteriaWeightsMock.mockReset();
  resetHouseholdCriteriaWeightsMock.mockReset();
  revalidatePathMock.mockClear();
});

describe("updateComparisonSettingsAction", () => {
  it("rejects malformed input before touching the session or the service", async () => {
    const result = await updateComparisonSettingsAction(initialActionState, new FormData());

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(getViewerRoleMock).not.toHaveBeenCalled();
    expect(setHouseholdCriteriaWeightsMock).not.toHaveBeenCalled();
  });

  it("saves the scoped household's settings and revalidates the page", async () => {
    setHouseholdCriteriaWeightsMock.mockResolvedValue({ status: "ok" });

    const result = await updateComparisonSettingsAction(initialActionState, defaultsForm());

    expect(result).toEqual({ status: "success", message: t.saved });
    const expectedOptions: ComparisonSettings = {
      minimumScores: DEFAULT_MINIMUM_SCORES,
      candidateCount: 3,
      proConMinDifference: 10,
    };
    expect(setHouseholdCriteriaWeightsMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      { levels: DEFAULT_WEIGHT_LEVELS, options: expectedOptions },
      {},
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/bancos");
  });

  it("reports a failed save", async () => {
    setHouseholdCriteriaWeightsMock.mockResolvedValue({ status: "failed" });

    const result = await updateComparisonSettingsAction(initialActionState, defaultsForm());

    expect(result).toEqual({ status: "error", message: t.errors.failed });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuses a member", async () => {
    getViewerRoleMock.mockResolvedValue("member");

    const result = await updateComparisonSettingsAction(initialActionState, defaultsForm());

    expect(result).toEqual({ status: "error", message: t.errors.notAllowed });
    expect(setHouseholdCriteriaWeightsMock).not.toHaveBeenCalled();
  });
});

describe("resetCriteriaWeightsAction", () => {
  it("reports a failed reset", async () => {
    resetHouseholdCriteriaWeightsMock.mockResolvedValue({ status: "failed" });

    expect(await resetCriteriaWeightsAction()).toEqual({
      status: "error",
      message: t.errors.failed,
    });
  });
});
