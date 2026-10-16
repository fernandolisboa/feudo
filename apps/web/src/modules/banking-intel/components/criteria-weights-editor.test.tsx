// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountTypeFilter } from "@feudo/core";

const updateComparisonSettingsActionMock = vi.hoisted(() => vi.fn());
const resetCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  updateComparisonSettingsAction: updateComparisonSettingsActionMock,
  resetCriteriaWeightsAction: resetCriteriaWeightsActionMock,
}));

import type { ComparisonOptionsView, CriterionWeightView } from "../page-props";
import { t } from "../strings";
import { CriteriaWeightsEditor } from "./criteria-weights-editor";

function weights(feesLevel: 0 | 1 | 2 | 3 | 4 | 5): CriterionWeightView[] {
  const zero = { level: 0 as const, levelLabel: "Não conta", share: 0 };
  return [
    { criterion: "cardBenefits", label: "Benefícios do cartão", help: "", ...zero },
    { criterion: "investmentAccess", label: "Acesso a investimentos", help: "", ...zero },
    { criterion: "appQuality", label: "Qualidade do app", help: "", ...zero },
    { criterion: "security", label: "Segurança", help: "", ...zero },
    {
      criterion: "fees",
      label: "Tarifas",
      help: "custo",
      level: feesLevel,
      levelLabel: feesLevel > 0 ? "Muito alto" : "Não conta",
      share: 0,
    },
    {
      criterion: "lockIn",
      label: "Aprisionamento",
      help: "sair",
      level: 1,
      levelLabel: "Muito baixo",
      share: 0,
    },
    { criterion: "publicReviews", label: "Avaliações de clientes", help: "", ...zero },
  ] as CriterionWeightView[];
}

function firstSlider(): HTMLElement {
  const [slider] = screen.getAllByRole("slider", { hidden: true });
  if (!slider) throw new Error("expected at least one slider");
  return slider;
}

const OPTIONS: ComparisonOptionsView = { candidateCount: 3, proConMinDifference: 10 };
const FILTER: AccountTypeFilter = {
  jointBanking: "required",
  jointOnly: true,
  jointInvestment: "optional",
  mei: "optional",
};

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
      <CriteriaWeightsEditor
        weights={weights(4)}
        options={OPTIONS}
        accountTypeFilter={FILTER}
        weightsAreCustom
      />,
    );

    expect(screen.getByText("80% da nota")).not.toBeNull();

    rerender(
      <CriteriaWeightsEditor
        weights={weights(2)}
        options={OPTIONS}
        accountTypeFilter={FILTER}
        weightsAreCustom
      />,
    );

    expect(screen.queryByText("80% da nota")).toBeNull();
    expect(screen.getByText("67% da nota")).not.toBeNull();
  });

  it("reverts to the server's values after a rejected save, and the next save posts those values plus the household's account-type filter", async () => {
    updateComparisonSettingsActionMock.mockResolvedValueOnce({
      status: "error",
      message: t.errors.failed,
    });
    render(
      <CriteriaWeightsEditor
        weights={weights(5)}
        options={OPTIONS}
        accountTypeFilter={FILTER}
        weightsAreCustom
      />,
    );

    fireEvent.change(firstSlider(), { target: { value: "4" } });

    await screen.findByText(t.errors.failed);

    updateComparisonSettingsActionMock.mockResolvedValueOnce({
      status: "success",
      message: t.saved,
    });
    fireEvent.change(firstSlider(), { target: { value: "5" } });

    await waitFor(() => {
      expect(updateComparisonSettingsActionMock).toHaveBeenCalledTimes(2);
    });
    const postedForm = updateComparisonSettingsActionMock.mock.calls[1]?.[1] as FormData;
    expect(postedForm.get("candidateCount")).toBe("5");
    expect(postedForm.get("fees")).toBe("5");
    expect(postedForm.get("lockIn")).toBe("1");
    expect(postedForm.get("proConMinDifference")).toBe("10");
    expect(postedForm.get("jointBanking")).toBe("required");
    expect(postedForm.get("jointOnly")).toBe("true");
    expect(postedForm.get("jointInvestment")).toBe("optional");
    expect(postedForm.get("mei")).toBe("optional");
  });
});
