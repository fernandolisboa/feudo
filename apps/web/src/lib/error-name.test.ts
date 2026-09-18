import { describe, expect, it } from "vitest";

import { errorName } from "./error-name";

describe("errorName", () => {
  it("returns the error's name", () => {
    const error = new Error("boom");
    error.name = "ConnectionResetError";
    expect(errorName(error)).toBe("ConnectionResetError");
  });

  it("returns UnknownError for a thrown non-Error value", () => {
    expect(errorName("not an error")).toBe("UnknownError");
    expect(errorName(undefined)).toBe("UnknownError");
  });
});
