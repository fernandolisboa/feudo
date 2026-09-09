import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, isThemeName, resolveTheme, shellLayoutFor, THEME_NAMES } from "./tokens";

describe("theme registry", () => {
  it("defaults to caderno", () => {
    expect(DEFAULT_THEME).toBe("caderno");
  });

  it("lists caderno, painel and sala, in that order", () => {
    expect(THEME_NAMES).toEqual(["caderno", "painel", "sala"]);
  });

  it("recognizes every registered theme name", () => {
    for (const theme of THEME_NAMES) {
      expect(isThemeName(theme)).toBe(true);
    }
  });

  it("rejects an unknown theme name", () => {
    expect(isThemeName("neon")).toBe(false);
    expect(isThemeName("")).toBe(false);
  });

  it("places caderno and painel in a sidebar shell, and sala in a topnav shell", () => {
    expect(shellLayoutFor("caderno")).toBe("sidebar");
    expect(shellLayoutFor("painel")).toBe("sidebar");
    expect(shellLayoutFor("sala")).toBe("topnav");
  });
});

describe("resolveTheme", () => {
  it("passes through a registered theme name", () => {
    for (const theme of THEME_NAMES) {
      expect(resolveTheme(theme)).toBe(theme);
    }
  });

  it("falls back to the default theme for an unknown value", () => {
    expect(resolveTheme("neon")).toBe(DEFAULT_THEME);
  });

  it("falls back to the default theme for null or undefined", () => {
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
    expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
  });
});
