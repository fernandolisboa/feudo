import { beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ userId: "user-1", householdId: "household-1" }),
);
const setHouseholdReserveMultipleMock = vi.hoisted(() => vi.fn());
const dismissReserveNoticeMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  setHouseholdReserveMultiple: setHouseholdReserveMultipleMock,
  dismissReserveNotice: dismissReserveNoticeMock,
}));

import { initialActionState } from "@/lib/action-state";
import { dismissReserveNoticeAction, updateReserveMultipleAction } from "./actions";
import { t } from "./strings";

beforeEach(() => {
  requireHouseholdSessionMock.mockClear();
  setHouseholdReserveMultipleMock.mockReset();
  dismissReserveNoticeMock.mockReset();
  revalidatePathMock.mockClear();
});

function formDataWith(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("updateReserveMultipleAction", () => {
  it("rejects a multiple outside the 3..12 range before reaching the service", async () => {
    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "13" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(setHouseholdReserveMultipleMock).not.toHaveBeenCalled();
  });

  it("rejects a missing multiple", async () => {
    const result = await updateReserveMultipleAction(initialActionState, formDataWith({}));

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(setHouseholdReserveMultipleMock).not.toHaveBeenCalled();
  });

  it("returns success and revalidates on a valid multiple", async () => {
    setHouseholdReserveMultipleMock.mockResolvedValue({ status: "ok" });

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "success", message: t.multipleUpdated });
    expect(setHouseholdReserveMultipleMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      9,
      {},
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/reserva");
  });

  it("returns an error when the service reports failure", async () => {
    setHouseholdReserveMultipleMock.mockResolvedValue({ status: "failed" });

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.failed });
  });
});

describe("dismissReserveNoticeAction", () => {
  it("rejects an empty notice id before reaching the service", async () => {
    const result = await dismissReserveNoticeAction(
      initialActionState,
      formDataWith({ noticeId: "" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(dismissReserveNoticeMock).not.toHaveBeenCalled();
  });

  it("returns success on a valid dismissal", async () => {
    dismissReserveNoticeMock.mockResolvedValue({ status: "ok" });

    const result = await dismissReserveNoticeAction(
      initialActionState,
      formDataWith({ noticeId: "notice-1" }),
    );

    expect(result).toEqual({ status: "success", message: t.noticeDismissed });
  });

  it("returns not-found as an error when the notice belongs to another household", async () => {
    dismissReserveNoticeMock.mockResolvedValue({ status: "not_found" });

    const result = await dismissReserveNoticeAction(
      initialActionState,
      formDataWith({ noticeId: "notice-1" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.noticeNotFound });
  });
});
