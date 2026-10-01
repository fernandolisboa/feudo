// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const dismissReserveNoticeActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  dismissReserveNoticeAction: dismissReserveNoticeActionMock,
}));

import { ReserveNoticePanel } from "./reserve-notice-panel";
import { t } from "../strings";

afterEach(() => {
  cleanup();
  dismissReserveNoticeActionMock.mockReset();
});

describe("ReserveNoticePanel", () => {
  it("shows the message with the dismiss action in the default tone", () => {
    render(<ReserveNoticePanel id="notice-1" message="A meta da reserva mudou." />);

    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain("A meta da reserva mudou.");
    expect(screen.getByRole("button", { name: t.notice.action })).not.toBeNull();
  });

  it("switches to the danger tone and a retry label when dismissing fails", async () => {
    dismissReserveNoticeActionMock.mockResolvedValue({
      status: "error",
      message: t.errors.failed,
    });

    render(<ReserveNoticePanel id="notice-1" message="A meta da reserva mudou." />);
    fireEvent.click(screen.getByRole("button", { name: t.notice.action }));

    const retryButton = await screen.findByRole("button", { name: t.error.retry });
    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain(t.errors.failed);
    expect(retryButton).not.toBeNull();
    expect(notice.querySelector("svg")?.getAttribute("class")).toContain("text-danger");
  });
});
