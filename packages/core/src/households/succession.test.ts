import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { pickSuccessor, type SuccessionCandidate } from "./succession";

function candidate(
  id: string,
  role: SuccessionCandidate["role"],
  joinedAt: string,
  leaving = false,
): SuccessionCandidate {
  return { id, role, joinedAt: new Date(joinedAt), leaving };
}

describe("pickSuccessor", () => {
  it("returns null when nobody else is in the household", () => {
    expect(pickSuccessor([])).toBeNull();
  });

  it("prefers the oldest admin over an older member", () => {
    const successor = pickSuccessor([
      candidate("m1", "member", "2026-01-01"),
      candidate("a2", "admin", "2026-03-01"),
      candidate("a1", "admin", "2026-02-01"),
    ]);
    expect(successor?.id).toBe("a1");
  });

  it("falls back to the oldest member when there is no admin", () => {
    const successor = pickSuccessor([
      candidate("m2", "member", "2026-02-01"),
      candidate("m1", "member", "2026-01-01"),
    ]);
    expect(successor?.id).toBe("m1");
  });

  it("skips someone who is also leaving while anyone else can take over", () => {
    const successor = pickSuccessor([
      candidate("a1", "admin", "2026-01-01", true),
      candidate("m1", "member", "2026-02-01"),
    ]);
    expect(successor?.id).toBe("m1");
  });

  it("still names a successor when everyone left is also leaving", () => {
    const successor = pickSuccessor([
      candidate("m1", "member", "2026-01-01", true),
      candidate("a1", "admin", "2026-02-01", true),
    ]);
    expect(successor?.id).toBe("a1");
  });

  it("breaks a tie on join time by id, so every run picks the same person", () => {
    const successor = pickSuccessor([
      candidate("b", "admin", "2026-01-01"),
      candidate("a", "admin", "2026-01-01"),
    ]);
    expect(successor?.id).toBe("a");
  });

  it("never depends on the order candidates arrive in", () => {
    const arbitraryCandidate = fc.record({
      id: fc.string({ minLength: 1, maxLength: 4 }),
      role: fc.constantFrom<SuccessionCandidate["role"]>("admin", "member"),
      joinedAt: fc.date({ noInvalidDate: true, min: new Date(0), max: new Date(4e12) }),
      leaving: fc.boolean(),
    });
    fc.assert(
      fc.property(
        fc.uniqueArray(arbitraryCandidate, { selector: (entry) => entry.id, maxLength: 8 }),
        (candidates) => {
          const forward = pickSuccessor(candidates);
          const backward = pickSuccessor([...candidates].reverse());
          expect(backward?.id).toBe(forward?.id);
          if (candidates.length > 0) {
            expect(forward).not.toBeNull();
          }
        },
      ),
    );
  });
});
