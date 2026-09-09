import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { contrastRatio } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { parseDataShellValues, parseThemeCssBlocks } from "./css-theme-tokens";
import { shellLayoutFor, THEME_NAMES } from "./tokens";

const GLOBALS_CSS_PATH = fileURLToPath(new URL("../../app/globals.css", import.meta.url));
const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf-8");
const themeCssBlocks = parseThemeCssBlocks(globalsCss);
const dataShellValues = parseDataShellValues(globalsCss);

const MINIMUM_TEXT_CONTRAST = 4.5;
const MINIMUM_CHART_CONTRAST = 3;

const CSS_VAR_BY_TEXT_TOKEN = {
  ink: "--ink",
  muted: "--muted",
  accent: "--accent",
  accentHover: "--accent-hover",
  warning: "--warning",
  danger: "--danger",
} as const;

const CSS_VAR_BY_SURFACE_TOKEN = {
  bg: "--bg",
  surface: "--surface",
} as const;

const CSS_VAR_BY_CHART_TOKEN = {
  chart1: "--chart-1",
  chart2: "--chart-2",
} as const;

function cssValue(theme: string, cssVar: string): string {
  const block = themeCssBlocks[theme];
  const value = block?.[cssVar];
  if (!value) {
    throw new Error(`globals.css has no ${cssVar} in [data-theme="${theme}"]`);
  }
  return value;
}

describe("theme registry and globals.css agree", () => {
  it("has a [data-theme] CSS block for every registered theme, and vice versa", () => {
    expect(Object.keys(themeCssBlocks).sort()).toEqual([...THEME_NAMES].sort());
  });

  it("defines a data-shell selector for every shell layout the registry uses", () => {
    const usedShells = new Set(THEME_NAMES.map((theme) => shellLayoutFor(theme)));
    for (const shell of usedShells) {
      expect(dataShellValues.has(shell)).toBe(true);
    }
  });
});

describe("theme token contrast (parsed from globals.css)", () => {
  for (const theme of THEME_NAMES) {
    describe(theme, () => {
      for (const [textToken, textVar] of Object.entries(CSS_VAR_BY_TEXT_TOKEN)) {
        for (const [surfaceToken, surfaceVar] of Object.entries(CSS_VAR_BY_SURFACE_TOKEN)) {
          it(`--${textToken} meets ${MINIMUM_TEXT_CONTRAST.toString()}:1 on --${surfaceToken}`, () => {
            const ratio = contrastRatio(cssValue(theme, textVar), cssValue(theme, surfaceVar));
            expect(ratio).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
          });
        }
      }

      for (const [chartToken, chartVar] of Object.entries(CSS_VAR_BY_CHART_TOKEN)) {
        it(`--${chartToken} meets ${MINIMUM_CHART_CONTRAST.toString()}:1 on --bg`, () => {
          const ratio = contrastRatio(cssValue(theme, chartVar), cssValue(theme, "--bg"));
          expect(ratio).toBeGreaterThanOrEqual(MINIMUM_CHART_CONTRAST);
        });
      }
    });
  }
});
