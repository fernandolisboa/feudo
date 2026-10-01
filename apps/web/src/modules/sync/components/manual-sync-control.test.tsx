// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "@/lib/action-state";

const syncNowAction = vi.fn<() => Promise<ActionState>>();
vi.mock("../actions", () => ({ syncNowAction: () => syncNowAction() }));

import { ManualSyncControl } from "./manual-sync-control";

afterEach(() => {
  cleanup();
  syncNowAction.mockReset();
});

describe("ManualSyncControl", () => {
  it("shows how many of the household's manual syncs are left today", () => {
    render(<ManualSyncControl remaining={2} limit={3} hasFailures={false} />);

    expect(screen.getByText("Restam 2 das 3 sincronizações manuais de hoje.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sincronizar agora" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("uses the singular for the last one", () => {
    render(<ManualSyncControl remaining={1} limit={3} hasFailures={false} />);

    expect(screen.getByText("Resta 1 das 3 sincronizações manuais de hoje.")).toBeDefined();
  });

  it("disables the button once the quota is spent", () => {
    render(<ManualSyncControl remaining={0} limit={3} hasFailures={false} />);

    expect(screen.getByText(/já usou as 3 sincronizações manuais de hoje/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Sincronizar agora" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("offers a retry when the last sync of a connection failed", () => {
    render(<ManualSyncControl remaining={3} limit={3} hasFailures />);

    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeDefined();
  });

  it("runs the sync and reports its result", async () => {
    syncNowAction.mockResolvedValue({ status: "success", message: "Contas sincronizadas." });
    render(<ManualSyncControl remaining={3} limit={3} hasFailures={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));

    expect(await screen.findByText("Contas sincronizadas.")).toBeDefined();
    expect(syncNowAction).toHaveBeenCalledTimes(1);
  });
});
