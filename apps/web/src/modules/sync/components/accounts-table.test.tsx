// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ relabelAccountAction: vi.fn() }));

import type { HouseholdAccount } from "../repository";
import { ACCOUNTS_PAGE_SIZE, AccountsTable } from "./accounts-table";

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
  closedAt: null,
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

describe("AccountsTable closed accounts", () => {
  it("says when an account was found closed instead of its frozen last update", () => {
    const stale = new Date("2026-09-10T09:10:00Z");
    render(
      <AccountsTable
        accounts={[
          {
            ...base,
            name: "CDB Banco X",
            type: "investment",
            syncedAt: stale,
            connectionSyncedAt: stale,
            closedAt: new Date("2026-09-11T09:10:00Z"),
          },
        ]}
        viewerUserId="someone-else"
        timeZone="America/Sao_Paulo"
        now={NOW}
      />,
    );

    expect(screen.getByText("Encerrada em 11/09/2026").className).not.toContain("text-warning");
    expect(screen.queryByText("10/09/2026, 06:10")).toBeNull();
    expect(screen.getByText("R$ 0,00")).toBeDefined();
  });
});

describe("AccountsTable pages and cards", () => {
  it("shows ten accounts per page instead of growing without limit", () => {
    const accounts = Array.from({ length: ACCOUNTS_PAGE_SIZE + 6 }, (_, index) => ({
      ...base,
      id: `acc-${String(index)}`,
      name: `Conta ${String(index + 1)}`,
    }));
    render(
      <AccountsTable
        accounts={accounts}
        viewerUserId="someone-else"
        timeZone="America/Sao_Paulo"
        now={NOW}
      />,
    );

    expect(screen.getByText("Conta 10")).toBeDefined();
    expect(screen.queryByText("Conta 11")).toBeNull();
    expect(screen.getByText("Página 1 de 2 · 16 contas")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

    expect(screen.getByText("Conta 16")).toBeDefined();
    expect(screen.queryByText("Conta 10")).toBeNull();
  });

  it("leads each card with the account and labels every other line", () => {
    render(
      <AccountsTable
        accounts={[base]}
        viewerUserId="user-1"
        timeZone="America/Sao_Paulo"
        now={NOW}
      />,
    );

    const cells = screen.getAllByRole("cell");
    expect(cells.map((cell) => cell.dataset.card ?? cell.dataset.label)).toEqual([
      "title",
      "Rótulo",
      "Conectada por",
      "Atualização",
      "Saldo",
      "actions",
    ]);
    expect(cells[0]?.textContent).toBe("Conta correnteItaú · Conta corrente");
  });
});
