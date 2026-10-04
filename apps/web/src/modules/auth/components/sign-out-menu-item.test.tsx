// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { t } from "../strings";

const signOutActionMock = vi.hoisted(() => vi.fn());
const callOrder = vi.hoisted(() => [] as string[]);
const clearOfflineCopiesMock = vi.hoisted(() =>
  vi.fn(() => {
    callOrder.push("clear");
    return Promise.resolve();
  }),
);

vi.mock("../actions", () => ({ signOutAction: signOutActionMock }));
vi.mock("@/platform/pwa/offline-copies", () => ({ clearOfflineCopies: clearOfflineCopiesMock }));

import { SignOutMenuItem } from "./sign-out-menu-item";

afterEach(() => {
  cleanup();
  signOutActionMock.mockReset();
  clearOfflineCopiesMock.mockClear();
  callOrder.length = 0;
  Reflect.deleteProperty(window.navigator, "onLine");
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
  it("clears this browser's offline copies before signing out (ADR-0007)", async () => {
    signOutActionMock.mockImplementation(() => {
      callOrder.push("signOut");
      return Promise.resolve({ status: "error", message: t.errors.signOutFailed });
    });
    await renderOpenMenu();

    fireEvent.click(screen.getByText(t.userMenu.signOut));

    await waitFor(() => {
      expect(callOrder).toEqual(["clear", "signOut"]);
    });
  });

  it("offline, still clears the copies but never calls the server", async () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => false });
    await renderOpenMenu();

    fireEvent.click(screen.getByText(t.userMenu.signOut));

    expect(clearOfflineCopiesMock).toHaveBeenCalledOnce();
    expect(signOutActionMock).not.toHaveBeenCalled();
  });

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
