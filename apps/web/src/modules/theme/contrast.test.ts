import { contrastRatio } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { THEME_NAMES, themeRegistry } from "./tokens";

const MINIMUM_TEXT_CONTRAST = 4.5;
const MINIMUM_CHART_CONTRAST = 3;

const TEXT_TOKENS = ["ink", "muted", "accent", "accentHover", "warning", "danger"] as const;
const SURFACE_TOKENS = ["bg", "surface"] as const;
const CHART_TOKENS = ["chart1", "chart2"] as const;

describe("theme token contrast", () => {
  for (const theme of THEME_NAMES) {
    const { colors } = themeRegistry[theme];

    describe(theme, () => {
      for (const textToken of TEXT_TOKENS) {
        for (const surfaceToken of SURFACE_TOKENS) {
          it(`--${textToken} meets ${MINIMUM_TEXT_CONTRAST.toString()}:1 on --${surfaceToken}`, () => {
            const ratio = contrastRatio(colors[textToken], colors[surfaceToken]);
            expect(ratio).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
          });
        }
      }

      for (const chartToken of CHART_TOKENS) {
        it(`--${chartToken} meets ${MINIMUM_CHART_CONTRAST.toString()}:1 on --bg`, () => {
          const ratio = contrastRatio(colors[chartToken], colors.bg);
          expect(ratio).toBeGreaterThanOrEqual(MINIMUM_CHART_CONTRAST);
        });
      }
    });
  }
});
