import { describe, expect, it } from "vitest";

import { interpolate } from "./interpolate";

describe("interpolate", () => {
  it("substitutes the placeholder with the value", () => {
    expect(interpolate("Hello, {name}.", "{name}", "Fernanda")).toBe("Hello, Fernanda.");
  });

  it("treats the value as a literal, not a replacement pattern", () => {
    expect(interpolate("Hello, {name}.", "{name}", "R$&")).toBe("Hello, R$&.");
    expect(interpolate("Hello, {name}.", "{name}", "$$")).toBe("Hello, $$.");
    expect(interpolate("Hello, {name}.", "{name}", "$1")).toBe("Hello, $1.");
  });
});
