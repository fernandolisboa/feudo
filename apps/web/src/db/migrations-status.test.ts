import { describe, expect, it, vi } from "vitest";

import type { Database } from "./client.ts";
import {
  evaluateMigrationsStatus,
  getExpectedMigrations,
  getMigrationsStatus,
} from "./migrations-status";

describe("evaluateMigrationsStatus", () => {
  it("reports up-to-date when applied timestamps match the journal exactly", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000, 1_700_000_001_000],
      [1_700_000_000_000, 1_700_000_001_000],
    );

    expect(status).toBe("up-to-date");
  });

  it("reports up-to-date when nothing is expected and nothing is applied", () => {
    expect(evaluateMigrationsStatus([], [])).toBe("up-to-date");
  });

  it("reports behind when a journal timestamp is missing from the applied rows", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000],
      [1_700_000_000_000, 1_700_000_001_000],
    );

    expect(status).toBe("behind");
  });

  it("reports ahead when the applied rows include a timestamp absent from the journal", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000, 1_700_000_002_000],
      [1_700_000_000_000, 1_700_000_001_000],
    );

    expect(status).toBe("ahead");
  });

  it("reports ahead, not behind, when a historical row was replaced with a different timestamp", () => {
    const status = evaluateMigrationsStatus([1_650_000_000_000], [1_700_000_000_000]);

    expect(status).toBe("ahead");
  });

  it("reports ahead when counts match but one applied timestamp is not in the journal, even though another journal timestamp is also missing", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000, 1_650_000_000_000],
      [1_700_000_000_000, 1_700_000_001_000],
    );

    expect(status).toBe("ahead");
  });

  it("reports ahead when a timestamp is duplicated in the applied rows but not in the journal", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000, 1_700_000_000_000],
      [1_700_000_000_000],
    );

    expect(status).toBe("ahead");
  });

  it("reports behind when a timestamp is duplicated in the journal but not in the applied rows", () => {
    const status = evaluateMigrationsStatus(
      [1_700_000_000_000],
      [1_700_000_000_000, 1_700_000_000_000],
    );

    expect(status).toBe("behind");
  });

  it("defaults to comparing against the committed journal when no expected list is given", () => {
    const expected = [...getExpectedMigrations()];

    expect(evaluateMigrationsStatus(expected)).toBe("up-to-date");
  });
});

describe("getExpectedMigrations", () => {
  it("reads the committed journal's entries as a list of `when` timestamps", () => {
    const expected = getExpectedMigrations();

    expect(expected.length).toBeGreaterThan(0);
    expect(expected.every((value) => typeof value === "number")).toBe(true);
  });
});

describe("getMigrationsStatus", () => {
  it("reports unknown and logs only the error name when the query fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = {
      execute: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error("secret detail"), { name: "NeonDbError" })),
    } as unknown as Database;

    const status = await getMigrationsStatus(db);

    expect(status).toBe("unknown");
    expect(consoleError).toHaveBeenCalledWith("NeonDbError");
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("secret detail"));

    consoleError.mockRestore();
  });

  it("reports behind, not unknown, when the migrations table does not exist yet", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const db = {
      execute: vi.fn().mockRejectedValue(
        Object.assign(new Error('relation "drizzle.__drizzle_migrations" does not exist'), {
          name: "NeonDbError",
          code: "42P01",
        }),
      ),
    } as unknown as Database;

    const status = await getMigrationsStatus(db);

    expect(status).toBe("behind");
    expect(consoleError).toHaveBeenCalledWith("NeonDbError");

    consoleError.mockRestore();
  });
});
