import { beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ userId: "user-1", householdId: "household-1" }),
);
const confirmAllLinksMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./transaction-link-service", () => ({
  confirmAllLinks: confirmAllLinksMock,
  confirmLink: vi.fn(),
  dismissLink: vi.fn(),
  undoLink: vi.fn(),
}));

import { confirmAllLinksAction } from "./actions";
import { t } from "./strings";

function formDataWith(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

const BASE_FIELDS = {
  kind: "offset",
  debitTransactionIds: "d1,d2",
  creditTransactionIds: "c1,c2",
};

beforeEach(() => {
  requireHouseholdSessionMock.mockClear();
  confirmAllLinksMock.mockReset();
  revalidatePathMock.mockClear();
});

describe("confirmAllLinksAction feedback", () => {
  it("reports every pair linked when all requested pairs are confirmed", async () => {
    confirmAllLinksMock.mockResolvedValue({
      status: "ok",
      confirmedCount: 2,
      requestedCount: 2,
      interrupted: false,
    });

    const result = await confirmAllLinksAction({ status: "idle" }, formDataWith(BASE_FIELDS));

    expect(result).toEqual({
      status: "success",
      message: t.links.confirmedMany.replace("{count}", "2"),
    });
  });

  it("reports a single pair with the singular copy when only one is requested and confirmed", async () => {
    confirmAllLinksMock.mockResolvedValue({
      status: "ok",
      confirmedCount: 1,
      requestedCount: 1,
      interrupted: false,
    });

    const result = await confirmAllLinksAction(
      { status: "idle" },
      formDataWith({ ...BASE_FIELDS, debitTransactionIds: "d1", creditTransactionIds: "c1" }),
    );

    expect(result).toEqual({ status: "success", message: t.links.confirmedOne });
  });

  it("names how many of how many landed, and that the rest are gone, on a partial confirm", async () => {
    confirmAllLinksMock.mockResolvedValue({
      status: "ok",
      confirmedCount: 1,
      requestedCount: 2,
      interrupted: false,
    });

    const result = await confirmAllLinksAction({ status: "idle" }, formDataWith(BASE_FIELDS));

    expect(result).toEqual({
      status: "success",
      message: t.links.confirmedPartial.replace("{confirmed}", "1").replace("{requested}", "2"),
    });
  });

  it("tells the member to try again for the rest, not that they are gone, when the batch was interrupted", async () => {
    confirmAllLinksMock.mockResolvedValue({
      status: "ok",
      confirmedCount: 1,
      requestedCount: 2,
      interrupted: true,
    });

    const result = await confirmAllLinksAction({ status: "idle" }, formDataWith(BASE_FIELDS));

    expect(result).toEqual({
      status: "success",
      message: t.links.confirmedInterrupted.replace("{confirmed}", "1").replace("{requested}", "2"),
    });
  });

  it("uses the plural not-found copy, not the single-pair one, once nothing is left to confirm", async () => {
    confirmAllLinksMock.mockResolvedValue({ status: "not_found" });

    const result = await confirmAllLinksAction({ status: "idle" }, formDataWith(BASE_FIELDS));

    expect(result).toEqual({ status: "error", message: t.errors.linksNotFound });
  });
});
