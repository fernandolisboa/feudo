// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

const pathnameMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/auth", () => ({ SignOutMenuItem: () => null }));
vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("../actions", () => ({ recordTourOutcomeAction: vi.fn() }));

import { TourProvider } from "./tour-provider";
import { UserMenu } from "./user-menu";

afterEach(() => {
  cleanup();
});

describe("UserMenu", () => {
  it("offers the guide next to the preferences", async () => {
    render(<UserMenu name="Ada" email="ada@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Ada" }));

    const item = await screen.findByRole("menuitem", { name: t.userMenu.guide });
    expect(item.getAttribute("href")).toBe("/como-usar");
  });

  it.each([
    { pathname: "/", offered: true },
    { pathname: "/conectar-banco", offered: false },
  ])("offers 'Ver tour desta tela' only on a screen with a tour ($pathname)", async (row) => {
    pathnameMock.mockReturnValue(row.pathname);
    render(
      <TourProvider initialState={{ autoStart: false, seenVersions: {} }}>
        <UserMenu name="Ada" email="ada@example.com" />
      </TourProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ada" }));

    await screen.findByRole("menuitem", { name: t.userMenu.guide });
    expect(screen.queryByRole("menuitem", { name: t.userMenu.tour }) !== null).toBe(row.offered);
  });
});
