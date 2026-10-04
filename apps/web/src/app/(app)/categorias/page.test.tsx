// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCategoriesPagePropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/ledger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/ledger")>();
  return {
    CategoriesErrorBoundary: actual.CategoriesErrorBoundary,
    CategoriesSkeleton: actual.CategoriesSkeleton,
    getCategoriesPageProps: getCategoriesPagePropsMock,
    CategoriesView: () => <h1>Categorias e regras</h1>,
  };
});

import { resolveServerTree } from "@/lib/test/resolve-server-tree";

import CategoriesPage from "./page";

const originalConsoleError = console.error;

beforeEach(() => {
  getCategoriesPagePropsMock.mockReset();
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("CategoriesPage", () => {
  it("renders the categories once they load", async () => {
    getCategoriesPagePropsMock.mockResolvedValue({});

    render(await resolveServerTree(await CategoriesPage()));

    expect(screen.getByRole("heading", { name: "Categorias e regras" })).not.toBeNull();
  });

  it("turns a failed read into the categories' error notice with a retry, not a blank page", async () => {
    getCategoriesPagePropsMock.mockRejectedValue(new Error("household-b"));

    const { container } = render(await resolveServerTree(await CategoriesPage()));

    expect(screen.getByText(/Não deu para carregar as categorias e regras agora/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });
});
