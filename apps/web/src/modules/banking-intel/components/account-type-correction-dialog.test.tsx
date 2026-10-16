// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveAccountTypeOverrideActionMock = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({
  saveAccountTypeOverrideAction: saveAccountTypeOverrideActionMock,
}));

import { interpolateAll } from "@/lib/interpolate";

import { t } from "../strings";
import { AccountTypeCorrectionDialog } from "./account-type-correction-dialog";

function defaultProps() {
  return {
    institutionId: "nubank",
    bankName: "Nubank",
    accountType: "joint" as const,
    seenReviewedAt: "2026-10-01",
    typeLabel: "Conta conjunta",
    triggerLabel: t.accountTypes.correct,
    defaults: { offered: null, note: "", sourceUrl: "" },
  };
}

beforeEach(() => {
  saveAccountTypeOverrideActionMock.mockReset().mockResolvedValue({ status: "idle" });
});

afterEach(() => {
  cleanup();
});

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: t.accountTypes.correct }));
}

describe("AccountTypeCorrectionDialog", () => {
  it("opens with the correction form for the given bank and account type", async () => {
    render(<AccountTypeCorrectionDialog {...defaultProps()} />);

    openDialog();

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain(
      interpolateAll(t.accountTypes.dialog.title, { type: "Conta conjunta", bank: "Nubank" }),
    );
    expect(screen.getByText(t.accountTypes.dialog.note)).not.toBeNull();
    expect(screen.getByText(t.accountTypes.dialog.sourceUrl)).not.toBeNull();
  });

  it("defaults to offered yes when there is no current answer", async () => {
    render(<AccountTypeCorrectionDialog {...defaultProps()} />);

    openDialog();
    await screen.findByRole("dialog");

    expect(
      screen
        .getByRole("button", { name: t.accountTypes.dialog.offeredYes })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("posts the household's answer, note and source link", async () => {
    render(<AccountTypeCorrectionDialog {...defaultProps()} />);

    openDialog();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: t.accountTypes.dialog.offeredNo }));
    fireEvent.change(screen.getByLabelText(t.accountTypes.dialog.note), {
      target: { value: "Fechou conta conjunta para novos clientes." },
    });
    fireEvent.change(screen.getByLabelText(t.accountTypes.dialog.sourceUrl), {
      target: { value: "https://nubank.com.br/novidades" },
    });
    fireEvent.click(screen.getByRole("button", { name: t.accountTypes.dialog.submit }));

    await waitFor(() => {
      expect(saveAccountTypeOverrideActionMock).toHaveBeenCalledTimes(1);
    });
    const postedForm = saveAccountTypeOverrideActionMock.mock.calls[0]?.[1] as FormData;
    expect(postedForm.get("institutionId")).toBe("nubank");
    expect(postedForm.get("accountType")).toBe("joint");
    expect(postedForm.get("seenReviewedAt")).toBe("2026-10-01");
    expect(postedForm.get("offered")).toBe("false");
    expect(postedForm.get("note")).toBe("Fechou conta conjunta para novos clientes.");
    expect(postedForm.get("sourceUrl")).toBe("https://nubank.com.br/novidades");
  });

  it("closes without saving when the household cancels", async () => {
    render(<AccountTypeCorrectionDialog {...defaultProps()} />);

    openDialog();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: t.accountTypes.dialog.cancel }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(saveAccountTypeOverrideActionMock).not.toHaveBeenCalled();
  });
});
