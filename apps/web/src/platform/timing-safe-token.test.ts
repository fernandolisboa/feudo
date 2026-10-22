import * as nodeCrypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { tokensMatch } from "./timing-safe-token";

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof nodeCrypto>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});

describe("tokensMatch", () => {
  it("accepts the same token", () => {
    expect(tokensMatch("Bearer s3cret", "Bearer s3cret")).toBe(true);
  });

  it("rejects a different token of the same length", () => {
    expect(tokensMatch("Bearer s3cret", "Bearer s3creT")).toBe(false);
  });

  it("rejects a prefix, an extension and an empty token", () => {
    expect(tokensMatch("Bearer s3cret", "Bearer s3cre")).toBe(false);
    expect(tokensMatch("Bearer s3cret", "Bearer s3cret!")).toBe(false);
    expect(tokensMatch("Bearer s3cret", "")).toBe(false);
  });

  it("runs the constant-time compare on equal-length digests even when the lengths differ", () => {
    const compare = vi.mocked(nodeCrypto.timingSafeEqual);
    compare.mockClear();
    tokensMatch("Bearer a-much-longer-secret", "x");
    expect(compare).toHaveBeenCalledTimes(1);
    const [left, right] = compare.mock.calls[0] ?? [];
    expect((left as Buffer).length).toBe(32);
    expect((right as Buffer).length).toBe(32);
  });
});
