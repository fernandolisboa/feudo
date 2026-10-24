import type { ReactNode } from "react";

import { interpolateAll } from "@/lib/interpolate";

export function paginationStatus(
  template: string,
  page: number,
  pageCount: number,
  total: number,
): string {
  return interpolateAll(template, {
    page: String(page),
    pages: String(pageCount),
    total: String(total),
  });
}

export function PageNav({
  label,
  status,
  previous,
  next,
}: {
  label: string;
  status: string;
  previous: ReactNode;
  next: ReactNode;
}) {
  return (
    <nav aria-label={label} className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs tabular-nums" aria-live="polite">
        {status}
      </span>
      <div className="flex items-center gap-2">
        {previous}
        {next}
      </div>
    </nav>
  );
}
