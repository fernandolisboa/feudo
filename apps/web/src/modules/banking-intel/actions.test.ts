import { beforeEach, describe, expect, it, vi } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_CRITERIA_WEIGHTS } from "@feudo/core";

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
import { resetCriteriaWeightsAction, updateCriteriaWeightsAction } from "./actions";
import { t } from "./strings";

function defaultsForm(): FormData {
  const formData = new FormData();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    formData.set(criterion, String(DEFAULT_CRITERIA_WEIGHTS[criterion]));
  }
  return formData;
}

beforeEach(() => {
  getViewerRoleMock.mockReset().mockResolvedValue("admin");
  setHouseholdCriteriaWeightsMock.mockReset();
  resetHouseholdCriteriaWeightsMock.mockReset();
  revalidatePathMock.mockClear();
});

describe("updateCriteriaWeightsAction", () => {
  it("rejects malformed input before touching the session or the service", async () => {
    const result = await updateCriteriaWeightsAction(initialActionState, new FormData());

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(getViewerRoleMock).not.toHaveBeenCalled();
    expect(setHouseholdCriteriaWeightsMock).not.toHaveBeenCalled();
  });

  it("saves the scoped household's weights and revalidates the page", async () => {
    setHouseholdCriteriaWeightsMock.mockResolvedValue({ status: "ok" });

    const result = await updateCriteriaWeightsAction(initialActionState, defaultsForm());

    expect(result).toEqual({ status: "success", message: t.saved });
    expect(setHouseholdCriteriaWeightsMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      DEFAULT_CRITERIA_WEIGHTS,
      {},
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/bancos");
  });

  it("reports a failed save", async () => {
    setHouseholdCriteriaWeightsMock.mockResolvedValue({ status: "failed" });

    const result = await updateCriteriaWeightsAction(initialActionState, defaultsForm());

    expect(result).toEqual({ status: "error", message: t.errors.failed });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("refuses a member", async () => {
    getViewerRoleMock.mockResolvedValue("member");

    const result = await updateCriteriaWeightsAction(initialActionState, defaultsForm());

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
