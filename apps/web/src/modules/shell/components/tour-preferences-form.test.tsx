// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateTourAutoStartActionMock = vi.hoisted(() => vi.fn());
const resetToursActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  updateTourAutoStartAction: updateTourAutoStartActionMock,
  resetToursAction: resetToursActionMock,
}));

import { t } from "../strings";
import { TourPreferencesForm } from "./tour-preferences-form";

beforeEach(() => {
  updateTourAutoStartActionMock.mockReset();
  resetToursActionMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("TourPreferencesForm", () => {
  it("turns automatic tutorials off from the switch", async () => {
    updateTourAutoStartActionMock.mockResolvedValue({
      status: "success",
      message: t.preferences.autoStartOff,
    });
    render(<TourPreferencesForm autoStart />);

    const toggle = screen.getByRole("switch", { name: t.preferences.autoStartLabel });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);

    expect(await screen.findByText(t.preferences.autoStartOff)).not.toBeNull();
    const formData = updateTourAutoStartActionMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get("autoStart")).toBe("off");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("puts the switch back when saving fails", async () => {
    updateTourAutoStartActionMock.mockResolvedValue({
      status: "error",
      message: t.preferences.failed,
    });
    render(<TourPreferencesForm autoStart={false} />);

    const toggle = screen.getByRole("switch", { name: t.preferences.autoStartLabel });
    fireEvent.click(toggle);

    expect(await screen.findByText(t.preferences.failed)).not.toBeNull();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("replays every tutorial on request", async () => {
    resetToursActionMock.mockResolvedValue({ status: "success", message: t.preferences.resetDone });
    render(<TourPreferencesForm autoStart />);

    fireEvent.click(screen.getByRole("button", { name: t.preferences.reset }));

    expect(await screen.findByText(t.preferences.resetDone)).not.toBeNull();
    expect(resetToursActionMock).toHaveBeenCalledTimes(1);
  });
});
