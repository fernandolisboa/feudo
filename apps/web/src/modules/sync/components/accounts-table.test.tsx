// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ relabelAccountAction: vi.fn() }));

import type { HouseholdAccount } from "../repository";
import { AccountsTable } from "./accounts-table";

afterEach(() => {
  cleanup();
});

const NOW = new Date("2026-10-01T15:00:00Z");

const base: HouseholdAccount = {
  id: "acc-1",
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
};

describe("AccountsTable freshness", () => {
  it("shows when each account was last updated, in the household's own day", () => {
    render(
      <AccountsTable
        accounts={[
          base,
          {
            ...base,
            id: "acc-2",
            name: "Poupança",
            syncedAt: new Date("2026-09-28T09:10:00Z"),
            connectionSyncedAt: new Date("2026-09-28T09:10:00Z"),
          },
        ]}
        viewerUserId="someone-else"
        timeZone="America/Sao_Paulo"
        now={NOW}
      />,
    );

    expect(screen.getByText("hoje, 06:10").className).not.toContain("text-warning");
    expect(screen.getByText("28/09/2026, 06:10").className).toContain("text-warning");
  });
});
