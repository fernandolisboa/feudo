// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";
import type { HouseholdSummary } from "../service";

const switchHouseholdActionMock = vi.hoisted(() => vi.fn());
const callOrder = vi.hoisted(() => [] as string[]);
const clearOfflineCopiesMock = vi.hoisted(() =>
  vi.fn(() => {
    callOrder.push("clear");
    return Promise.resolve();
  }),
);

vi.mock("../actions", () => ({ switchHouseholdAction: switchHouseholdActionMock }));
vi.mock("@/platform/pwa/offline-copies", () => ({ clearOfflineCopies: clearOfflineCopiesMock }));

import { HouseholdSwitcherSelect } from "./household-switcher-select";

const households: HouseholdSummary[] = [
  { id: "household-a", name: "Casa A" },
  { id: "household-b", name: "Casa B" },
];

afterEach(() => {
  cleanup();
  switchHouseholdActionMock.mockReset();
  clearOfflineCopiesMock.mockClear();
  callOrder.length = 0;
});

describe("HouseholdSwitcherSelect", () => {
  it("shows the active household's name, not its id", () => {
    render(<HouseholdSwitcherSelect households={households} activeHouseholdId="household-b" />);

    expect(within(screen.getByRole("combobox")).queryByText("Casa B")).not.toBeNull();
  });

  it("shows the failure alert when switchHouseholdAction resolves an error", async () => {
    switchHouseholdActionMock.mockResolvedValue({
      status: "error",
      message: t.errors.notAMember,
    });
    render(<HouseholdSwitcherSelect households={households} activeHouseholdId="household-a" />);

    fireEvent.click(screen.getByRole("combobox"));
    const option = (await screen.findByText("Casa B")).closest('[role="option"]');
    if (!option) {
      throw new Error("option not found");
    }
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(t.errors.notAMember);
    });
  });

  it("clears this browser's offline copies before switching household (ADR-0007)", async () => {
    switchHouseholdActionMock.mockImplementation(() => {
      callOrder.push("switch");
      return Promise.resolve({ status: "error", message: t.errors.notAMember });
    });
    render(<HouseholdSwitcherSelect households={households} activeHouseholdId="household-a" />);

    fireEvent.click(screen.getByRole("combobox"));
    const option = (await screen.findByText("Casa B")).closest('[role="option"]');
    if (!option) {
      throw new Error("option not found");
    }
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(callOrder).toEqual(["clear", "switch"]);
    });
  });

  it("propagates the Next redirect sentinel instead of swallowing it as a failure", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;push;/;307;",
    });
    switchHouseholdActionMock.mockRejectedValue(redirectError);

    const reported: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener("error", onError);

    render(<HouseholdSwitcherSelect households={households} activeHouseholdId="household-a" />);
    fireEvent.click(screen.getByRole("combobox"));
    const option = (await screen.findByText("Casa B")).closest('[role="option"]');
    if (!option) {
      throw new Error("option not found");
    }
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(reported).toContain(redirectError);
    });
    expect(screen.queryByRole("alert")).toBeNull();

    window.removeEventListener("error", onError);
  });
});
