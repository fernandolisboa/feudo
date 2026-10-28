// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateComparisonSettingsActionMock = vi.hoisted(() => vi.fn());
const resetCriteriaWeightsActionMock = vi.hoisted(() => vi.fn());
const updateAccountTypeFilterActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions", () => ({
  updateComparisonSettingsAction: updateComparisonSettingsActionMock,
  resetCriteriaWeightsAction: resetCriteriaWeightsActionMock,
  updateAccountTypeFilterAction: updateAccountTypeFilterActionMock,
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
  },
  {
    criterion: "investmentAccess",
    label: "Acesso a investimentos",
    help: "Tesouro",
    level: 3,
    levelLabel: "Médio",
    share: 10,
  },
  {
    criterion: "appQuality",
    label: "Qualidade do app",
    help: "lojas",
    level: 3,
    levelLabel: "Médio",
    share: 10,
  },
  {
    criterion: "security",
    label: "Segurança",
    help: "proteção",
    level: 4,
    levelLabel: "Alto",
    share: 13,
  },
  {
    criterion: "fees",
    label: "Tarifas",
    help: "custo",
    level: 5,
    levelLabel: "Muito alto",
    share: 17,
  },
  {
    criterion: "lockIn",
    label: "Aprisionamento",
    help: "sair",
    level: 4,
    levelLabel: "Alto",
    share: 13,
  },
  {
    criterion: "publicReviews",
    label: "Avaliações de clientes",
    help: "Reclame Aqui",
    level: 4,
    levelLabel: "Alto",
    share: 13,
  },
];

function buildProps(overrides: Partial<BanksPageProps> = {}): BanksPageProps {
  return {
    headline: "Nubank é o banco que mais combina com os pesos da casa.",
    canManage: true,
    weightsAreCustom: false,
    weights: WEIGHTS,
    options: { candidateCount: 3, proConMinDifference: 10 },
    accountTypeFilter: {
      jointBanking: "optional",
      jointOnly: false,
      jointInvestment: "optional",
      mei: "optional",
    },
    accountTypeFilterSummary: "Mostrando todos os 13 bancos.",
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
        score: 77,
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
        score: 76,
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
        offeredTypesLine: "conjunta · compartilhada (só no Ultravioleta)",
        score: 77,
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
        offeredTypesLine: null,
        score: 76,
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
        offeredTypesLine: null,
        score: 60,
        scoreLabel: "60",
        review: { label: "Revisado em 09/09/2026", stale: false },
      },
      {
        institutionId: "bradesco",
        href: "/bancos/bradesco",
        positionLabel: "4º",
        name: "Bradesco",
        tag: null,
        unmetLabel: "não tem: conta MEI",
        overriddenLabel: null,
        offeredTypesLine: "conjunta",
        score: 53,
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
  updateAccountTypeFilterActionMock
    .mockReset()
    .mockResolvedValue({ status: "success", message: t.saved });
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

  it("shows the account-type filter summary under the panel", () => {
    render(<BanksView {...buildProps()} />);

    expect(screen.getByText("Mostrando todos os 13 bancos.")).not.toBeNull();
  });

  it("shows each candidate with its score, review date, pros, cons and missing evidence", () => {
    render(<BanksView {...buildProps()} />);

    const nubank = within(screen.getByRole("article", { name: "Nubank" }));
    expect(nubank.getByRole("button", { name: "Nota 77 de 100" })).not.toBeNull();
    expect(nubank.getByText("Revisado em 09/09/2026")).not.toBeNull();
    expect(nubank.getByText("Tarifas: 100 contra 40 (Itaú)")).not.toBeNull();
    expect(nubank.getByText(interpolate(t.candidates.noCons, "{threshold}", "10"))).not.toBeNull();

    const btg = within(screen.getByRole("article", { name: "BTG Pactual" }));
    expect(btg.getByText(t.candidates.stale)).not.toBeNull();
    expect(btg.getByText(interpolate(t.candidates.noPros, "{threshold}", "10"))).not.toBeNull();
    expect(btg.getByText("Evidência insuficiente em: Qualidade do app, Segurança.")).not.toBeNull();
  });

  it("lists every reviewed bank, with those that don't meet the filter under their own sub-heading", () => {
    render(<BanksView {...buildProps()} initialTab="todos" />);

    const table = within(screen.getByRole("table"));
    const rows = table.getAllByRole("row").slice(1);
    const names = rows.map((row) => within(row).queryAllByRole("cell")[1]?.textContent ?? "");
    expect(names.slice(0, 3)).toEqual([
      `Nubank${t.reviewed.candidate}conjunta · compartilhada (só no Ultravioleta)`,
      `BTG Pactual${t.reviewed.candidate}`,
      `Itaú${t.reviewed.current}`,
    ]);
    expect(screen.getByText(interpolate(t.reviewed.notMetHeading, "{count}", "1"))).not.toBeNull();
    expect(names.at(-1)).toBe("Bradesconão tem: conta MEIconjunta");
    expect(screen.getByText("conjunta · compartilhada (só no Ultravioleta)")).not.toBeNull();

    const itau = table.getByRole("row", { name: /Itaú/ });
    expect(within(itau).getByText("3º")).not.toBeNull();
    expect(within(itau).getByRole("button", { name: "Nota 60 de 100" })).not.toBeNull();
    expect(within(itau).getByText("Revisado em 09/09/2026")).not.toBeNull();

    const bradesco = table.getByRole("row", { name: /Bradesco/ });
    expect(within(bradesco).getByRole("button", { name: "Nota 53 de 100" })).not.toBeNull();
  });

  it("says a bank has insufficient evidence instead of drawing empty stars", () => {
    const props = buildProps();
    const reviewed = props.reviewed.map((row) =>
      row.institutionId === "bradesco"
        ? { ...row, score: null, scoreLabel: t.candidates.noScore }
        : row,
    );
    render(<BanksView {...props} reviewed={reviewed} initialTab="todos" />);

    const bradesco = within(screen.getByRole("row", { name: /Bradesco/ }));
    expect(bradesco.getByText(t.candidates.noScore)).not.toBeNull();
    expect(bradesco.queryByRole("button", { name: /^Nota/ })).toBeNull();
  });

  it("puts the analyst's note under the candidates, on the tab it opens on", () => {
    render(<BanksView {...buildProps()} analystNote={<p>Nota do analista</p>} />);

    const note = screen.getByText("Nota do analista");
    const candidates = screen.getByRole("heading", { name: t.candidates.title });
    expect(
      candidates.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(note.closest("[hidden]")).toBeNull();
    expect(screen.queryByRole("heading", { name: t.reviewed.title })).toBeNull();
  });

  it("splits the page into candidates, all banks, account types and weights tabs", () => {
    window.history.replaceState(null, "", "/bancos");
    render(<BanksView {...buildProps()} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      t.tabs.candidates,
      t.tabs.reviewed,
      t.tabs.accountTypes,
      t.tabs.weights,
    ]);
    expect(screen.getByRole("tab", { name: t.tabs.candidates }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByText("Mostrando todos os 13 bancos.")).not.toBeNull();
    expect(screen.queryByRole("table")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: t.tabs.weights }));
    expect(screen.getByRole("heading", { name: t.weights.title })).not.toBeNull();
    expect(window.location.search).toBe("?aba=pesos");
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

  it("shows the weights and the filter read-only to a member who cannot manage the household", () => {
    render(<BanksView {...buildProps({ canManage: false })} initialTab="pesos" />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Muito alto")).not.toBeNull();
    expect(screen.getByText("17% da nota")).not.toBeNull();
    expect(screen.getByText(t.weights.readOnly)).not.toBeNull();
    expect(screen.getByText(t.accountTypes.readOnly)).not.toBeNull();
  });

  it("gives an owner or admin one level control per criterion, plus the comparison settings sliders", () => {
    render(<BanksView {...buildProps()} initialTab="pesos" />);

    expect(screen.getAllByRole("combobox")).toHaveLength(WEIGHTS.length);
    expect(screen.getByRole("combobox", { name: "Tarifas" })).not.toBeNull();
    expect(screen.getByText(t.weights.defaults)).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.weights.reset })).toBeNull();
    expect(screen.getByText(t.options.title)).not.toBeNull();
    expect(screen.getAllByRole("slider", { hidden: true }).length).toBeGreaterThanOrEqual(2);
  });

  it("resets custom weights to the product defaults", async () => {
    render(<BanksView {...buildProps({ weightsAreCustom: true })} initialTab="pesos" />);

    expect(screen.getByText(t.weights.custom)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.weights.reset }));

    await waitFor(() => {
      expect(resetCriteriaWeightsActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the server's refusal next to the weights", async () => {
    resetCriteriaWeightsActionMock.mockResolvedValue({ status: "error", message: t.errors.failed });
    render(<BanksView {...buildProps({ weightsAreCustom: true })} initialTab="pesos" />);

    fireEvent.click(screen.getByRole("button", { name: t.weights.reset }));

    expect((await screen.findByRole("alert")).textContent).toBe(t.errors.failed);
  });

  it("headlines that no bank has the marked account types", () => {
    render(<BanksView {...buildProps({ headline: t.headline.noneMeetsRequirements })} />);

    expect(
      screen.getByRole("heading", { level: 1, name: t.headline.noneMeetsRequirements }),
    ).not.toBeNull();
  });
});
