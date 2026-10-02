import { beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ userId: "user-1", householdId: "household-1" }),
);
const getViewerRoleMock = vi.hoisted(() => vi.fn().mockResolvedValue("owner"));
const setHouseholdReserveMultipleMock = vi.hoisted(() => vi.fn());
const dismissReserveNoticeMock = vi.hoisted(() => vi.fn());
const setReserveMarkMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  getViewerRole: getViewerRoleMock,
  canManageHouseholdSettings: (role: string) => role === "owner" || role === "admin",
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  setHouseholdReserveMultiple: setHouseholdReserveMultipleMock,
  dismissReserveNotice: dismissReserveNoticeMock,
  setReserveMark: setReserveMarkMock,
}));

import { initialActionState } from "@/lib/action-state";
import {
  dismissReserveNoticeAction,
  updateReserveMarkAction,
  updateReserveMultipleAction,
} from "./actions";
import { t } from "./strings";

beforeEach(() => {
  requireHouseholdSessionMock.mockClear();
  getViewerRoleMock.mockReset().mockResolvedValue("owner");
  setHouseholdReserveMultipleMock.mockReset();
  dismissReserveNoticeMock.mockReset();
  setReserveMarkMock.mockReset();
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

  it("rejects a member before reaching the service (CONTEXT.md: only owner/admin administer settings)", async () => {
    getViewerRoleMock.mockResolvedValue("member");

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.notAllowed });
    expect(setHouseholdReserveMultipleMock).not.toHaveBeenCalled();
  });

  it("rejects a role value that is neither owner, admin nor member (the allow-list denies by default)", async () => {
    getViewerRoleMock.mockResolvedValue("member,viewer");

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.notAllowed });
    expect(setHouseholdReserveMultipleMock).not.toHaveBeenCalled();
  });

  it("allows an admin to change the multiple", async () => {
    getViewerRoleMock.mockResolvedValue("admin");
    setHouseholdReserveMultipleMock.mockResolvedValue({ status: "ok" });

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "success", message: t.multipleUpdated });
    expect(setHouseholdReserveMultipleMock).toHaveBeenCalled();
  });

  it("allows the owner to change the multiple", async () => {
    getViewerRoleMock.mockResolvedValue("owner");
    setHouseholdReserveMultipleMock.mockResolvedValue({ status: "ok" });

    const result = await updateReserveMultipleAction(
      initialActionState,
      formDataWith({ reserveMultiple: "9" }),
    );

    expect(result).toEqual({ status: "success", message: t.multipleUpdated });
    expect(setHouseholdReserveMultipleMock).toHaveBeenCalled();
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

describe("updateReserveMarkAction", () => {
  const VALID = {
    accountId: "account-1",
    isReserve: "true",
    liquidity: "daily",
    institutionId: "inter",
  };

  it("saves the mark for the session's household, whatever the member's role", async () => {
    getViewerRoleMock.mockResolvedValue("member");
    setReserveMarkMock.mockResolvedValue({ status: "ok" });

    const result = await updateReserveMarkAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "success", message: t.markSaved });
    expect(setReserveMarkMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      "user-1",
      { accountId: "account-1", isReserve: true, liquidity: "daily", institutionId: "inter" },
      {},
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/reserva");
  });

  it("maps 'automatic' and 'don't know' to no override", async () => {
    setReserveMarkMock.mockResolvedValue({ status: "ok" });

    await updateReserveMarkAction(
      initialActionState,
      formDataWith({ ...VALID, isReserve: "false", liquidity: "unknown", institutionId: "auto" }),
    );

    expect(setReserveMarkMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      "user-1",
      { accountId: "account-1", isReserve: false, liquidity: null, institutionId: null },
      {},
    );
  });

  it("rejects an institution outside the reference dataset before reaching the service", async () => {
    const result = await updateReserveMarkAction(
      initialActionState,
      formDataWith({ ...VALID, institutionId: "banco-inventado" }),
    );

    expect(result).toEqual({ status: "error", message: t.errors.invalidInput });
    expect(setReserveMarkMock).not.toHaveBeenCalled();
  });

  it("says so when the account is not in the household", async () => {
    setReserveMarkMock.mockResolvedValue({ status: "not_found" });

    const result = await updateReserveMarkAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "error", message: t.errors.accountNotFound });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
