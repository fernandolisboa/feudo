// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  cancelAccountDeletionAction: vi.fn(),
  signOutFromPendingDeletionAction: vi.fn(),
}));

vi.mock("../actions", () => actions);

import { AccountDeletionPending } from "./account-deletion-pending";

afterEach(() => {
  cleanup();
  actions.cancelAccountDeletionAction.mockReset();
  actions.signOutFromPendingDeletionAction.mockReset();
  Reflect.deleteProperty(window.navigator, "onLine");
});

describe("AccountDeletionPending", () => {
  it("offline, with no app shell around it, still says the cancellation did not happen", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => false });
    render(<AccountDeletionPending signedIn />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar exclusão" }));

    expect(screen.getByText("Não foi possível cancelar a exclusão. Tente novamente.")).toBeTruthy();
    expect(actions.cancelAccountDeletionAction).not.toHaveBeenCalled();
  });

  it("offline, says signing out did not happen, not that the cancellation failed", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => false });
    render(<AccountDeletionPending signedIn />);

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(screen.getByText("Não foi possível sair. Tente novamente.")).toBeTruthy();
    expect(actions.signOutFromPendingDeletionAction).not.toHaveBeenCalled();
  });
});
