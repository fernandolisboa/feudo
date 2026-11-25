// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionLinksErrorBoundary } from "./transaction-links-error-boundary";

function Explodes(): never {
  throw new Error("household-b");
}

afterEach(() => {
  cleanup();
});

describe("TransactionLinksErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <TransactionLinksErrorBoundary>
        <p>Conteúdo</p>
      </TransactionLinksErrorBoundary>,
    );

    expect(screen.getByText("Conteúdo")).not.toBeNull();
  });

  it("shows this screen's error copy and a retry, never the thrown error", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <TransactionLinksErrorBoundary>
          <Explodes />
        </TransactionLinksErrorBoundary>,
      );

      expect(
        screen.getByText(/Não deu para carregar as sugestões de vínculo agora/),
      ).not.toBeNull();
      expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
      expect(container.textContent).not.toContain("household-b");
    } finally {
      console.error = originalConsoleError;
    }
  });
});
