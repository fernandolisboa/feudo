import { describe, expect, it } from "vitest";

import { assertDatabaseConnectionAllowed } from "./connection-guard";
import { DatabaseConnectionNotAllowedError } from "./errors";

const PREVIEW_URL =
  "postgres://user:pass@ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech/db";
const PREVIEW_HOST = "ep-late-flower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech";
const PRODUCTION_URL =
  "postgres://user:pass@ep-dry-wildflower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech/db";
const PRODUCTION_HOST = "ep-dry-wildflower-awib0vvd-pooler.c-12.us-east-1.aws.neon.tech";
const AMBIENT_URL = "postgres://user:pass@ep-other-project-pooler.c-12.us-east-1.aws.neon.tech/db";

describe("assertDatabaseConnectionAllowed", () => {
  it("refuses a URL whose host was never declared", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({ DATABASE_URL: AMBIENT_URL });
    }).toThrow(DatabaseConnectionNotAllowedError);
  });

  it("refuses a URL whose host differs from DATABASE_RESET_ALLOWED_HOST", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: AMBIENT_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
      });
    }).toThrow(DatabaseConnectionNotAllowedError);
  });

  it("refuses when DATABASE_URL is missing or not a valid URL", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({ DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST });
    }).toThrow(DatabaseConnectionNotAllowedError);
    expect(() => {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: "not a url",
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
      });
    }).toThrow(DatabaseConnectionNotAllowedError);
  });

  it("allows the declared non-production host", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: PREVIEW_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
        DATABASE_PRODUCTION_HOST: PRODUCTION_HOST,
      });
    }).not.toThrow();
  });

  it("matches the declared host after normalisation", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: PREVIEW_URL.replace(PREVIEW_HOST, PREVIEW_HOST.toUpperCase()),
        DATABASE_RESET_ALLOWED_HOST: `${PREVIEW_HOST.replace("-pooler", "")}.`,
      });
    }).not.toThrow();
  });

  it("refuses the production host by default even when it is also the allowed host", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: PRODUCTION_URL,
        DATABASE_RESET_ALLOWED_HOST: PRODUCTION_HOST,
        DATABASE_PRODUCTION_HOST: PRODUCTION_HOST,
      });
    }).toThrow(DatabaseConnectionNotAllowedError);
  });

  it("allows the production host only when explicitly allowed", () => {
    expect(() => {
      assertDatabaseConnectionAllowed(
        { DATABASE_URL: PRODUCTION_URL, DATABASE_PRODUCTION_HOST: PRODUCTION_HOST },
        { allowProduction: true },
      );
    }).not.toThrow();
  });

  it("still refuses an undeclared host when production is allowed", () => {
    expect(() => {
      assertDatabaseConnectionAllowed(
        { DATABASE_URL: AMBIENT_URL, DATABASE_PRODUCTION_HOST: PRODUCTION_HOST },
        { allowProduction: true },
      );
    }).toThrow(DatabaseConnectionNotAllowedError);
  });

  it("skips the check on Vercel, where the platform injects DATABASE_URL", () => {
    expect(() => {
      assertDatabaseConnectionAllowed({ DATABASE_URL: AMBIENT_URL, VERCEL: "1" });
    }).not.toThrow();
  });

  it("never leaks the connection string in the error message", () => {
    let message = "";
    try {
      assertDatabaseConnectionAllowed({
        DATABASE_URL: AMBIENT_URL,
        DATABASE_RESET_ALLOWED_HOST: PREVIEW_HOST,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain("pass");
    expect(message).not.toContain("ep-other-project");
  });
});
