import { describe, expect, it, vi } from "vitest";

const computeLinkSuggestionsMock = vi.hoisted(() => vi.fn());
const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("./link-suggestions", () => ({ computeLinkSuggestions: computeLinkSuggestionsMock }));

import { getLinkSuggestionsPendingCount } from "./link-suggestions-page-props";

const SESSION = { userId: "user-1", householdId: "household-1" } as Parameters<
  typeof getLinkSuggestionsPendingCount
>[0];
const NOW = new Date("2026-10-13T12:00:00.000Z");

describe("getLinkSuggestionsPendingCount", () => {
  it("resolves to null, never rejecting, when the shared suggestion read fails", async () => {
    computeLinkSuggestionsMock.mockRejectedValue(new Error("household-b"));

    await expect(getLinkSuggestionsPendingCount(SESSION, NOW)).resolves.toBeNull();
    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("resolves to the real count once the read succeeds", async () => {
    computeLinkSuggestionsMock.mockResolvedValue({ rowById: new Map(), suggestions: [] });

    await expect(getLinkSuggestionsPendingCount(SESSION, NOW)).resolves.toBe(0);
  });
});
