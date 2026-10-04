// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getTransactionsPagePropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/ledger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/ledger")>();
  return {
    TransactionsErrorBoundary: actual.TransactionsErrorBoundary,
    TransactionsSkeleton: actual.TransactionsSkeleton,
    getTransactionsPageProps: getTransactionsPagePropsMock,
    TransactionsView: () => <h1>Transações de outubro</h1>,
  };
});

import { resolveServerTree } from "@/lib/test/resolve-server-tree";

import TransactionsPage from "./page";

const originalConsoleError = console.error;

beforeEach(() => {
  getTransactionsPagePropsMock.mockReset();
  console.error = () => {};
});

afterEach(() => {
  console.error = originalConsoleError;
  cleanup();
});

describe("TransactionsPage", () => {
  it("renders the transactions once they load", async () => {
    getTransactionsPagePropsMock.mockResolvedValue({});

    render(await resolveServerTree(await TransactionsPage({ searchParams: Promise.resolve({}) })));

    expect(screen.getByRole("heading", { name: "Transações de outubro" })).not.toBeNull();
  });

  it("turns a failed read into the transactions' error notice with a retry, not a blank page", async () => {
    getTransactionsPagePropsMock.mockRejectedValue(new Error("household-b"));

    const { container } = render(
      await resolveServerTree(await TransactionsPage({ searchParams: Promise.resolve({}) })),
    );

    expect(screen.getByText(/Não deu para carregar as transações agora/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
    expect(container.textContent).not.toContain("household-b");
  });
});
