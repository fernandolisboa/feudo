// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnalystBanksNote } from "./analyst-banks-note";

afterEach(() => {
  cleanup();
});

describe("AnalystBanksNote", () => {
  it("shows the reading's bank paragraph, where it came from and the way to the full reading", () => {
    render(
      <AnalystBanksNote
        paragraphs={["Pelas notas do Feudo, não há motivo claro para trocar de banco agora."]}
        source="Leitura mensal de setembro de 2026 · gerada em 01/10/2026, 08:12"
        href="/analises"
      />,
    );

    expect(screen.getByRole("heading", { name: "O que o analista diz" })).toBeDefined();
    expect(screen.getByText(/não há motivo claro/)).toBeDefined();
    expect(screen.getByText(/Leitura mensal de setembro de 2026 · gerada em/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Ver a leitura completa" }).getAttribute("href")).toBe(
      "/analises",
    );
  });
});
