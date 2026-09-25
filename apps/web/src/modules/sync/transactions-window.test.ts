import { describe, expect, it } from "vitest";

import { narrowedFirstSyncSince, transactionsSince } from "./transactions-window";

describe("transactionsSince", () => {
  it("starts a first sync at the first day of the month twelve months back", () => {
    expect(transactionsSince(new Date("2026-09-22T10:00:00.000Z"), null)).toBe("2025-09-01");
    expect(transactionsSince(new Date("2026-01-31T23:59:59.000Z"), null)).toBe("2025-01-01");
  });

  it("re-reads a week before the last sync", () => {
    expect(
      transactionsSince(new Date("2026-09-22T10:00:00.000Z"), new Date("2026-09-21T06:00:00.000Z")),
    ).toBe("2026-09-14");
  });

  it("crosses month and year boundaries in UTC", () => {
    expect(
      transactionsSince(new Date("2027-01-03T10:00:00.000Z"), new Date("2027-01-02T03:00:00.000Z")),
    ).toBe("2026-12-26");
  });
});

describe("narrowedFirstSyncSince", () => {
  it("starts at the first day of the previous month, UTC", () => {
    expect(narrowedFirstSyncSince(new Date("2026-09-22T10:00:00.000Z"))).toBe("2026-08-01");
  });

  it("crosses a year boundary in UTC", () => {
    expect(narrowedFirstSyncSince(new Date("2026-01-15T23:59:59.000Z"))).toBe("2025-12-01");
  });
});
