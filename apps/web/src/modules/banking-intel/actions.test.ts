import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BANK_PROFILE_CRITERIA,
  DEFAULT_MINIMUM_SCORES,
  DEFAULT_WEIGHT_LEVELS,
  type BankProfileCriterion,
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
const saveCriterionOverrideMock = vi.hoisted(() => vi.fn());
const removeCriterionOverrideMock = vi.hoisted(() => vi.fn());
const keepCriterionOverrideMock = vi.hoisted(() => vi.fn());

vi.mock("./service", () => ({
  setHouseholdCriteriaWeights: setHouseholdCriteriaWeightsMock,
  resetHouseholdCriteriaWeights: resetHouseholdCriteriaWeightsMock,
  saveCriterionOverride: saveCriterionOverrideMock,
  removeCriterionOverride: removeCriterionOverrideMock,
  keepCriterionOverride: keepCriterionOverrideMock,
}));

import { initialActionState } from "@/lib/action-state";
import {
  resetCriteriaWeightsAction,
  resolveCriterionOverrideAction,
  saveCriterionOverrideAction,
  updateComparisonSettingsAction,
} from "./actions";
import { t } from "./strings";
import type { OverrideDecision } from "./validation";
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
  saveCriterionOverrideMock.mockReset().mockResolvedValue({ status: "ok" });
  removeCriterionOverrideMock.mockReset().mockResolvedValue({ status: "ok" });
  keepCriterionOverrideMock.mockReset().mockResolvedValue({ status: "ok" });
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

function overrideForm(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries({
    institutionId: "nubank",
    criterion: "fees",
    seenReviewedAt: "2026-10-02",
    score: "40",
    note: "A tarifa subiu.",
    sourceUrl: "",
    ...entries,
  })) {
    formData.set(key, value);
  }
  return formData;
}

describe("saveCriterionOverrideAction", () => {
  it("rejects a malformed correction or a non-https link before touching the session", async () => {
    expect(
      await saveCriterionOverrideAction(initialActionState, overrideForm({ score: "x" })),
    ).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(
      await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ sourceUrl: "http://nubank.com.br" }),
      ),
    ).toEqual({ status: "error", message: t.override.invalidSource });
    expect(getViewerRoleMock).not.toHaveBeenCalled();
    expect(saveCriterionOverrideMock).not.toHaveBeenCalled();
  });

  it("refuses a member and saves an admin's correction for the session's household", async () => {
    getViewerRoleMock.mockResolvedValue("member");
    expect(await saveCriterionOverrideAction(initialActionState, overrideForm({}))).toEqual({
      status: "error",
      message: t.errors.notAllowed,
    });
    expect(saveCriterionOverrideMock).not.toHaveBeenCalled();

    getViewerRoleMock.mockResolvedValue("admin");
    expect(await saveCriterionOverrideAction(initialActionState, overrideForm({}))).toEqual({
      status: "success",
      message: t.override.saved,
    });
    expect(saveCriterionOverrideMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      {
        institutionId: "nubank",
        criterion: "fees",
        seenReviewedAt: "2026-10-02",
        score: 40,
        note: "A tarifa subiu.",
        sourceUrl: null,
      },
      {},
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/bancos/nubank");
  });
});

describe("resolveCriterionOverrideAction", () => {
  it("rejects an unknown bank, criterion or decision before touching the session", async () => {
    for (const args of [
      ["banco-inexistente", "fees", "keepOwn", "2026-10-02"],
      ["nubank", "vibes", "keepOwn", "2026-10-02"],
      ["nubank", "fees", "deleteEverything", "2026-10-02"],
      ["nubank", "fees", "keepOwn", "ontem"],
    ]) {
      const [institutionId = "", criterion = "", decision = "", seenReviewedAt = ""] = args;
      expect(
        await resolveCriterionOverrideAction(
          institutionId,
          criterion as BankProfileCriterion,
          decision as OverrideDecision,
          seenReviewedAt,
        ),
        args.join(),
      ).toEqual({
        status: "error",
        message: t.errors.invalidInput,
      });
    }
    expect(getViewerRoleMock).not.toHaveBeenCalled();
  });

  it("drops the correction to use Feudo's data, or keeps it against the newer review", async () => {
    expect(
      await resolveCriterionOverrideAction("nubank", "fees", "useReference", "2026-10-02"),
    ).toEqual({
      status: "success",
      message: t.override.removed,
    });
    expect(removeCriterionOverrideMock).toHaveBeenCalledTimes(1);
    expect(await resolveCriterionOverrideAction("nubank", "fees", "keepOwn", "2026-10-02")).toEqual(
      {
        status: "success",
        message: t.override.kept,
      },
    );
    expect(keepCriterionOverrideMock).toHaveBeenCalledTimes(1);
  });
});
