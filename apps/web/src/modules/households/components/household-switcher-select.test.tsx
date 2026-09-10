// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "../strings";
import type { HouseholdSummary } from "../service";

const switchHouseholdActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ switchHouseholdAction: switchHouseholdActionMock }));

import { HouseholdSwitcherSelect } from "./household-switcher-select";

const households: HouseholdSummary[] = [
  { id: "household-a", name: "Casa A" },
  { id: "household-b", name: "Casa B" },
];

afterEach(() => {
  cleanup();
  switchHouseholdActionMock.mockReset();
});

describe("HouseholdSwitcherSelect", () => {
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
