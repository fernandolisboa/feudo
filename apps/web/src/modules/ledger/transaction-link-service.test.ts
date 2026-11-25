import { beforeEach, describe, expect, it, vi } from "vitest";

const computeLinkSuggestionsMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/households", () => ({
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./link-suggestions", () => ({ computeLinkSuggestions: computeLinkSuggestionsMock }));
vi.mock("./transaction-link-repository", () => ({
  createTransactionLinkRepository: () => ({ confirm: confirmMock }),
}));

import { confirmAllLinks } from "./transaction-link-service";

const SESSION = { userId: "user-1", householdId: "household-1" } as Parameters<
  typeof confirmAllLinks
>[1];
const NOW = new Date("2026-10-13T12:00:00.000Z");

const PAIR_A = { debitTransactionId: "d1", creditTransactionId: "c1" };
const PAIR_B = { debitTransactionId: "d2", creditTransactionId: "c2" };
const PAIR_C = { debitTransactionId: "d3", creditTransactionId: "c3" };

function suggestionsFor(pairs: (typeof PAIR_A)[]) {
  return { suggestions: pairs.map((pair) => ({ ...pair, kind: "offset" as const })) };
}

describe("confirmAllLinks, an unexpected error mid-batch", () => {
  beforeEach(() => {
    computeLinkSuggestionsMock.mockReset();
    confirmMock.mockReset();
  });

  it("reports what confirmed before the interruption, flagging the batch as interrupted", async () => {
    computeLinkSuggestionsMock.mockResolvedValue(suggestionsFor([PAIR_A, PAIR_B, PAIR_C]));
    confirmMock
      .mockResolvedValueOnce("ok")
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockResolvedValueOnce("ok");

    const outcome = await confirmAllLinks(
      { kind: "offset", pairs: [PAIR_A, PAIR_B, PAIR_C] },
      SESSION,
      {} as never,
      NOW,
    );

    expect(outcome).toEqual({
      status: "ok",
      confirmedCount: 1,
      requestedCount: 3,
      interrupted: true,
    });
    expect(confirmMock).toHaveBeenCalledTimes(2);
  });

  it("refuses with failed, never not_found, when the very first pair errors unexpectedly", async () => {
    computeLinkSuggestionsMock.mockResolvedValue(suggestionsFor([PAIR_A, PAIR_B]));
    confirmMock.mockRejectedValue(new Error("connection reset"));

    const outcome = await confirmAllLinks(
      { kind: "offset", pairs: [PAIR_A, PAIR_B] },
      SESSION,
      {} as never,
      NOW,
    );

    expect(outcome).toEqual({ status: "failed" });
  });

  it("still reports a clean ok, not interrupted, when every pair confirms", async () => {
    computeLinkSuggestionsMock.mockResolvedValue(suggestionsFor([PAIR_A, PAIR_B]));
    confirmMock.mockResolvedValue("ok");

    const outcome = await confirmAllLinks(
      { kind: "offset", pairs: [PAIR_A, PAIR_B] },
      SESSION,
      {} as never,
      NOW,
    );

    expect(outcome).toEqual({
      status: "ok",
      confirmedCount: 2,
      requestedCount: 2,
      interrupted: false,
    });
  });
});
