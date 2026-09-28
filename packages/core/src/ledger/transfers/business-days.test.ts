import { describe, expect, it } from "vitest";
import { businessDaysBetween } from "./business-days";

describe("businessDaysBetween", () => {
  it("is zero for the same day", () => {
    expect(businessDaysBetween("2026-09-28", "2026-09-28")).toBe(0);
  });

  it("counts Friday to the following Monday as one business day", () => {
    expect(businessDaysBetween("2026-09-25", "2026-09-28")).toBe(1);
  });

  it("counts Saturday to Sunday as zero business days", () => {
    expect(businessDaysBetween("2026-09-26", "2026-09-27")).toBe(0);
  });

  it("is symmetric regardless of argument order", () => {
    expect(businessDaysBetween("2026-09-28", "2026-09-25")).toBe(
      businessDaysBetween("2026-09-25", "2026-09-28"),
    );
  });

  it("counts every weekday strictly between two Mondays two weeks apart", () => {
    expect(businessDaysBetween("2026-09-21", "2026-10-05")).toBe(10);
  });

  it("counts a single weekday step as one business day", () => {
    expect(businessDaysBetween("2026-09-28", "2026-09-29")).toBe(1);
  });
});
