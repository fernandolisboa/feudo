// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() => vi.fn());
const getHouseholdSwitcherPropsMock = vi.hoisted(() => vi.fn());
const readSidebarCollapsedMock = vi.hoisted(() => vi.fn());
const getTourStateMock = vi.hoisted(() => vi.fn());
const getOfflineNoticePropsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  getHouseholdSwitcherProps: getHouseholdSwitcherPropsMock,
  HouseholdSwitcherSelect: () => <div data-testid="household-switcher" />,
}));
vi.mock("@/modules/shell", async (importOriginal) => ({
  AppErrorBoundary: (await importOriginal<typeof import("@/modules/shell")>()).AppErrorBoundary,
  readSidebarCollapsed: readSidebarCollapsedMock,
  getTourState: getTourStateMock,
  getOfflineNoticeProps: getOfflineNoticePropsMock,
  AppShell: ({
    householdSwitcher,
    children,
  }: {
    householdSwitcher: ReactNode;
    children: ReactNode;
  }) => (
    <>
      <div data-testid="nav-slot">{householdSwitcher}</div>
      <div data-testid="mobile-header-slot">{householdSwitcher}</div>
      <main data-testid="shell-content">{children}</main>
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
  getTourStateMock.mockReset();
  getTourStateMock.mockResolvedValue({ autoStart: true, seenVersions: {} });
  getOfflineNoticePropsMock.mockReset();
  getOfflineNoticePropsMock.mockResolvedValue({
    renderedAt: "2026-10-04T13:00:00.000Z",
    timeZone: "America/Sao_Paulo",
    scope: "user-1:household-a",
    userId: "user-1",
  });
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

  it("renders a page that throws as the pt-BR error state inside the shell, keeping the navigation", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue(null);
    function FailingPage(): never {
      throw new Error("boom");
    }
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const element = await AppLayout({ children: <FailingPage /> });
      render(element);

      const content = screen.getByTestId("shell-content");
      expect(
        within(content).getByRole("heading", { name: "Não deu para abrir esta página" }),
      ).not.toBeNull();
      expect(within(content).getByRole("button", { name: "Tentar de novo" })).not.toBeNull();
      expect(screen.getByTestId("nav-slot")).not.toBeNull();
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("clears a failed page when the active household changes, even though the URL stays the same", async () => {
    getHouseholdSwitcherPropsMock.mockResolvedValue(null);
    let failing = true;
    function Page() {
      if (failing) {
        throw new Error("boom");
      }
      return <h1>Visão geral</h1>;
    }
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const { rerender } = render(await AppLayout({ children: <Page /> }));
      expect(
        screen.getByRole("heading", { name: "Não deu para abrir esta página" }),
      ).not.toBeNull();

      failing = false;
      requireHouseholdSessionMock.mockResolvedValue({
        userId: "user-1",
        name: "Ada",
        email: "ada@example.com",
        householdId: "household-b",
        theme: "caderno",
      });
      rerender(await AppLayout({ children: <Page /> }));

      expect(screen.getByRole("heading", { name: "Visão geral" })).not.toBeNull();
    } finally {
      console.error = originalConsoleError;
    }
  });
});
