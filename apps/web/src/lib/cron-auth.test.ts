import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isCronRequestAuthorized } from "./cron-auth";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

describe("isCronRequestAuthorized", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  });

  it("authorizes a matching bearer header", () => {
    expect(isCronRequestAuthorized("Bearer test-secret")).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(isCronRequestAuthorized(null)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(isCronRequestAuthorized("Bearer wrong-secret")).toBe(false);
  });

  it("rejects a header of a different length than expected", () => {
    expect(isCronRequestAuthorized("Bearer")).toBe(false);
  });

  it("rejects when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    expect(isCronRequestAuthorized("Bearer test-secret")).toBe(false);
  });
});
