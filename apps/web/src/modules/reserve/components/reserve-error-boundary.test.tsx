// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReserveErrorBoundary } from "./reserve-error-boundary";

function Explodes(): never {
  throw new Error("household-b");
}

afterEach(() => {
  cleanup();
});

describe("ReserveErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ReserveErrorBoundary>
        <p>Conteúdo</p>
      </ReserveErrorBoundary>,
    );

    expect(screen.getByText("Conteúdo")).not.toBeNull();
  });

  it("shows this screen's error copy and a retry, never the thrown error", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <ReserveErrorBoundary>
          <Explodes />
        </ReserveErrorBoundary>,
      );

      expect(screen.getByText(/Não deu para carregar a reserva agora/)).not.toBeNull();
      expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
      expect(container.textContent).not.toContain("household-b");
    } finally {
      console.error = originalConsoleError;
    }
  });
});
