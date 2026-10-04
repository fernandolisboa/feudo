// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/modules/auth", () => ({ SignOutMenuItem: () => null }));
vi.mock("../actions", () => ({ recordTourOutcomeAction: vi.fn() }));
vi.mock("./offline-notice", () => ({ OfflineNotice: () => null }));

import { TOURS } from "../tours";
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

// overview.accounts wraps the accounts section on the overview page itself
// (app/(app)/page.tsx), which renders a slice the shell does not own; that
// page's own test checks it.
const PAGE_TARGETS = new Set(["overview.accounts"]);

describe("guided tour targets", () => {
  it.each(["sidebar", "topnav"] as const)(
    "the %s shell renders every shell target of the overview tour",
    (shell) => {
      const { container } = render(
        <AppShell
          shell={shell}
          sidebarCollapsed={false}
          userName="Ada"
          userEmail="ada@example.com"
          householdSwitcher={null}
          tourState={{ autoStart: false, seenVersions: {} }}
          offline={OFFLINE}
        >
          {null}
        </AppShell>,
      );

      for (const step of TOURS.overview.steps.filter((s) => !PAGE_TARGETS.has(s.target))) {
        expect(container.querySelector(`[data-tour="${step.target}"]`), step.target).not.toBeNull();
      }
    },
  );

  it("marks the bottom tabs as the overview tour's nav target under 768px", () => {
    const { container } = render(
      <AppShell
        shell="sidebar"
        sidebarCollapsed={false}
        userName="Ada"
        userEmail="ada@example.com"
        householdSwitcher={null}
        tourState={{ autoStart: false, seenVersions: {} }}
        offline={OFFLINE}
      >
        {null}
      </AppShell>,
    );

    const tabBar = container.querySelector(".app-shell-tabbar");
    expect(tabBar?.getAttribute("data-tour")).toBe("overview.nav");
    expect(tabBar?.querySelector('[data-tour="overview.household"]')).not.toBeNull();
  });
});
