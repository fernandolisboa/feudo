import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { attachPoolErrorLogger } from "./pool-error-logger.ts";

describe("attachPoolErrorLogger", () => {
  it("logs the error name and code without throwing", () => {
    const pool = new EventEmitter();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    attachPoolErrorLogger(pool);

    const error = Object.assign(new Error("connection to server terminated unexpectedly"), {
      code: "57P01",
    });

    expect(() => pool.emit("error", error)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("Neon Pool error", { name: "Error", code: "57P01" });

    errorSpy.mockRestore();
  });

  it("does not throw and still logs when the error has no code", () => {
    const pool = new EventEmitter();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    attachPoolErrorLogger(pool);

    expect(() => pool.emit("error", new Error("idle client timeout"))).not.toThrow();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("Neon Pool error", {
      name: "Error",
      code: undefined,
    });

    errorSpy.mockRestore();
  });
});
