// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("@/modules/auth", () => ({ SignOutMenuItem: () => null }));

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
});
