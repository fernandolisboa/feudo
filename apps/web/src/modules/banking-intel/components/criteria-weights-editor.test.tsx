// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateComparisonSettingsActionMock = vi.hoisted(() => vi.fn());
const resetCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  updateComparisonSettingsAction: updateComparisonSettingsActionMock,
  resetCriteriaWeightsAction: resetCriteriaWeightsActionMock,
}));

import type { ComparisonOptionsView, CriterionWeightView } from "../page-props";
import { t } from "../strings";
import { minimumScoreFieldName } from "../validation";
import { CriteriaWeightsEditor } from "./criteria-weights-editor";

function weights(jointBankingMinimum: number): CriterionWeightView[] {
  return [
    {
      criterion: "fees",
      label: "Tarifas",
      help: "custo",
      level: 5,
      levelLabel: "Muito alto",
      share: 50,
      isRequired: false,
      minimumScore: 60,
      minimumScoreHint: null,
    },
    {
      criterion: "jointBanking",
      label: "Dinheiro a dois",
      help: "conta conjunta",
      level: "required",
      levelLabel: "Obrigatório",
      share: 50,
      isRequired: true,
      minimumScore: jointBankingMinimum,
      minimumScoreHint: "100: só conta conjunta · 65: aceita conta compartilhada",
    },
  ];
}

const OPTIONS: ComparisonOptionsView = { candidateCount: 3, proConMinDifference: 10 };

function minimumScoreSlider(): HTMLElement {
  const [slider] = screen.getAllByRole("slider", { hidden: true });
  if (!slider) throw new Error("expected at least one slider");
  return slider;
}

beforeEach(() => {
  updateComparisonSettingsActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.saved });
  resetCriteriaWeightsActionMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("CriteriaWeightsEditor", () => {
  it("follows new props after a rerender, instead of freezing at what it first mounted with", () => {
    const { rerender } = render(
      <CriteriaWeightsEditor weights={weights(70)} options={OPTIONS} weightsAreCustom />,
    );

    expect(screen.getByText("Nota mínima: 70")).not.toBeNull();

    rerender(<CriteriaWeightsEditor weights={weights(85)} options={OPTIONS} weightsAreCustom />);

    expect(screen.queryByText("Nota mínima: 70")).toBeNull();
    expect(screen.getByText("Nota mínima: 85")).not.toBeNull();
  });

  it("reverts to the server's values after a rejected save, and the next save posts those values", async () => {
    updateComparisonSettingsActionMock.mockResolvedValueOnce({
      status: "error",
      message: t.errors.failed,
    });
    render(<CriteriaWeightsEditor weights={weights(70)} options={OPTIONS} weightsAreCustom />);

    fireEvent.change(minimumScoreSlider(), { target: { value: "75" } });

    await screen.findByText(t.errors.failed);
    expect(screen.getByText("Nota mínima: 70")).not.toBeNull();
    expect(screen.queryByText("Nota mínima: 75")).toBeNull();

    updateComparisonSettingsActionMock.mockResolvedValueOnce({
      status: "success",
      message: t.saved,
    });
    fireEvent.change(minimumScoreSlider(), { target: { value: "80" } });

    await waitFor(() => {
      expect(updateComparisonSettingsActionMock).toHaveBeenCalledTimes(2);
    });
    const postedForm = updateComparisonSettingsActionMock.mock.calls[1]?.[1] as FormData;
    expect(postedForm.get(minimumScoreFieldName("jointBanking"))).toBe("80");
    expect(postedForm.get("fees")).toBe("5");
    expect(postedForm.get(minimumScoreFieldName("fees"))).toBe("60");
    expect(postedForm.get("candidateCount")).toBe("3");
    expect(postedForm.get("proConMinDifference")).toBe("10");
  });
});
