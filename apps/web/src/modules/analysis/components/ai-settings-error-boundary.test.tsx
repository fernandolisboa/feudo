// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AiSettingsErrorBoundary } from "./ai-settings-error-boundary";

function Explodes(): never {
  throw new Error("boom");
}

afterEach(() => {
  cleanup();
});

describe("AiSettingsErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <AiSettingsErrorBoundary>
        <p>Chave e modelos do analista</p>
      </AiSettingsErrorBoundary>,
    );

    expect(screen.getByText("Chave e modelos do analista")).not.toBeNull();
  });

  it("falls back to nothing, not an error message, when the section fails to render", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <AiSettingsErrorBoundary>
          <Explodes />
        </AiSettingsErrorBoundary>,
      );

      expect(container.textContent).toBe("");
    } finally {
      console.error = originalConsoleError;
    }
  });
});
