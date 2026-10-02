// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());
const resetCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions", () => ({
  updateCriteriaWeightsAction: updateCriteriaWeightsActionMock,
  resetCriteriaWeightsAction: resetCriteriaWeightsActionMock,
}));

import type { BanksPageProps, CriterionWeightView } from "../page-props";
import { t } from "../strings";
import { BanksView } from "./banks-view";

const WEIGHTS: CriterionWeightView[] = [
  {
    criterion: "cardBenefits",
    label: "Benefícios do cartão",
    help: "pontos",
    weight: 2,
    levelLabel: "Baixo",
  },
  {
    criterion: "investmentAccess",
    label: "Acesso a investimentos",
    help: "Tesouro",
    weight: 3,
    levelLabel: "Médio",
  },
  {
    criterion: "appQuality",
    label: "Qualidade do app",
    help: "lojas",
    weight: 3,
    levelLabel: "Médio",
  },
  { criterion: "security", label: "Segurança", help: "proteção", weight: 4, levelLabel: "Alto" },
  { criterion: "fees", label: "Tarifas", help: "custo", weight: 5, levelLabel: "Muito alto" },
  { criterion: "lockIn", label: "Aprisionamento", help: "sair", weight: 4, levelLabel: "Alto" },
  {
    criterion: "publicReviews",
    label: "Avaliações de clientes",
    help: "Reclame Aqui",
    weight: 4,
    levelLabel: "Alto",
  },
];

function buildProps(overrides: Partial<BanksPageProps> = {}): BanksPageProps {
  return {
    headline: "Nubank é o banco que mais combina com os pesos da casa.",
    canManage: true,
    weightsAreCustom: false,
    weights: WEIGHTS,
    hasAccounts: true,
    currentRows: [
      {
        institutionId: "itau",
        name: "Itaú",
        scoreLabel: "60",
        review: { label: "Revisado em 09/09/2026", stale: false },
      },
    ],
    baselineNotice: null,
    unrecognizedNotice: null,
    candidates: [
      {
        institutionId: "nubank",
        rankLabel: "1º",
        name: "Nubank",
        scoreLabel: "77",
        review: { label: "Revisado em 09/09/2026", stale: false },
        pros: ["Tarifas: 100 contra 40 (Itaú)"],
        cons: [],
        emptyPros: t.candidates.noPros,
        emptyCons: t.candidates.noCons,
        missingEvidence: null,
      },
      {
        institutionId: "btg",
        rankLabel: "2º",
        name: "BTG Pactual",
        scoreLabel: "76",
        review: { label: "Revisado em 01/03/2026", stale: true },
        pros: [],
        cons: ["Aprisionamento: 40 contra 60 (Itaú)"],
        emptyPros: t.candidates.noPros,
        emptyCons: t.candidates.noCons,
        missingEvidence: "Evidência insuficiente em: Qualidade do app, Segurança.",
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  updateCriteriaWeightsActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.saved });
  resetCriteriaWeightsActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.resetDone });
});

afterEach(() => {
  cleanup();
});

describe("BanksView", () => {
  it("states the top candidate in the headline", () => {
    render(<BanksView {...buildProps()} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Nubank é o banco que mais combina com os pesos da casa.",
      }),
    ).not.toBeNull();
  });

  it("shows each candidate with its score, review date, pros, cons and missing evidence", () => {
    render(<BanksView {...buildProps()} />);

    const nubank = within(screen.getByRole("article", { name: "Nubank" }));
    expect(nubank.getByText("77")).not.toBeNull();
    expect(nubank.getByText("Revisado em 09/09/2026")).not.toBeNull();
    expect(nubank.getByText("Tarifas: 100 contra 40 (Itaú)")).not.toBeNull();
    expect(nubank.getByText(t.candidates.noCons)).not.toBeNull();

    const btg = within(screen.getByRole("article", { name: "BTG Pactual" }));
    expect(btg.getByText(t.candidates.stale)).not.toBeNull();
    expect(btg.getByText(t.candidates.noPros)).not.toBeNull();
    expect(btg.getByText("Evidência insuficiente em: Qualidade do app, Segurança.")).not.toBeNull();
  });

  it("lists the banks the household already uses with their review date", () => {
    render(<BanksView {...buildProps()} />);

    const row = screen.getByRole("row", { name: /Itaú/ });
    expect(within(row).getByText("60")).not.toBeNull();
    expect(within(row).getByText("Revisado em 09/09/2026")).not.toBeNull();
  });

  it("offers to connect a bank when the household has no accounts", () => {
    render(
      <BanksView
        {...buildProps({
          hasAccounts: false,
          currentRows: [],
          baselineNotice: t.current.noAccounts,
        })}
      />,
    );

    expect(screen.getByText(t.current.noAccounts)).not.toBeNull();
    expect(screen.getByRole("link", { name: t.current.connectAction }).getAttribute("href")).toBe(
      "/conectar-banco",
    );
    expect(screen.queryByText(t.current.title)).toBeNull();
  });

  it("names the connections it could not recognise", () => {
    render(<BanksView {...buildProps({ unrecognizedNotice: "Não reconhecemos: MeuPluggy." })} />);

    expect(screen.getByText("Não reconhecemos: MeuPluggy.")).not.toBeNull();
  });

  it("shows the weights read-only to a member who cannot manage the household", () => {
    render(<BanksView {...buildProps({ canManage: false })} />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Muito alto")).not.toBeNull();
    expect(screen.getByText(t.weights.readOnly)).not.toBeNull();
  });

  it("gives an owner or admin one weight control per criterion", () => {
    render(<BanksView {...buildProps()} />);

    expect(screen.getAllByRole("combobox")).toHaveLength(WEIGHTS.length);
    expect(screen.getByRole("combobox", { name: "Tarifas" })).not.toBeNull();
    expect(screen.getByText(t.weights.defaults)).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.weights.reset })).toBeNull();
  });

  it("resets custom weights to the product defaults", async () => {
    render(<BanksView {...buildProps({ weightsAreCustom: true })} />);

    expect(screen.getByText(t.weights.custom)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.weights.reset }));

    await waitFor(() => {
      expect(resetCriteriaWeightsActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the server's refusal next to the weights", async () => {
    resetCriteriaWeightsActionMock.mockResolvedValue({ status: "error", message: t.errors.failed });
    render(<BanksView {...buildProps({ weightsAreCustom: true })} />);

    fireEvent.click(screen.getByRole("button", { name: t.weights.reset }));

    expect((await screen.findByRole("alert")).textContent).toBe(t.errors.failed);
  });
});
