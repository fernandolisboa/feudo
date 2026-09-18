// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { t } from "../strings";

const signOutActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ signOutAction: signOutActionMock }));

import { SignOutMenuItem } from "./sign-out-menu-item";

afterEach(() => {
  cleanup();
  signOutActionMock.mockReset();
});

async function renderOpenMenu() {
  render(
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>,
  );

  fireEvent.click(screen.getByText("Menu"));
  await screen.findByText(t.userMenu.signOut);
}

describe("SignOutMenuItem", () => {
  it("shows the failure alert and keeps the menu open when signOutAction resolves an error", async () => {
    signOutActionMock.mockResolvedValue({ status: "error", message: t.errors.signOutFailed });
    await renderOpenMenu();

    fireEvent.click(screen.getByText(t.userMenu.signOut));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(t.errors.signOutFailed);
    });
  });

  it("propagates the Next redirect sentinel instead of swallowing it as a failure", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;push;/entrar;307;",
    });
    signOutActionMock.mockRejectedValue(redirectError);

    const reported: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener("error", onError);
    await renderOpenMenu();

    fireEvent.click(screen.getByText(t.userMenu.signOut));

    await waitFor(() => {
      expect(reported).toContain(redirectError);
    });
    expect(screen.queryByRole("alert")).toBeNull();

    window.removeEventListener("error", onError);
  });
});
