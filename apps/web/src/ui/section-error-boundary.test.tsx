// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SectionErrorBoundary } from "./section-error-boundary";

let failing = true;

function Section() {
  if (failing) {
    throw new Error("relation household_b.accounts leaked");
  }
  return <p>Gastos do mês</p>;
}

function renderWithRouter(refresh: () => void) {
  const router = { refresh } as unknown as AppRouterInstance;
  return render(
    <AppRouterContext.Provider value={router}>
      <SectionErrorBoundary message="Não deu para carregar." retryLabel="Tentar de novo">
        <Section />
      </SectionErrorBoundary>
    </AppRouterContext.Provider>,
  );
}

const originalConsoleError = console.error;

beforeEach(() => {
  failing = true;
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("SectionErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    failing = false;
    renderWithRouter(vi.fn());

    expect(screen.getByText("Gastos do mês")).not.toBeNull();
  });

  it("shows the section's own copy and a retry action, never the thrown error", () => {
    const { container } = renderWithRouter(vi.fn());

    expect(screen.getByText("Não deu para carregar.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(container.textContent).not.toContain("household_b");
  });

  it("refreshes the server data and renders the section again once the cause is gone", async () => {
    const refresh = vi.fn();
    renderWithRouter(refresh);

    failing = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
      await Promise.resolve();
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Gastos do mês")).not.toBeNull();
    expect(screen.queryByText("Não deu para carregar.")).toBeNull();
  });

  it("wraps the notice in the given class so it keeps the section's spacing", () => {
    const { container } = render(
      <SectionErrorBoundary message="Falhou." retryLabel="Tentar de novo" className="mt-8">
        <Section />
      </SectionErrorBoundary>,
    );

    expect(container.firstElementChild?.className).toBe("mt-8");
  });
});
