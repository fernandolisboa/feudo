// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateComparisonSettingsActionMock = vi.hoisted(() => vi.fn());
const resetCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions", () => ({
  updateComparisonSettingsAction: updateComparisonSettingsActionMock,
  resetCriteriaWeightsAction: resetCriteriaWeightsActionMock,
}));

import type { BanksPageProps, CriterionWeightView } from "../page-props";
import { interpolate } from "@/lib/interpolate";
import { t } from "../strings";
import { BanksView } from "./banks-view";

const WEIGHTS: CriterionWeightView[] = [
  {
    criterion: "cardBenefits",
    label: "Benefícios do cartão",
    help: "pontos",
    level: 2,
    levelLabel: "Baixo",
    share: 7,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "investmentAccess",
    label: "Acesso a investimentos",
    help: "Tesouro",
    level: 3,
    levelLabel: "Médio",
    share: 10,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "appQuality",
    label: "Qualidade do app",
    help: "lojas",
    level: 3,
    levelLabel: "Médio",
    share: 10,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "security",
    label: "Segurança",
    help: "proteção",
    level: 4,
    levelLabel: "Alto",
    share: 13,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "fees",
    label: "Tarifas",
    help: "custo",
    level: 5,
    levelLabel: "Muito alto",
    share: 17,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "lockIn",
    label: "Aprisionamento",
    help: "sair",
    level: 4,
    levelLabel: "Alto",
    share: 13,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "publicReviews",
    label: "Avaliações de clientes",
    help: "Reclame Aqui",
    level: 4,
    levelLabel: "Alto",
    share: 13,
    isRequired: false,
    minimumScore: 60,
    minimumScoreHint: null,
  },
  {
    criterion: "jointBanking",
    label: "Dinheiro a dois",
    help: "conta conjunta ou conta compartilhada para os dois",
    level: "essential",
    levelLabel: "Essencial",
    share: 50,
    isRequired: false,
    minimumScore: 100,
    minimumScoreHint: "100: só conta conjunta · 65: aceita conta compartilhada",
  },
];

function buildProps(overrides: Partial<BanksPageProps> = {}): BanksPageProps {
  return {
    headline: "Nubank é o banco que mais combina com os pesos da casa.",
    canManage: true,
    weightsAreCustom: false,
    weights: WEIGHTS,
    options: { candidateCount: 3, proConMinDifference: 10 },
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
    overridesNotice: null,
    candidates: [
      {
        institutionId: "nubank",
        href: "/bancos/nubank",
        rankLabel: "1º",
        name: "Nubank",
        scoreLabel: "77",
        review: { label: "Revisado em 09/09/2026", stale: false },
        pros: ["Tarifas: 100 contra 40 (Itaú)"],
        cons: [],
        emptyPros: interpolate(t.candidates.noPros, "{threshold}", "10"),
        emptyCons: interpolate(t.candidates.noCons, "{threshold}", "10"),
        missingEvidence: null,
      },
      {
        institutionId: "btg",
        href: "/bancos/btg",
        rankLabel: "2º",
        name: "BTG Pactual",
        scoreLabel: "76",
        review: { label: "Revisado em 01/03/2026", stale: true },
        pros: [],
        cons: ["Aprisionamento: 40 contra 60 (Itaú)"],
        emptyPros: interpolate(t.candidates.noPros, "{threshold}", "10"),
        emptyCons: interpolate(t.candidates.noCons, "{threshold}", "10"),
        missingEvidence: "Evidência insuficiente em: Qualidade do app, Segurança.",
      },
    ],
    reviewed: [
      {
        institutionId: "nubank",
        href: "/bancos/nubank",
        positionLabel: "1º",
        name: "Nubank",
        tag: t.reviewed.candidate,
        unmetLabel: null,
        overriddenLabel: null,
        scoreLabel: "77",
        review: { label: "Revisado em 09/09/2026", stale: false },
      },
      {
        institutionId: "btg",
        href: "/bancos/btg",
        positionLabel: "2º",
        name: "BTG Pactual",
        tag: t.reviewed.candidate,
        unmetLabel: null,
        overriddenLabel: null,
        scoreLabel: "76",
        review: { label: "Revisado em 01/03/2026", stale: true },
      },
      {
        institutionId: "itau",
        href: "/bancos/itau",
        positionLabel: "3º",
        name: "Itaú",
        tag: t.reviewed.current,
        unmetLabel: null,
        overriddenLabel: null,
        scoreLabel: "60",
        review: { label: "Revisado em 09/09/2026", stale: false },
      },
      {
        institutionId: "bradesco",
        href: "/bancos/bradesco",
        positionLabel: "4º",
        name: "Bradesco",
        tag: null,
        unmetLabel: "não atende: Dinheiro a dois",
        overriddenLabel: null,
        scoreLabel: "53",
        review: { label: "Revisado em 09/09/2026", stale: false },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  updateComparisonSettingsActionMock
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
    expect(nubank.getByText(interpolate(t.candidates.noCons, "{threshold}", "10"))).not.toBeNull();

    const btg = within(screen.getByRole("article", { name: "BTG Pactual" }));
    expect(btg.getByText(t.candidates.stale)).not.toBeNull();
    expect(btg.getByText(interpolate(t.candidates.noPros, "{threshold}", "10"))).not.toBeNull();
    expect(btg.getByText("Evidência insuficiente em: Qualidade do app, Segurança.")).not.toBeNull();
  });

  it("lists every reviewed bank in score order, marking the household's, the candidates and a bank that misses a requirement", () => {
    render(<BanksView {...buildProps()} />);

    const table = within(screen.getByRole("table"));
    const rows = table.getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[1]?.textContent)).toEqual([
      `Nubank${t.reviewed.candidate}`,
      `BTG Pactual${t.reviewed.candidate}`,
      `Itaú${t.reviewed.current}`,
      "Bradesconão atende: Dinheiro a dois",
    ]);

    const itau = table.getByRole("row", { name: /Itaú/ });
    expect(within(itau).getByText("3º")).not.toBeNull();
    expect(within(itau).getByText("60")).not.toBeNull();
    expect(within(itau).getByText("Revisado em 09/09/2026")).not.toBeNull();

    const bradesco = table.getByRole("row", { name: /Bradesco/ });
    expect(within(bradesco).getByText("53")).not.toBeNull();
  });

  it("places the analyst's note between the candidates and the full list", () => {
    render(<BanksView {...buildProps()} analystNote={<p>Nota do analista</p>} />);

    const note = screen.getByText("Nota do analista");
    const candidates = screen.getByRole("heading", { name: t.candidates.title });
    const reviewed = screen.getByRole("heading", { name: t.reviewed.title });
    expect(
      candidates.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(note.compareDocumentPosition(reviewed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
  });

  it("names the connections it could not recognise", () => {
    render(<BanksView {...buildProps({ unrecognizedNotice: "Não reconhecemos: MeuPluggy." })} />);

    expect(screen.getByText("Não reconhecemos: MeuPluggy.")).not.toBeNull();
  });

  it("links every bank to its own page and says when Feudo reviewed one of the household's corrections", () => {
    render(
      <BanksView
        {...buildProps({ overridesNotice: "O Feudo tem uma revisão mais nova (Nubank)." })}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Nubank" });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute("href") === "/bancos/nubank")).toBe(true);
    expect(screen.getByText("O Feudo tem uma revisão mais nova (Nubank).")).not.toBeNull();
  });

  it("shows the weights read-only to a member who cannot manage the household, with shares and minimums", () => {
    render(<BanksView {...buildProps({ canManage: false })} />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Muito alto")).not.toBeNull();
    expect(screen.getByText("50% da nota")).not.toBeNull();
    expect(screen.getByText(t.weights.readOnly)).not.toBeNull();
  });

  it("gives an owner or admin one level control per criterion, plus the comparison settings sliders", () => {
    render(<BanksView {...buildProps()} />);

    expect(screen.getAllByRole("combobox")).toHaveLength(WEIGHTS.length);
    expect(screen.getByRole("combobox", { name: "Tarifas" })).not.toBeNull();
    expect(screen.getByText(t.weights.defaults)).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.weights.reset })).toBeNull();
    expect(screen.getByText(t.options.title)).not.toBeNull();
    expect(screen.getAllByRole("slider", { hidden: true }).length).toBeGreaterThanOrEqual(2);
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
