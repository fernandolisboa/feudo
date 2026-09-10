import { describe, expect, it } from "vitest";

import { evaluateMigrationsStatus, getExpectedMigrations } from "./migrations-status";

describe("evaluateMigrationsStatus", () => {
  it("reports up to date when applied count and latest timestamp match the journal", () => {
    const status = evaluateMigrationsStatus(
      { count: 3, latestCreatedAt: 1_700_000_000_000 },
      { count: 3, latestWhen: 1_700_000_000_000 },
    );

    expect(status).toEqual({ applied: 3, expected: 3, upToDate: true });
  });

  it("reports behind when the applied count is lower than the journal's", () => {
    const status = evaluateMigrationsStatus(
      { count: 2, latestCreatedAt: 1_600_000_000_000 },
      { count: 3, latestWhen: 1_700_000_000_000 },
    );

    expect(status).toEqual({ applied: 2, expected: 3, upToDate: false });
  });

  it("reports behind when the counts match but the latest timestamp differs", () => {
    const status = evaluateMigrationsStatus(
      { count: 3, latestCreatedAt: 1_600_000_000_000 },
      { count: 3, latestWhen: 1_700_000_000_000 },
    );

    expect(status).toEqual({ applied: 3, expected: 3, upToDate: false });
  });

  it("reports up to date when no migrations are expected and none are applied", () => {
    const status = evaluateMigrationsStatus(
      { count: 0, latestCreatedAt: null },
      { count: 0, latestWhen: null },
    );

    expect(status).toEqual({ applied: 0, expected: 0, upToDate: true });
  });
});

describe("getExpectedMigrations", () => {
  it("reads the committed journal's entry count and last entry's timestamp", () => {
    const expected = getExpectedMigrations();

    expect(expected.count).toBeGreaterThan(0);
    expect(expected.latestWhen).toBeTypeOf("number");
  });
});
