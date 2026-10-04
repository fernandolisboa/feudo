// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const wizardMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/sync", async (importOriginal) => ({
  ConnectBankErrorBoundary: (await importOriginal<typeof import("@/modules/sync")>())
    .ConnectBankErrorBoundary,
  ConnectBankWizard: wizardMock,
}));

import ConnectBankPage from "./page";

const originalConsoleError = console.error;

beforeEach(() => {
  wizardMock.mockReset();
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("ConnectBankPage", () => {
  it("renders the wizard", async () => {
    wizardMock.mockReturnValue(<h1>Antes de conectar</h1>);

    render(await ConnectBankPage());

    expect(screen.getByRole("heading", { name: "Antes de conectar" })).not.toBeNull();
  });

  it("turns a wizard that fails to render into an error notice with a retry", async () => {
    wizardMock.mockImplementation(() => {
      throw new Error("household-b");
    });

    const { container } = render(await ConnectBankPage());

    expect(screen.getByText(/Não deu para abrir os passos de conexão agora/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });
});
