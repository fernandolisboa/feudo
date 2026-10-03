import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { shiftYearMonth } from "../ledger/year-month";
import {
  DELETION_GRACE_DAYS,
  deletionPurgeAt,
  deletionPurgeCutoff,
  groupConsecutiveMonths,
} from "./deletion";

describe("deletion grace", () => {
  it("lasts seven days", () => {
    expect(DELETION_GRACE_DAYS).toBe(7);
  });

  it("purges seven days after the request, to the millisecond", () => {
    expect(deletionPurgeAt(new Date("2026-10-03T18:00:00.000Z"))).toEqual(
      new Date("2026-10-10T18:00:00.000Z"),
    );
  });

  it("makes a request due exactly when its grace ends, not a moment before", () => {
    const requestedAt = new Date("2026-10-03T18:00:00.000Z");
    const justBefore = new Date("2026-10-10T17:59:59.999Z");
    const atTheEnd = new Date("2026-10-10T18:00:00.000Z");
    expect(requestedAt.getTime() <= deletionPurgeCutoff(justBefore).getTime()).toBe(false);
    expect(requestedAt.getTime() <= deletionPurgeCutoff(atTheEnd).getTime()).toBe(true);
  });

  it("keeps purge time and cutoff consistent for any instant", () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true, min: new Date(0), max: new Date(4e12) }), (at) => {
        expect(deletionPurgeCutoff(deletionPurgeAt(at)).getTime()).toBe(at.getTime());
      }),
    );
  });
});

describe("groupConsecutiveMonths", () => {
  it("returns nothing for no months", () => {
    expect(groupConsecutiveMonths([])).toEqual([]);
  });

  it("collapses a contiguous run into one range across a year boundary", () => {
    expect(groupConsecutiveMonths(["2025-11", "2025-12", "2026-01"])).toEqual([
      { from: "2025-11", to: "2026-01" },
    ]);
  });

  it("splits runs at a gap and keeps a lone month as its own range", () => {
    expect(groupConsecutiveMonths(["2026-01", "2026-02", "2026-05"])).toEqual([
      { from: "2026-01", to: "2026-02" },
      { from: "2026-05", to: "2026-05" },
    ]);
  });

  it("ignores order and duplicates", () => {
    expect(groupConsecutiveMonths(["2026-03", "2026-01", "2026-02", "2026-01"])).toEqual([
      { from: "2026-01", to: "2026-03" },
    ]);
  });

  it("covers exactly the months it was given, in ascending, non-touching ranges", () => {
    const month = fc
      .integer({ min: 0, max: 400 })
      .map((offset) => shiftYearMonth("2000-01", offset));
    fc.assert(
      fc.property(fc.array(month, { maxLength: 40 }), (months) => {
        const ranges = groupConsecutiveMonths(months);
        const covered: string[] = [];
        for (const range of ranges) {
          let current = range.from;
          covered.push(current);
          while (current !== range.to) {
            current = shiftYearMonth(current, 1);
            covered.push(current);
          }
        }
        expect(covered).toEqual([...new Set(months)].sort());
        for (let index = 1; index < ranges.length; index += 1) {
          const previous = ranges[index - 1];
          const next = ranges[index];
          if (previous && next) {
            expect(shiftYearMonth(previous.to, 1) < next.from).toBe(true);
          }
        }
      }),
    );
  });
});
