// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: vi.fn().mockResolvedValue({ userId: "user-1", householdId: "h-1" }),
}));
vi.mock("@/modules/ledger", () => ({
  getOverviewPageProps: vi.fn(() => new Promise(() => undefined)),
  OverviewErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  OverviewSkeleton: () => null,
  OverviewView: () => null,
}));
vi.mock("@/modules/reserve", () => ({
  getReserveNoticeBannerProps: vi.fn(() => new Promise(() => undefined)),
  ReserveNoticeBanner: () => null,
  ReserveNoticeBannerErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("@/modules/sync", () => ({
  AccountsSection: () => null,
  getAccountsSectionProps: vi.fn(() => new Promise(() => undefined)),
}));

import { TOURS } from "@/modules/shell";

import Home from "./page";

afterEach(() => {
  cleanup();
});

describe("Home", () => {
  it("wraps the accounts section in the overview tour's accounts target", async () => {
    const element = await Home({ searchParams: Promise.resolve({}) });
    const { container } = render(element);

    const accountsStep = TOURS.overview.steps.find((step) => step.target === "overview.accounts");
    expect(accountsStep).toBeDefined();
    expect(container.querySelector('[data-tour="overview.accounts"]')).not.toBeNull();
    expect(TOURS.overview.readyTarget).toBe("overview.accounts");
  });
});
