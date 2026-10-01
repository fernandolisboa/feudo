// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { HouseholdAccount } from "../repository";
import { SyncNotices } from "./sync-notices";

afterEach(() => {
  cleanup();
});

const NOW = new Date("2026-10-01T15:00:00Z");

function account(overrides: Partial<HouseholdAccount>): HouseholdAccount {
  return {
    id: "acc",
    connectionId: "conn-1",
    institutionName: "Itaú",
    name: "Conta corrente",
    type: "checking",
    productType: null,
    balanceCentavos: 0,
    currency: "BRL",
    label: "individual",
    ratePpm: null,
    rateType: null,
    dueDate: null,
    connectedByUserId: "user-1",
    connectedByName: "Ana",
    syncedAt: new Date("2026-10-01T09:10:00Z"),
    connectionSyncedAt: new Date("2026-10-01T09:10:00Z"),
    lastSyncError: null,
    ...overrides,
  };
}

function renderNotices(accounts: HouseholdAccount[]) {
  render(<SyncNotices accounts={accounts} now={NOW} />);
}

describe("SyncNotices", () => {
  it("says nothing while every account is fresh and synced", () => {
    renderNotices([account({ id: "a" }), account({ id: "b" })]);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("calls out accounts older than 48 hours", () => {
    const stale = new Date(NOW.getTime() - 49 * 60 * 60 * 1000);
    renderNotices([
      account({ id: "a", syncedAt: stale, connectionSyncedAt: stale }),
      account({ id: "b", connectionId: "conn-2", syncedAt: stale, connectionSyncedAt: stale }),
      account({ id: "c" }),
      account({ id: "d", syncedAt: stale }),
    ]);

    expect(
      screen.getByText("2 contas desta casa estão sem atualização há mais de 48 horas."),
    ).toBeDefined();
  });

  it("explains a failed sync once per connection, in plain language, naming who connected it", () => {
    renderNotices([
      account({ id: "a", lastSyncError: "provider_unavailable" }),
      account({ id: "b", lastSyncError: "provider_unavailable" }),
      account({
        id: "c",
        connectionId: "conn-2",
        institutionName: "Nubank",
        connectedByName: "Bia",
        lastSyncError: "invalid_credentials",
      }),
    ]);

    const notices = screen.getAllByRole("status");
    expect(notices).toHaveLength(2);
    expect(
      screen.getByText(
        "A última sincronização de Itaú (Ana) falhou: o Meu Pluggy não respondeu. Tente de novo mais tarde.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(/A última sincronização de Nubank \(Bia\) falhou: o Meu Pluggy recusou/),
    ).toBeDefined();
  });
});
