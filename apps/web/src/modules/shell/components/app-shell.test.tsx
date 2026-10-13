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
vi.mock("./offline-notice", () => ({ OfflineNotice: () => null }));
vi.mock("./tour-provider", () => ({
  TourProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { AppShell } from "./app-shell";

const OFFLINE = {
  renderedAt: "2026-10-04T13:00:00.000Z",
  timeZone: "America/Sao_Paulo",
  scope: "user-1:household-a",
  userId: "user-1",
};

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
        tourState={{ autoStart: true, seenVersions: {} }}
        offline={OFFLINE}
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
        tourState={{ autoStart: true, seenVersions: {} }}
        offline={OFFLINE}
      >
        {null}
      </AppShell>,
    );

    expect(screen.queryByTestId("household-switcher")).toBeNull();
  });

  it("renders the notice slot inside the content area, ahead of the page", () => {
    render(
      <AppShell
        shell="sidebar"
        sidebarCollapsed={false}
        userName="Ada"
        userEmail="ada@example.com"
        householdSwitcher={null}
        tourState={{ autoStart: true, seenVersions: {} }}
        offline={OFFLINE}
        notice={<p data-testid="notice">Aviso</p>}
      >
        <p data-testid="page">Página</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    const notice = screen.getByTestId("notice");
    expect(main.contains(notice)).toBe(true);
    expect(
      notice.compareDocumentPosition(screen.getByTestId("page")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
