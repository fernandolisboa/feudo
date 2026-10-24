import { describe, expect, it } from "vitest";

import { PAGE_SIZE_OPTIONS, isPageSize, pageAfterResize } from "./page-size";

describe("isPageSize", () => {
  it("accepts only the offered options", () => {
    expect(PAGE_SIZE_OPTIONS.every(isPageSize)).toBe(true);
    expect([0, 1, 15, 25, 1000].some(isPageSize)).toBe(false);
  });
});

describe("pageAfterResize", () => {
  it("lands on the page that holds the first row the reader was looking at", () => {
    expect(pageAfterResize(1, 20, 50)).toBe(1);
    expect(pageAfterResize(3, 20, 50)).toBe(1);
    expect(pageAfterResize(4, 20, 50)).toBe(2);
    expect(pageAfterResize(2, 50, 10)).toBe(6);
  });

  it("keeps the first visible row on the new page for every page and size pair", () => {
    for (const from of PAGE_SIZE_OPTIONS) {
      for (const to of PAGE_SIZE_OPTIONS) {
        for (let page = 1; page <= 50; page += 1) {
          const firstRow = (page - 1) * from;
          const next = pageAfterResize(page, from, to);
          expect(firstRow).toBeGreaterThanOrEqual((next - 1) * to);
          expect(firstRow).toBeLessThan(next * to);
        }
      }
    }
  });
});
