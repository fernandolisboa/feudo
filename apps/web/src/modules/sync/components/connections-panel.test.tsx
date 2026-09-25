// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";

vi.mock("../actions", () => ({
  addConnectionAction: vi.fn(),
  deleteConnectionAction: vi.fn(),
  moveAccountAction: vi.fn(),
  removeCredentialsAction: vi.fn(),
  renameConnectionAction: vi.fn(),
}));

import { ConnectionsPanel } from "./connections-panel";
import type { ConnectionSummary, OwnedAccount } from "../repository";

afterEach(() => {
  cleanup();
});

const connection: ConnectionSummary = {
  id: "conn-1",
  provider: "pluggy",
  providerItemId: "item-1",
  institutionName: "Itaú",
  lastSyncedAt: null,
  lastSyncError: null,
  accountsCount: 2,
  createdAt: new Date("2026-09-01T00:00:00Z"),
};

const assigned: OwnedAccount = {
  id: "acc-assigned",
  connectionId: "conn-1",
  name: "Conta corrente",
  type: "checking",
  householdId: "house-a",
  householdName: "Casa A",
};

const unassigned: OwnedAccount = {
  id: "acc-unassigned",
  connectionId: "conn-1",
  name: "Poupança",
  type: "savings",
  householdId: null,
  householdName: null,
};

function renderPanel(ownHouseholds: { id: string; name: string }[]) {
  render(
    <ConnectionsPanel
      connections={[connection]}
      ownedAccounts={[assigned, unassigned]}
      ownHouseholds={ownHouseholds}
      hasCredentials
      credentialsSavedAt={new Date("2026-09-01T00:00:00Z")}
      timeZone="America/Sao_Paulo"
    />,
  );
}

describe("ConnectionsPanel accounts", () => {
  it("shows each account's household, flags an unassigned one and offers only other households", async () => {
    renderPanel([
      { id: "house-a", name: "Casa A" },
      { id: "house-b", name: "Casa B" },
    ]);

    expect(screen.getByText("Em Casa A")).toBeDefined();
    expect(screen.getByText(t.connections.accountUnassigned)).toBeDefined();
    const [moveAssigned] = screen.getAllByRole("button", { name: t.connections.moveAction });
    expect(moveAssigned).toBeDefined();

    fireEvent.click(moveAssigned as HTMLElement);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Casa B")).toBeDefined();
    expect(within(dialog).queryByText("Casa A")).toBeNull();
  });

  it("offers no move when the account already sits in the owner's only household", () => {
    renderPanel([{ id: "house-a", name: "Casa A" }]);

    expect(screen.getAllByRole("button", { name: t.connections.moveAction })).toHaveLength(1);
  });
});
