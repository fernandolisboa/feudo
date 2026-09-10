// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { t } from "../strings";

const signOutActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ signOutAction: signOutActionMock }));

import { SignOutMenuItem } from "./sign-out-menu-item";

afterEach(() => {
  cleanup();
  signOutActionMock.mockReset();
});

function renderOpenMenu() {
  return render(
    <DropdownMenu open modal={false}>
      <DropdownMenuContent>
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("SignOutMenuItem", () => {
  it("shows the failure alert and keeps the menu open when signOutAction resolves an error", async () => {
    signOutActionMock.mockResolvedValue({ status: "error", message: t.errors.signOutFailed });
    renderOpenMenu();

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
    renderOpenMenu();

    fireEvent.click(screen.getByText(t.userMenu.signOut));

    await waitFor(() => {
      expect(reported).toContain(redirectError);
    });
    expect(screen.queryByRole("alert")).toBeNull();

    window.removeEventListener("error", onError);
  });
});
