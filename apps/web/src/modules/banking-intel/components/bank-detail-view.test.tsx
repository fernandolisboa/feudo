// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveCriterionOverrideActionMock = vi.hoisted(() => vi.fn());
const resolveCriterionOverrideActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions", () => ({
  saveCriterionOverrideAction: saveCriterionOverrideActionMock,
  resolveCriterionOverrideAction: resolveCriterionOverrideActionMock,
}));

import type { BankDetailPageProps, CriterionDetailView } from "../bank-detail-props";
import { t } from "../strings";
import { BankDetailView } from "./bank-detail-view";

const FEES: CriterionDetailView = {
  criterion: "fees",
  label: "Tarifas",
  help: "quanto custa",
  weightLabel: "Peso: Muito alto · 17% da nota",
  scored: true,
  scoreLabel: "100",
  referenceScoreLabel: "100",
  summary: "Sem tarifa de manutenção de conta.",
  sources: [
    {
      url: "https://www.bcb.gov.br/fis/tarifas",
      host: "bcb.gov.br",
      label: "fonte primária · consultada em 09/09/2026",
    },
  ],
  review: { label: "Revisado em 09/09/2026", stale: false },
  referenceReviewedAt: "2026-09-09",
  override: null,
  formDefaults: { score: 100, note: "", sourceUrl: "" },
};

const JOINT: CriterionDetailView = {
  criterion: "jointBanking",
  label: "Dinheiro a dois",
  help: "conta conjunta",
  weightLabel: "Peso: Essencial · 50% da nota",
  scored: true,
  scoreLabel: "30",
  referenceScoreLabel: "65",
  summary: "Saldo Compartilhado no Ultravioleta.",
  sources: [],
  review: { label: "Revisado em 13/10/2026", stale: false },
  referenceReviewedAt: "2026-11-01",
  override: {
    scoreLabel: "30",
    summary: "A casa mudou para 30 em 14/10/2026: só no Ultravioleta.",
    sourceUrl: "https://nubank.com.br/ultravioleta",
    outdatedHint: "O Feudo revisou Dinheiro a dois em 01/11/2026, depois da alteração de vocês.",
  },
  formDefaults: {
    score: 30,
    note: "só no Ultravioleta.",
    sourceUrl: "https://nubank.com.br/ultravioleta",
  },
};

function buildProps(overrides: Partial<BankDetailPageProps> = {}): BankDetailPageProps {
  return {
    institutionId: "nubank",
    name: "Nubank",
    tag: "vocês usam",
    unmetLabel: null,
    stats: [
      { label: "Nota", value: "71", meta: "de 100 com os pesos da casa" },
      { label: "Posição", value: "7º", meta: "entre 13 bancos avaliados" },
      { label: "Garantia", value: "FGC", meta: "por conglomerado: NUBANK" },
    ],
    paymentInstitutionNotice: t.detail.paymentInstitution,
    canManage: true,
    criteria: [FEES, JOINT],
    ...overrides,
  };
}

beforeEach(() => {
  saveCriterionOverrideActionMock.mockReset().mockResolvedValue({ status: "idle" });
  resolveCriterionOverrideActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.override.removed });
});

afterEach(() => {
  cleanup();
});

describe("BankDetailView", () => {
  it("shows the bank's score, place, guarantee and every criterion with its evidence and sources", () => {
    render(<BankDetailView {...buildProps()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Nubank" })).not.toBeNull();
    expect(screen.getByText("71")).not.toBeNull();
    expect(screen.getByText("7º")).not.toBeNull();
    expect(screen.getByText(t.detail.paymentInstitution)).not.toBeNull();
    const fees = screen.getByRole("listitem", { name: "Tarifas" });
    expect(within(fees).getByText("Sem tarifa de manutenção de conta.")).not.toBeNull();
    expect(within(fees).getByRole("link", { name: "bcb.gov.br" }).getAttribute("href")).toBe(
      "https://www.bcb.gov.br/fis/tarifas",
    );
    expect(within(fees).getByText("Revisado em 09/09/2026")).not.toBeNull();
    expect(screen.getByRole("link", { name: t.detail.back }).getAttribute("href")).toBe("/bancos");
  });

  it("puts the household's correction above Feudo's evidence and asks whether to take a newer review", async () => {
    render(<BankDetailView {...buildProps()} />);

    const joint = screen.getByRole("listitem", { name: "Dinheiro a dois" });
    expect(within(joint).getByText(t.detail.householdScore)).not.toBeNull();
    expect(within(joint).getByText(JOINT.override?.summary ?? "")).not.toBeNull();
    expect(within(joint).getByText(JOINT.override?.outdatedHint ?? "")).not.toBeNull();
    expect(within(joint).getByText(/Nota do Feudo: 65/)).not.toBeNull();

    fireEvent.click(within(joint).getByRole("button", { name: t.detail.keepOwn }));
    await waitFor(() => {
      expect(resolveCriterionOverrideActionMock).toHaveBeenCalledWith(
        "nubank",
        "jointBanking",
        "keepOwn",
        "2026-11-01",
      );
    });
  });

  it("offers to undo a correction that has no newer review", async () => {
    const current = {
      ...JOINT,
      override: JOINT.override && { ...JOINT.override, outdatedHint: null },
    };
    render(<BankDetailView {...buildProps({ criteria: [current] })} />);

    expect(screen.queryByRole("button", { name: t.detail.keepOwn })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.detail.undo }));
    await waitFor(() => {
      expect(resolveCriterionOverrideActionMock).toHaveBeenCalledWith(
        "nubank",
        "jointBanking",
        "useReference",
        "2026-11-01",
      );
    });
  });

  it("opens the correction form with the score, note and link fields", async () => {
    render(<BankDetailView {...buildProps({ criteria: [FEES] })} />);

    fireEvent.click(screen.getByRole("button", { name: t.detail.correct }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText<HTMLInputElement>(t.override.score).value).toBe("100");
    expect(within(dialog).getByLabelText(t.override.note)).not.toBeNull();
    expect(within(dialog).getByLabelText(t.override.sourceUrl)).not.toBeNull();
  });

  it("shows a member the data and the corrections without any control to change them", () => {
    render(<BankDetailView {...buildProps({ canManage: false })} />);

    expect(screen.queryByRole("button", { name: t.detail.correct })).toBeNull();
    expect(screen.queryByRole("button", { name: t.detail.keepOwn })).toBeNull();
    expect(screen.getByText(JOINT.override?.outdatedHint ?? "")).not.toBeNull();
    expect(screen.getByText(t.detail.readOnly)).not.toBeNull();
  });
});
