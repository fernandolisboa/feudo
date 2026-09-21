import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DUMMY_DATABASE_URL = "postgres://user:pass@localhost:5432/db";

describe("getDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("DATABASE_PRODUCTION_HOST", "");
    vi.stubEnv("DATABASE_URL", DUMMY_DATABASE_URL);
    vi.stubEnv("DATABASE_RESET_ALLOWED_HOST", "localhost");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a DATABASE_URL whose host was not declared, before opening a connection", async () => {
    vi.stubEnv("DATABASE_RESET_ALLOWED_HOST", "");

    const { getDb } = await import("./client.ts");

    expect(() => getDb()).toThrow("Database connection refused");
  });

  it("refuses an undeclared host even when Vercel system variables are present", async () => {
    vi.stubEnv("DATABASE_RESET_ALLOWED_HOST", "");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "development");

    const { getDb } = await import("./client.ts");

    expect(() => getDb()).toThrow("Database connection refused");
  });

  it("admits the declared production host only in the Vercel production runtime", async () => {
    vi.stubEnv("DATABASE_RESET_ALLOWED_HOST", "");
    vi.stubEnv("DATABASE_PRODUCTION_HOST", "localhost");

    vi.stubEnv("VERCEL_ENV", "preview");
    const preview = await import("./client.ts");
    expect(() => preview.getDb()).toThrow("Database connection refused");

    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "production");
    const production = await import("./client.ts");
    expect(() => production.getDb()).not.toThrow();
  });

  it("wires the pool error logger onto the underlying client", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { getDb } = await import("./client.ts");
    getDb();

    let emitted: boolean | undefined;
    expect(() => {
      emitted = getDb().$client.emit("error", new Error("x"));
    }).not.toThrow();

    expect(emitted).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("Neon Pool error", { name: "Error", code: undefined });

    errorSpy.mockRestore();
  });
});
