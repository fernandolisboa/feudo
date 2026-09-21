import { describe, expect, it } from "vitest";

import { checkDatabaseHost, databaseHost } from "./host-policy";

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

describe("checkDatabaseHost", () => {
  it("names DATABASE_PRODUCTION_HOST when production is admitted but neither host is declared", () => {
    const check = checkDatabaseHost(
      { DATABASE_URL: "postgres://user:pass@ep-prod-pooler.c-12.us-east-1.aws.neon.tech/db" },
      { allowProduction: true },
    );
    expect(check).toEqual({
      ok: false,
      reason:
        "DATABASE_PRODUCTION_HOST does not match DATABASE_URL's host and DATABASE_RESET_ALLOWED_HOST is not set",
    });
  });
});
