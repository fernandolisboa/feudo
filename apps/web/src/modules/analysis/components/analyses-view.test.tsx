// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ requestAnalysisAction: vi.fn() }));

import type { AnalysesPageProps, AnalysisDetailView } from "../page-props";
import { AnalysesOff, AnalysesView } from "./analyses-view";

function reading(overrides: Partial<AnalysisDetailView> = {}): AnalysisDetailView {
  return {
    id: "r-2",
    title: "Leitura mensal de setembro de 2026",
    summary: "A casa guardou 20,6% da renda, mas a reserva cobre só 46,7% da meta.",
    reading: ["Sobre o mês.", "Sobre a reserva."],
    banks: ["Sobre os bancos."],
    tradeOffs: ["Liquidez contra rendimento."],
    counterArgument: "Concentrar tem risco.",
    inputsUsed: [{ key: "ledger.income", label: "Renda em setembro", value: "R$ 12.400,00" }],
    meta: ["gerada em 01/10/2026, 08:12", "Claude Opus 5.5", "prompt analyst-v2"],
    ...overrides,
  };
}

function props(overrides: Partial<AnalysesPageProps> = {}): AnalysesPageProps {
  return {
    reading: reading(),
    isLatest: true,
    history: [
      {
        id: "r-2",
        title: "Leitura mensal de setembro de 2026",
        meta: "gerada em 01/10/2026, 08:12 · Claude Opus 5.5",
        href: "/analises?leitura=r-2",
        current: true,
      },
      {
        id: "r-1",
        title: "Leitura pedida sobre agosto de 2026",
        meta: "gerada em 12/09/2026, 10:00 · Claude Sonnet 5.5",
        href: "/analises?leitura=r-1",
        current: false,
      },
    ],
    limit: 3,
    remaining: 2,
    inProgress: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("AnalysesView", () => {
  it("heads the page with the reading's summary and names the reading in the overline", () => {
    render(<AnalysesView {...props()} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(reading().summary);
    expect(screen.getByText("Análises · Leitura mensal de setembro de 2026")).toBeDefined();
  });

  it("splits the month and reserve from the banks, next to the figures used", () => {
    render(<AnalysesView {...props()} />);

    expect(screen.getByRole("heading", { name: "O mês e a reserva" })).toBeDefined();
    expect(screen.getByText("Sobre a reserva.")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Bancos" })).toBeDefined();
    expect(screen.getByText("Sobre os bancos.")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Abrir a comparação de bancos" }).getAttribute("href"),
    ).toBe("/bancos");
    expect(screen.getByRole("heading", { name: "Números usados" })).toBeDefined();
    expect(screen.getByText("R$ 12.400,00")).toBeDefined();
    expect(screen.getByText("Concentrar tem risco.")).toBeDefined();
    expect(screen.getByText(/prompt analyst-v2/)).toBeDefined();
  });

  it("shows an analyst-v1 reading under one heading, titled by the reading", () => {
    render(<AnalysesView {...props({ reading: reading({ summary: null, banks: [] }) })} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Leitura mensal de setembro de 2026",
    );
    expect(screen.getByRole("heading", { name: "Leitura" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Bancos" })).toBeNull();
  });

  it("lists the readings, marking the one on screen", () => {
    render(<AnalysesView {...props()} />);

    const list = screen.getByRole("heading", { name: "Leituras" }).closest("section");
    if (!list) throw new Error("no readings section");
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/analises?leitura=r-2",
      "/analises?leitura=r-1",
    ]);
    expect(links[0]?.getAttribute("aria-current")).toBe("page");
    expect(links[1]?.getAttribute("aria-current")).toBeNull();
  });

  it("leaves the list out while there is only one reading", () => {
    const [only] = props().history;
    render(<AnalysesView {...props({ history: only ? [only] : [] })} />);

    expect(screen.queryByRole("heading", { name: "Leituras" })).toBeNull();
  });

  it("warns that an earlier reading may be out of date and links to the newest", () => {
    render(<AnalysesView {...props({ isLatest: false })} />);

    expect(screen.getByText(/Esta é uma leitura anterior/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Ver a mais recente" }).getAttribute("href")).toBe(
      "/analises",
    );
    expect(screen.queryByRole("button", { name: /Gerar nova leitura/ })).toBeNull();
  });

  it("offers the first reading when there is none yet", () => {
    render(<AnalysesView {...props({ reading: null, history: [] })} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Ainda não há leitura do analista",
    );
    expect(screen.getByRole("button", { name: /Gerar nova leitura/ })).toBeDefined();
  });

  it("says the analyst is off when it is", () => {
    render(<AnalysesOff />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "O analista está desligado no momento.",
    );
  });
});
