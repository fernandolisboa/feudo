// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getHouseholdSwitcherPropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  getHouseholdSwitcherProps: getHouseholdSwitcherPropsMock,
  HouseholdSwitcherSelect: () => <div data-testid="household-switcher" />,
}));
vi.mock("./sidebar-nav", () => ({
  SidebarNav: ({ householdSwitcher }: { householdSwitcher: ReactNode }) => (
    <div data-testid="sidebar-slot">{householdSwitcher}</div>
  ),
}));
vi.mock("./top-nav", () => ({ TopNav: () => null }));
vi.mock("./mobile-header", () => ({
  MobileHeader: ({ householdSwitcher }: { householdSwitcher: ReactNode }) => (
    <div data-testid="mobile-header-slot">{householdSwitcher}</div>
  ),
}));
vi.mock("./mobile-tab-bar", () => ({ MobileTabBar: () => null }));
vi.mock("./user-menu", () => ({ UserMenu: () => null }));

import { AppShell } from "./app-shell";

beforeEach(() => {
  getHouseholdSwitcherPropsMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("fetches the household switcher data once even though it renders in the nav and the mobile header", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue({
      households: [{ id: "household-a", name: "Casa" }],
      activeHouseholdId: "household-a",
    });

    const element = await AppShell({
      shell: "sidebar",
      sidebarCollapsed: false,
      userName: "Ada",
      userEmail: "ada@example.com",
      householdId: "household-a",
      children: null,
    });

    render(element);

    expect(getHouseholdSwitcherPropsMock).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId("household-switcher")).toHaveLength(2);
  });

  it("renders nothing for the switcher slot when the user has no other households", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue(null);

    const element = await AppShell({
      shell: "sidebar",
      sidebarCollapsed: false,
      userName: "Ada",
      userEmail: "ada@example.com",
      householdId: "household-a",
      children: null,
    });

    render(element);

    expect(getHouseholdSwitcherPropsMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("household-switcher")).toBeNull();
  });
});
