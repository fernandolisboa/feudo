// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RecentAccessErrorBoundary } from "./recent-access-error-boundary";

function Explodes(): never {
  throw new Error("boom");
}

afterEach(() => {
  cleanup();
});

describe("RecentAccessErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <RecentAccessErrorBoundary>
        <p>Seus acessos recentes</p>
      </RecentAccessErrorBoundary>,
    );

    expect(screen.getByText("Seus acessos recentes")).not.toBeNull();
  });

  it("falls back to nothing, not an error message, when the section fails to render", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <RecentAccessErrorBoundary>
          <Explodes />
        </RecentAccessErrorBoundary>,
      );

      expect(container.textContent).toBe("");
    } finally {
      console.error = originalConsoleError;
    }
  });
});
