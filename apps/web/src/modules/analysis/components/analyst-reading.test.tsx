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
      paragraphs: ["Primeiro parágrafo.", "Segundo parágrafo."],
      tradeOffs: ["Liquidez contra rendimento."],
      counterArgument: "Concentrar tem risco.",
      inputsUsed: [{ key: "ledger.income", label: "Renda em setembro", value: "R$ 12.400,00" }],
      meta: ["gerada em 01/10/2026, 08:12", "Claude Opus 5.5", "prompt analyst-v1"],
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
  it("shows the reading, its trade-offs, counter-argument, figures used and provenance", () => {
    render(<AnalystReading {...props()} />);

    expect(screen.getByRole("heading", { name: "Leitura do analista" })).toBeDefined();
    expect(screen.getByText("Segundo parágrafo.")).toBeDefined();
    expect(screen.getByText("Liquidez contra rendimento.")).toBeDefined();
    expect(screen.getByText("Concentrar tem risco.")).toBeDefined();
    expect(screen.getByText("Renda em setembro")).toBeDefined();
    expect(screen.getByText("R$ 12.400,00")).toBeDefined();
    expect(
      screen.getByText("gerada em 01/10/2026, 08:12 · Claude Opus 5.5 · prompt analyst-v1"),
    ).toBeDefined();
    expect(screen.getByText(/Não é recomendação de investimento/)).toBeDefined();
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
