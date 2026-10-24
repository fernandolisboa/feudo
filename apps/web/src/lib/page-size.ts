export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const SMALLEST_PAGE_SIZE: PageSize = PAGE_SIZE_OPTIONS[0];

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

// The page that still holds the first row the reader was looking at.
export function pageAfterResize(page: number, from: PageSize, to: PageSize): number {
  return Math.floor(((page - 1) * from) / to) + 1;
}
