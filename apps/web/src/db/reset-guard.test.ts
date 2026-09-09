import { describe, expect, it } from "vitest";

import { DatabaseResetNotAllowedError } from "./errors";
import { assertDatabaseResetAllowed } from "./reset-guard";

describe("assertDatabaseResetAllowed", () => {
  it("refuses when DATABASE_RESET_ALLOWED is not set to preview", () => {
    expect(() => {
      assertDatabaseResetAllowed({});
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("refuses when DATABASE_RESET_ALLOWED is set to something other than preview", () => {
    expect(() => {
      assertDatabaseResetAllowed({ DATABASE_RESET_ALLOWED: "yes" });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("refuses when VERCEL_ENV is production even if DATABASE_RESET_ALLOWED is set", () => {
    expect(() => {
      assertDatabaseResetAllowed({
        DATABASE_RESET_ALLOWED: "preview",
        VERCEL_ENV: "production",
      });
    }).toThrow(DatabaseResetNotAllowedError);
  });

  it("allows the reset when opted in and not production", () => {
    expect(() => {
      assertDatabaseResetAllowed({ DATABASE_RESET_ALLOWED: "preview" });
    }).not.toThrow();
  });
});
