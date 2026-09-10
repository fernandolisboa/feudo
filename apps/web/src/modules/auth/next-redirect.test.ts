import { describe, expect, it } from "vitest";

import { sanitizeNextPath } from "./next-redirect";

describe("sanitizeNextPath", () => {
  it("accepts a well-formed invite path", () => {
    expect(sanitizeNextPath("/convite/abc123_-XYZ")).toBe("/convite/abc123_-XYZ");
  });

  it("rejects a protocol-relative path (open redirect)", () => {
    expect(sanitizeNextPath("//evil.example.com")).toBeNull();
  });

  it("rejects an absolute URL", () => {
    expect(sanitizeNextPath("https://evil.example.com/convite/abc")).toBeNull();
  });

  it("rejects a path that tries to traverse out of /convite", () => {
    expect(sanitizeNextPath("/convite/../x")).toBeNull();
  });

  it("rejects an empty or missing value", () => {
    expect(sanitizeNextPath("")).toBeNull();
    expect(sanitizeNextPath(null)).toBeNull();
    expect(sanitizeNextPath(undefined)).toBeNull();
  });

  it("rejects any other route on the app", () => {
    expect(sanitizeNextPath("/")).toBeNull();
    expect(sanitizeNextPath("/casa")).toBeNull();
  });
});
