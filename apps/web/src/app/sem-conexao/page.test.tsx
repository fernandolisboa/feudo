// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import OfflineFallbackPage from "./page";

afterEach(() => {
  cleanup();
});

describe("OfflineFallbackPage", () => {
  it("explains in pt-BR why there is nothing to show and offers to try again, with no data", () => {
    const { container } = render(<OfflineFallbackPage />);

    expect(screen.getByRole("heading", { name: "Sem conexão" })).not.toBeNull();
    expect(container.textContent).toContain(
      "Sem internet, o Feudo só mostra as telas que você abriu neste aparelho nas últimas 24 horas, e só até você sair.",
    );
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
  });
});
