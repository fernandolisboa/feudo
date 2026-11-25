// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getGuidedCategorizationPropsMock = vi.hoisted(() => vi.fn());
const computeLinkSuggestionsMock = vi.hoisted(() => vi.fn());
const readAiCategorySuggestionsMock = vi.hoisted(() => vi.fn());
const getSuggestCategoriesButtonPropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: vi.fn() }));
vi.mock("@/modules/analysis", () => ({
  readAiCategorySuggestions: readAiCategorySuggestionsMock,
  getSuggestCategoriesButtonProps: getSuggestCategoriesButtonPropsMock,
  SuggestCategoriesButton: () => <p>Sugerir categorias com IA</p>,
}));
vi.mock("@/modules/ledger/link-suggestions", () => ({
  computeLinkSuggestions: computeLinkSuggestionsMock,
}));
vi.mock("@/modules/ledger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/ledger")>();
  return {
    ...actual,
    getGuidedCategorizationProps: getGuidedCategorizationPropsMock,
    GuidedCategorizationView: () => <h1>Categorias aqui</h1>,
  };
});

import { resolveServerTree } from "@/lib/test/resolve-server-tree";

import CategorizarPage from "./page";

const originalConsoleError = console.error;

beforeEach(() => {
  getGuidedCategorizationPropsMock.mockReset();
  computeLinkSuggestionsMock.mockReset();
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("CategorizarPage", () => {
  it("keeps Categorias working, shows no count on the Vínculos tab and that tab's own error, when the shared link-suggestion read fails", async () => {
    getGuidedCategorizationPropsMock.mockResolvedValue({});
    computeLinkSuggestionsMock.mockRejectedValue(new Error("household-b"));

    const { container } = render(
      await resolveServerTree(await CategorizarPage({ searchParams: Promise.resolve({}) })),
    );

    expect(screen.getByRole("heading", { name: "Categorias aqui" })).not.toBeNull();
    const vinculosTab = screen.getByRole("tab", { name: "Vínculos" });
    expect(vinculosTab).not.toBeNull();
    expect(screen.getByText(/Não deu para carregar as sugestões de vínculo agora/)).not.toBeNull();

    fireEvent.click(vinculosTab);

    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });

  it("renders both tabs with the plain Vínculos label when nothing is suggested", async () => {
    getGuidedCategorizationPropsMock.mockResolvedValue({});
    computeLinkSuggestionsMock.mockResolvedValue({ rowById: new Map(), suggestions: [] });

    render(await resolveServerTree(await CategorizarPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("heading", { name: "Categorias aqui" })).not.toBeNull();
    expect(screen.getByRole("tab", { name: "Vínculos" })).not.toBeNull();
  });
});
