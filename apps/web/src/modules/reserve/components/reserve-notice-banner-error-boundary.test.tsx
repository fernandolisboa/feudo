// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReserveNoticeBannerErrorBoundary } from "./reserve-notice-banner-error-boundary";

function Explodes(): never {
  throw new Error("boom");
}

afterEach(() => {
  cleanup();
});

describe("ReserveNoticeBannerErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ReserveNoticeBannerErrorBoundary>
        <p>Aviso da reserva</p>
      </ReserveNoticeBannerErrorBoundary>,
    );

    expect(screen.getByText("Aviso da reserva")).not.toBeNull();
  });

  it("falls back to nothing, not an error message, when the banner fails to render", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <ReserveNoticeBannerErrorBoundary>
          <Explodes />
        </ReserveNoticeBannerErrorBoundary>,
      );

      expect(container.textContent).toBe("");
    } finally {
      console.error = originalConsoleError;
    }
  });
});
