import { describe, expect, it } from "vitest";

import { pageItems, type PageItem } from "./page-items";

function render(items: PageItem[], view: "wide" | "narrow"): string {
  return items
    .filter((item) => item.visibility === "always" || item.visibility === view)
    .map((item) => (item.kind === "page" ? String(item.page) : "…"))
    .join(" ");
}

function shownPages(items: PageItem[], view: "wide" | "narrow"): number[] {
  return items.flatMap((item) =>
    item.kind === "page" && (item.visibility === "always" || item.visibility === view)
      ? [item.page]
      : [],
  );
}

describe("pageItems", () => {
  it("lists every page when they all fit", () => {
    expect(render(pageItems(1, 1), "wide")).toBe("1");
    expect(render(pageItems(3, 7), "wide")).toBe("1 2 3 4 5 6 7");
    expect(render(pageItems(2, 4), "narrow")).toBe("1 2 3 4");
  });

  it("keeps the first and last page and the current page's neighbours on wide screens", () => {
    expect(render(pageItems(1, 9), "wide")).toBe("1 2 3 4 5 … 9");
    expect(render(pageItems(4, 9), "wide")).toBe("1 2 3 4 5 … 9");
    expect(render(pageItems(5, 9), "wide")).toBe("1 … 4 5 6 … 9");
    expect(render(pageItems(6, 9), "wide")).toBe("1 … 5 6 7 8 9");
    expect(render(pageItems(9, 9), "wide")).toBe("1 … 5 6 7 8 9");
    expect(render(pageItems(50, 100), "wide")).toBe("1 … 49 50 51 … 100");
  });

  it("shows fewer numbers on a phone", () => {
    expect(render(pageItems(1, 9), "narrow")).toBe("1 2 3 … 9");
    expect(render(pageItems(5, 9), "narrow")).toBe("1 … 5 … 9");
    expect(render(pageItems(9, 9), "narrow")).toBe("1 … 7 8 9");
    expect(render(pageItems(3, 5), "narrow")).toBe("1 2 3 … 5");
    expect(render(pageItems(4, 5), "narrow")).toBe("1 … 3 4 5");
  });

  it("clamps a page outside the range to the nearest end", () => {
    expect(render(pageItems(0, 9), "wide")).toBe("1 2 3 4 5 … 9");
    expect(render(pageItems(12, 9), "wide")).toBe("1 … 5 6 7 8 9");
  });

  it("holds its shape for every page of every count", () => {
    for (let count = 1; count <= 40; count += 1) {
      for (let current = 1; current <= count; current += 1) {
        const items = pageItems(current, count);
        for (const [view, slots, maxNumbers] of [
          ["wide", 7, 7],
          ["narrow", 5, 4],
        ] as const) {
          const pages = shownPages(items, view);
          const shown = render(items, view).split(" ");

          expect(pages).toContain(1);
          expect(pages).toContain(count);
          expect(pages).toContain(current);
          expect(pages).toEqual([...pages].sort((a, b) => a - b));
          expect(shown.length).toBeLessThanOrEqual(slots);
          expect(pages.length).toBeLessThanOrEqual(maxNumbers);
          if (count > slots) {
            expect(shown).toHaveLength(slots);
          }
          if (view === "wide") {
            expect(pages).toContain(Math.max(current - 1, 1));
            expect(pages).toContain(Math.min(current + 1, count));
          }
          pages.slice(1).forEach((page, index) => {
            const previous = pages[index] ?? 0;
            const gapShown = shown.indexOf(String(previous)) + 1 !== shown.indexOf(String(page));
            expect(gapShown).toBe(page > previous + 1);
          });
        }
      }
    }
  });

  it("never shows an ellipsis for a single hidden page on wide screens", () => {
    for (let count = 1; count <= 40; count += 1) {
      for (let current = 1; current <= count; current += 1) {
        const pages = shownPages(pageItems(current, count), "wide");
        pages.slice(1).forEach((page, index) => {
          expect(page - (pages[index] ?? 0)).not.toBe(2);
        });
      }
    }
  });
});
