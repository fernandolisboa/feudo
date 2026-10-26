export type PageItemVisibility = "always" | "wide" | "narrow";

export type PageItem =
  | { kind: "page"; page: number; visibility: PageItemVisibility }
  | { kind: "gap"; after: number; visibility: PageItemVisibility };

type Window = { slots: number; showAllUpTo: number };

// Slots count page numbers and gaps alike, so the strip keeps one width while
// the reader moves through the pages. On a phone (360px, 44px targets) only
// four numbers fit beside the arrows, hence five slots and all pages up to four.
const WIDE: Window = { slots: 7, showAllUpTo: 7 };
const NARROW: Window = { slots: 5, showAllUpTo: 4 };

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function visiblePages(current: number, count: number, { slots, showAllUpTo }: Window) {
  if (count <= showAllUpTo) {
    return range(1, count);
  }
  const middle = slots - 4;
  const start = current - Math.floor((middle - 1) / 2);
  const end = start + middle - 1;
  if (start <= 3) {
    return [...range(1, slots - 2), count];
  }
  if (end >= count - 2) {
    return [1, ...range(count - slots + 3, count)];
  }
  return [1, ...range(start, end), count];
}

function visibility(wide: boolean, narrow: boolean): PageItemVisibility {
  if (wide && narrow) {
    return "always";
  }
  return wide ? "wide" : "narrow";
}

function hasGapAfter(page: number, pages: readonly number[]): boolean {
  const next = pages.find((candidate) => candidate > page);
  return pages.includes(page) && next !== undefined && next > page + 1;
}

export function pageItems(current: number, count: number): PageItem[] {
  const page = Math.min(Math.max(current, 1), count);
  const wide = visiblePages(page, count, WIDE);
  const narrow = visiblePages(page, count, NARROW);
  const pages = [...new Set([...wide, ...narrow])].sort((a, b) => a - b);
  return pages.flatMap((shown): PageItem[] => {
    const item: PageItem = {
      kind: "page",
      page: shown,
      visibility: visibility(wide.includes(shown), narrow.includes(shown)),
    };
    const wideGap = hasGapAfter(shown, wide);
    const narrowGap = hasGapAfter(shown, narrow);
    if (!wideGap && !narrowGap) {
      return [item];
    }
    return [item, { kind: "gap", after: shown, visibility: visibility(wideGap, narrowGap) }];
  });
}
