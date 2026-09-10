// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("renders the same household switcher element in both the nav and the mobile header slots", () => {
    const householdSwitcher = <div data-testid="household-switcher" />;

    render(
      <AppShell
        shell="sidebar"
        sidebarCollapsed={false}
        userName="Ada"
        userEmail="ada@example.com"
        householdSwitcher={householdSwitcher}
      >
        {null}
      </AppShell>,
    );

    expect(screen.getAllByTestId("household-switcher")).toHaveLength(2);
  });

  it("renders nothing for the switcher slot when there is no household switcher to show", () => {
    render(
      <AppShell
        shell="sidebar"
        sidebarCollapsed={false}
        userName="Ada"
        userEmail="ada@example.com"
        householdSwitcher={null}
      >
        {null}
      </AppShell>,
    );

    expect(screen.queryByTestId("household-switcher")).toBeNull();
  });
});
