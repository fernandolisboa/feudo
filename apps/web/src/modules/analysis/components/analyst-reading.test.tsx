// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ requestAnalysisAction: vi.fn() }));

import type { AnalystReadingProps } from "../page-props";
import { AnalystReading } from "./analyst-reading";

function props(overrides: Partial<AnalystReadingProps> = {}): AnalystReadingProps {
  return {
    reading: {
      title: "Leitura mensal de setembro de 2026",
      summary: "Setembro fechou no azul e a reserva segue no caminho.",
      counterArgument: "Concentrar tem risco.",
      meta: ["gerada em 01/10/2026, 08:12", "Opus 5.5"],
      href: "/analises",
    },
    limit: 3,
    remaining: 2,
    inProgress: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("AnalystReading", () => {
  it("shows the summary, the counter-argument and provenance, and links to the full reading", () => {
    render(<AnalystReading {...props()} />);

    expect(screen.getByRole("heading", { name: "Leitura do analista" })).toBeDefined();
    expect(screen.getByText("Leitura mensal de setembro de 2026")).toBeDefined();
    expect(screen.getByText("Setembro fechou no azul e a reserva segue no caminho.")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Contra-argumento" })).toBeDefined();
    expect(screen.getByText("Concentrar tem risco.")).toBeDefined();
    expect(screen.getByText("gerada em 01/10/2026, 08:12 · Opus 5.5")).toBeDefined();
    expect(screen.getByText(/Não é recomendação de investimento/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Ver a leitura completa" }).getAttribute("href")).toBe(
      "/analises",
    );
  });

  it("leaves the trade-offs and the figures used to Análises", () => {
    render(<AnalystReading {...props()} />);

    expect(screen.queryByText("Prós e contras")).toBeNull();
    expect(screen.queryByText(/Números usados/)).toBeNull();
  });

  it("invites the first reading when there is none", () => {
    render(<AnalystReading {...props({ reading: null })} />);

    expect(screen.getByText(/Ainda não há leitura do analista/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Gerar nova leitura" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("shows how many readings are left today", () => {
    render(<AnalystReading {...props()} />);

    expect(screen.getByText("Restam 2 de 3 leituras hoje")).toBeDefined();
  });

  it("disables the button once the quota is spent or a reading is running", () => {
    render(<AnalystReading {...props({ remaining: 0 })} />);
    expect(screen.getByText(/usou as 3 leituras de hoje/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Gerar nova leitura" })).toHaveProperty(
      "disabled",
      true,
    );
    cleanup();

    render(<AnalystReading {...props({ inProgress: true })} />);
    expect(screen.getByText(/está sendo gerada/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Gerar nova leitura" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
