import { describe, expect, it } from "vitest";

import { formatShortDate } from "./format-date";

describe("formatShortDate", () => {
  it("formats an instant in the household's own time zone, not UTC", () => {
    const instant = new Date("2026-09-11T00:30:00Z");

    expect(formatShortDate(instant, "America/Sao_Paulo")).toBe("10/09/2026");
    expect(formatShortDate(instant, "UTC")).toBe("11/09/2026");
  });
});
