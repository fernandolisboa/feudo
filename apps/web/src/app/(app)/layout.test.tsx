// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() => vi.fn());
const getHouseholdSwitcherPropsMock = vi.hoisted(() => vi.fn());
const readSidebarCollapsedMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  getHouseholdSwitcherProps: getHouseholdSwitcherPropsMock,
  HouseholdSwitcherSelect: () => <div data-testid="household-switcher" />,
}));
vi.mock("@/modules/shell", () => ({
  readSidebarCollapsed: readSidebarCollapsedMock,
  AppShell: ({ householdSwitcher }: { householdSwitcher: ReactNode }) => (
    <>
      <div data-testid="nav-slot">{householdSwitcher}</div>
      <div data-testid="mobile-header-slot">{householdSwitcher}</div>
    </>
  ),
}));

import AppLayout from "./layout";

beforeEach(() => {
  requireHouseholdSessionMock.mockReset();
  getHouseholdSwitcherPropsMock.mockReset();
  readSidebarCollapsedMock.mockReset();
  requireHouseholdSessionMock.mockResolvedValue({
    userId: "user-1",
    name: "Ada",
    email: "ada@example.com",
    householdId: "household-a",
    theme: "caderno",
  });
  readSidebarCollapsedMock.mockResolvedValue(false);
});

afterEach(() => {
  cleanup();
});

describe("AppLayout", () => {
  it("fetches the household switcher data once and hands it to AppShell as a single ReactNode reused in both slots", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue({
      households: [{ id: "household-a", name: "Casa" }],
      activeHouseholdId: "household-a",
    });

    const element = await AppLayout({ children: null });
    render(element);

    expect(getHouseholdSwitcherPropsMock).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId("household-switcher")).toHaveLength(2);
  });

  it("passes null for the switcher slot when the user has no other households", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue(null);

    const element = await AppLayout({ children: null });
    render(element);

    expect(getHouseholdSwitcherPropsMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("household-switcher")).toBeNull();
  });
});
