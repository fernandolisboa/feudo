import { describe, expect, it } from "vitest";

import { shellLayoutEnum, themeEnum } from "@/modules/auth/schema";

import {
  colorSchemeFor,
  DEFAULT_SHELL_LAYOUT,
  DEFAULT_THEME,
  isShellLayout,
  isThemeName,
  resolveShellLayout,
  resolveTheme,
  SHELL_LAYOUTS,
  THEME_NAMES,
} from "./tokens";

describe("theme registry", () => {
  it("defaults to caderno", () => {
    expect(DEFAULT_THEME).toBe("caderno");
  });

  it("lists the light themes first, then the dark ones", () => {
    expect(THEME_NAMES).toEqual([
      "caderno",
      "painel",
      "sala",
      "varanda",
      "nitido",
      "lamparina",
      "cofre",
    ]);
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

  it("marks lamparina and cofre as dark and every other theme as light", () => {
    const dark = THEME_NAMES.filter((theme) => colorSchemeFor(theme) === "dark");
    expect(dark).toEqual(["lamparina", "cofre"]);
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

describe("shell layouts", () => {
  it("lists sidebar, topnav and dock, defaulting to sidebar", () => {
    expect(SHELL_LAYOUTS).toEqual(["sidebar", "topnav", "dock"]);
    expect(DEFAULT_SHELL_LAYOUT).toBe("sidebar");
  });

  it("recognizes every layout and rejects an unknown one", () => {
    for (const layout of SHELL_LAYOUTS) {
      expect(isShellLayout(layout)).toBe(true);
    }
    expect(isShellLayout("grid")).toBe(false);
  });

  it("resolves a stored layout, falling back to the default for anything else", () => {
    expect(resolveShellLayout("dock")).toBe("dock");
    expect(resolveShellLayout("grid")).toBe(DEFAULT_SHELL_LAYOUT);
    expect(resolveShellLayout(null)).toBe(DEFAULT_SHELL_LAYOUT);
    expect(resolveShellLayout(undefined)).toBe(DEFAULT_SHELL_LAYOUT);
  });
});

describe("database enums", () => {
  it("lists exactly the registered themes and layouts, so every value the app writes is storable", () => {
    expect([...themeEnum.enumValues].sort()).toEqual([...THEME_NAMES].sort());
    expect(shellLayoutEnum.enumValues).toEqual([...SHELL_LAYOUTS]);
  });
});
