// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveCriterionOverrideActionMock = vi.hoisted(() => vi.fn());
const resolveCriterionOverrideActionMock = vi.hoisted(() => vi.fn());
const saveAccountTypeOverrideActionMock = vi.hoisted(() => vi.fn());
const resolveAccountTypeOverrideActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions", () => ({
  saveCriterionOverrideAction: saveCriterionOverrideActionMock,
  resolveCriterionOverrideAction: resolveCriterionOverrideActionMock,
  saveAccountTypeOverrideAction: saveAccountTypeOverrideActionMock,
  resolveAccountTypeOverrideAction: resolveAccountTypeOverrideActionMock,
}));

import type {
  AccountTypeDetailView,
  BankDetailPageProps,
  CriterionDetailView,
} from "../bank-detail-props";
import { t } from "../strings";
import { BankDetailView } from "./bank-detail-view";

const FEES: CriterionDetailView = {
  criterion: "fees",
  label: "Tarifas",
  help: "quanto custa",
  weightLabel: "Peso: Muito alto · 55% da nota",
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

const JOINT: AccountTypeDetailView = {
  type: "joint",
  label: "Conta conjunta",
  statusLabel: "Tem",
  referenceStatusLabel: "Não tem",
  condition: "só no Ultravioleta",
  summary: "Saldo Compartilhado no Ultravioleta.",
  sources: [],
  review: { label: "Revisado em 13/10/2026", stale: false },
  referenceReviewedAt: "2026-11-01",
  override: {
    statusLabel: "Tem",
    summary: "A casa mudou para Tem em 14/10/2026: só no Ultravioleta.",
    sourceUrl: "https://nubank.com.br/ultravioleta",
    outdatedHint: "O Feudo revisou Conta conjunta em 01/11/2026, depois da alteração de vocês.",
  },
  formDefaults: {
    offered: true,
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
    criteria: [FEES],
    accountTypes: [JOINT],
    ...overrides,
  };
}

beforeEach(() => {
  saveCriterionOverrideActionMock.mockReset().mockResolvedValue({ status: "idle" });
  resolveCriterionOverrideActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.override.removed });
  saveAccountTypeOverrideActionMock.mockReset().mockResolvedValue({ status: "idle" });
  resolveAccountTypeOverrideActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.accountTypes.removed });
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

  it("heads the criteria and the account types without a caption beside the title", () => {
    render(<BankDetailView {...buildProps()} />);

    expect(screen.queryByText("o que o Feudo encontrou e onde")).toBeNull();
  });

  it("shows every account type with its status, condition and the household's correction, asking whether to take a newer review", async () => {
    render(<BankDetailView {...buildProps()} />);

    const joint = screen.getByRole("listitem", { name: "Conta conjunta" });
    expect(within(joint).getByText("só no Ultravioleta")).not.toBeNull();
    expect(within(joint).getByText(t.detail.householdScore)).not.toBeNull();
    expect(within(joint).getByText(JOINT.override?.summary ?? "")).not.toBeNull();
    expect(within(joint).getByText(JOINT.override?.outdatedHint ?? "")).not.toBeNull();
    expect(within(joint).getByText(/Resposta do Feudo: Não tem/)).not.toBeNull();

    fireEvent.click(within(joint).getByRole("button", { name: t.detail.keepOwn }));
    await waitFor(() => {
      expect(resolveAccountTypeOverrideActionMock).toHaveBeenCalledWith(
        "nubank",
        "joint",
        "keepOwn",
        "2026-11-01",
      );
    });
  });

  it("offers to undo an account-type correction that has no newer review", async () => {
    const current = {
      ...JOINT,
      override: JOINT.override && { ...JOINT.override, outdatedHint: null },
    };
    render(<BankDetailView {...buildProps({ accountTypes: [current] })} />);

    const joint = screen.getByRole("listitem", { name: "Conta conjunta" });
    expect(within(joint).queryByRole("button", { name: t.detail.keepOwn })).toBeNull();
    fireEvent.click(within(joint).getByRole("button", { name: t.accountTypes.undo }));
    await waitFor(() => {
      expect(resolveAccountTypeOverrideActionMock).toHaveBeenCalledWith(
        "nubank",
        "joint",
        "useReference",
        "2026-11-01",
      );
    });
  });

  it("opens the account-type correction form with the current status, note and link fields", async () => {
    render(<BankDetailView {...buildProps({ accountTypes: [{ ...JOINT, override: null }] })} />);

    const joint = screen.getByRole("listitem", { name: "Conta conjunta" });
    fireEvent.click(within(joint).getByRole("button", { name: t.accountTypes.correct }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(t.accountTypes.dialog.note)).not.toBeNull();
    expect(within(dialog).getByText(t.accountTypes.dialog.sourceUrl)).not.toBeNull();
  });

  it("shows a member the data and the corrections without any control to change them", () => {
    render(<BankDetailView {...buildProps({ canManage: false })} />);

    expect(screen.queryByRole("button", { name: t.detail.correct })).toBeNull();
    expect(screen.queryByRole("button", { name: t.accountTypes.correct })).toBeNull();
    expect(screen.queryByRole("button", { name: t.detail.keepOwn })).toBeNull();
    expect(screen.getByText(JOINT.override?.outdatedHint ?? "")).not.toBeNull();
    expect(screen.getByText(t.detail.readOnly)).not.toBeNull();
    expect(screen.getByText(t.accountTypes.readOnly)).not.toBeNull();
  });
});
