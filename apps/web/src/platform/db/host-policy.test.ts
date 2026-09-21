import { describe, expect, it } from "vitest";

import { databaseHost } from "./host-policy";

describe("databaseHost", () => {
  it("lowercases the host", () => {
    expect(databaseHost("EP-Dry-Wildflower.C-12.US-EAST-1.AWS.NEON.TECH")).toBe(
      "ep-dry-wildflower.c-12.us-east-1.aws.neon.tech",
    );
  });

  it("strips a trailing dot", () => {
    expect(databaseHost("ep-dry-wildflower.c-12.us-east-1.aws.neon.tech.")).toBe(
      "ep-dry-wildflower.c-12.us-east-1.aws.neon.tech",
    );
  });

  it("strips a -pooler suffix from the first label", () => {
    expect(databaseHost("ep-dry-wildflower-pooler.c-12.us-east-1.aws.neon.tech")).toBe(
      "ep-dry-wildflower.c-12.us-east-1.aws.neon.tech",
    );
  });

  it("leaves an already-normalised host unchanged", () => {
    expect(databaseHost("ep-dry-wildflower.c-12.us-east-1.aws.neon.tech")).toBe(
      "ep-dry-wildflower.c-12.us-east-1.aws.neon.tech",
    );
  });
});
