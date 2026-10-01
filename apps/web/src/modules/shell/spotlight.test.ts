import { describe, expect, it } from "vitest";

import { SPOTLIGHT_PADDING, spotlightBox } from "./spotlight";

describe("spotlightBox", () => {
  it("pads a small target on every side", () => {
    expect(spotlightBox({ top: 100, left: 40, width: 120, height: 32 }, 800)).toEqual({
      top: 100 - SPOTLIGHT_PADDING,
      left: 40 - SPOTLIGHT_PADDING,
      width: 120 + SPOTLIGHT_PADDING * 2,
      height: 32 + SPOTLIGHT_PADDING * 2,
    });
  });

  it("cuts a target taller than half the viewport down to its top part", () => {
    const box = spotlightBox({ top: 50, left: 0, width: 600, height: 2000 }, 800);

    expect(box.top).toBe(50 - SPOTLIGHT_PADDING);
    expect(box.height).toBe(400);
  });

  it("keeps a target that fits within half the viewport whole", () => {
    expect(spotlightBox({ top: 0, left: 0, width: 10, height: 388 }, 800).height).toBe(400);
    expect(spotlightBox({ top: 0, left: 0, width: 10, height: 389 }, 800).height).toBe(400);
  });
});
