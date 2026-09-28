import { describe, expect, it } from "vitest";

import { interpolate, interpolateAll } from "./interpolate";

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

describe("interpolateAll", () => {
  it("substitutes every placeholder in one pass", () => {
    expect(
      interpolateAll("Paired with {institution} · {account}, {date}", {
        institution: "Banco Fixture",
        account: "Conta corrente",
        date: "28/09/2026",
      }),
    ).toBe("Paired with Banco Fixture · Conta corrente, 28/09/2026");
  });

  it("does not let one value's text be mistaken for another placeholder", () => {
    expect(
      interpolateAll("Paired with {institution} · {account}, {date}", {
        institution: "Banco {date}",
        account: "Conta corrente",
        date: "28/09/2026",
      }),
    ).toBe("Paired with Banco {date} · Conta corrente, 28/09/2026");
  });

  it("leaves the template untouched when given no values", () => {
    expect(interpolateAll("No placeholders here", {})).toBe("No placeholders here");
  });
});
