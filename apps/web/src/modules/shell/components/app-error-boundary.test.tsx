// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppErrorBoundary } from "./app-error-boundary";

let failing = true;

function Page() {
  if (failing) {
    throw new Error("select * from bank_transaction where household_id = 'household-b'");
  }
  return <h1>Transações</h1>;
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

describe("AppErrorBoundary", () => {
  it("renders the page when nothing throws", () => {
    failing = false;
    render(
      <AppErrorBoundary>
        <Page />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Transações" })).not.toBeNull();
  });

  it("replaces a failed page with the pt-BR error state and never shows the error itself", () => {
    const { container } = render(
      <AppErrorBoundary>
        <Page />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Não deu para abrir esta página" })).not.toBeNull();
    expect(screen.getByText(/Algo falhou do nosso lado/)).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });

  it("recovers on Tentar de novo once the cause is gone", async () => {
    render(
      <AppErrorBoundary>
        <Page />
      </AppErrorBoundary>,
    );

    failing = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Transações" })).not.toBeNull();
  });
});
