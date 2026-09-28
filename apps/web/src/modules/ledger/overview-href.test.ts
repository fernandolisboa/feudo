import { describe, expect, it } from "vitest";

import { overviewHref } from "./overview-href";

describe("overviewHref", () => {
  it("always carries the month", () => {
    expect(overviewHref("2026-09")).toBe("/?mes=2026-09");
  });
});
