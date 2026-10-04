// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getPendingHouseholdDeletionsMock = vi.hoisted(() => vi.fn());
const getDeleteAccountSectionPropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/households")>()),
  requireHouseholdSession: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", householdId: "h-1", theme: "caderno" }),
  getPendingHouseholdDeletions: getPendingHouseholdDeletionsMock,
  PendingHouseholdDeletions: () => <p>Casa da praia</p>,
}));
vi.mock("@/modules/privacy", async (importOriginal) => ({
  t: (await importOriginal<typeof import("@/modules/privacy")>()).t,
  getDeleteAccountSectionProps: getDeleteAccountSectionPropsMock,
  DeleteAccountSection: () => <button type="button">Excluir meu cadastro</button>,
  ExportDataSection: () => <button type="button">Baixar meus dados</button>,
}));
vi.mock("@/modules/shell", () => ({
  getTourState: vi.fn().mockResolvedValue({ autoStart: true, seenVersions: {} }),
  TourPreferencesForm: () => <p>Mostrar tutoriais automaticamente</p>,
}));
vi.mock("@/modules/theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/theme")>();
  return {
    t: actual.t,
    resolveTheme: actual.resolveTheme,
    PreferencesSectionErrorBoundary: actual.PreferencesSectionErrorBoundary,
    ThemeSelectForm: () => <p>Tema</p>,
  };
});

import { resolveServerTree } from "@/lib/test/resolve-server-tree";

import PreferencesPage from "./page";

const originalConsoleError = console.error;

async function renderPage() {
  return render(
    await resolveServerTree(await PreferencesPage({ searchParams: Promise.resolve({}) })),
  );
}

beforeEach(() => {
  getPendingHouseholdDeletionsMock.mockReset();
  getDeleteAccountSectionPropsMock.mockReset();
  getPendingHouseholdDeletionsMock.mockResolvedValue([]);
  getDeleteAccountSectionPropsMock.mockResolvedValue({});
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("PreferencesPage", () => {
  it("renders every section when every read succeeds", async () => {
    getPendingHouseholdDeletionsMock.mockResolvedValue([{ id: "h-2" }]);

    await renderPage();

    expect(screen.getByText("Casa da praia")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Excluir meu cadastro" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).toBeNull();
  });

  it("keeps the rest of the page usable when the account deletion section fails", async () => {
    getDeleteAccountSectionPropsMock.mockRejectedValue(new Error("household-b"));

    const { container } = await renderPage();

    expect(screen.getByText(/Não deu para carregar esta parte agora/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(screen.getByText("Tema")).not.toBeNull();
    expect(screen.getByText("Mostrar tutoriais automaticamente")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Baixar meus dados" })).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });

  it("keeps the rest of the page usable when the pending household deletions fail", async () => {
    getPendingHouseholdDeletionsMock.mockRejectedValue(new Error("household-b"));

    await renderPage();

    expect(screen.getByText(/Não deu para carregar esta parte agora/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Baixar meus dados" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Excluir meu cadastro" })).not.toBeNull();
  });
});
