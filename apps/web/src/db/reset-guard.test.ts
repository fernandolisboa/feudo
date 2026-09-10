import { describe, expect, it } from "vitest";

import { DatabaseResetNotAllowedError } from "./errors";
import { assertDatabaseResetAllowed } from "./reset-guard";

const PREVIEW_URL =
  "postgres://user:pass@ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech/db";
const PREVIEW_HOST = "ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech";
const PRODUCTION_URL =
  "postgres://user:pass@ep-dry-wildflower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech/db";
const PRODUCTION_HOST = "ep-dry-wildflower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech";

describe("assertDatabaseResetAllowed", () => {
  it("refuses when DATABASE_RESET_ALLOWED_HOST is not set", () => {
    expect(() => {
      assertDatabaseResetAllowed({ DATABASE_URL: PREVIEW_URL });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("refuses when the host differs from DATABASE_URL's host", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: "ep-dry-wildflower-pooler.c-12.us-east-1.aws.neon.tech",
      });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("refuses when DATABASE_URL is missing or not a valid URL", () => {
    expect(() => {
      assertDatabaseResetAllowed({ DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("refuses when VERCEL_ENV is production even if the host matches", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
        VERCEL_ENV: "production",
      });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("allows the reset when the host equals DATABASE_URL's host and not production", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
      });
    }).not.toThrow();
  });

  it("refuses when DATABASE_URL's host equals DATABASE_PRODUCTION_HOST", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_URL: PRODUCTION_URL,
        DATABASE_RESET_ALLOWED_HOST: PRODUCTION_HOST,
        DATABASE_PRODUCTION_HOST: PRODUCTION_HOST,
      });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("allows the reset when DATABASE_PRODUCTION_HOST is set but differs from DATABASE_URL's host", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
        DATABASE_PRODUCTION_HOST: PRODUCTION_HOST,
      });
    }).not.toThrow();
  });
});
