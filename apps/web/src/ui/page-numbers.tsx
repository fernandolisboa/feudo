import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { interpolate } from "@/lib/interpolate";
import { pageItems, type PageItemVisibility } from "@/lib/page-items";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type PageNumberLabels = {
  previous: string;
  next: string;
  page: string;
};

type PageTarget = { hrefFor: (page: number) => string } | { onSelect: (page: number) => void };

const VISIBILITY_CLASS: Record<PageItemVisibility, string> = {
  always: "",
  wide: "max-sm:hidden",
  narrow: "sm:hidden",
};

function PageButton({
  page,
  target,
  className,
  children,
  ...props
}: {
  page: number;
  target: PageTarget;
  className?: string;
  children: ReactElement | string;
  variant: "ghost" | "outline";
  "aria-label": string;
  "aria-current"?: "page";
}) {
  if ("hrefFor" in target) {
    return (
      <Button
        size="icon-sm"
        className={className}
        render={<Link href={target.hrefFor(page)} />}
        {...props}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button
      size="icon-sm"
      className={className}
      onClick={() => {
        target.onSelect(page);
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function ArrowButton({
  page,
  pageCount,
  target,
  label,
  children,
}: {
  page: number;
  pageCount: number;
  target: PageTarget;
  label: string;
  children: ReactElement;
}) {
  if (page < 1 || page > pageCount) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label={label} focusableWhenDisabled disabled>
        {children}
      </Button>
    );
  }
  return (
    <PageButton page={page} target={target} variant="ghost" aria-label={label}>
      {children}
    </PageButton>
  );
}

export function PageNumbers({
  page,
  pageCount,
  labels,
  ...target
}: { page: number; pageCount: number; labels: PageNumberLabels } & PageTarget) {
  return (
    <ul className="flex items-center gap-0 sm:gap-1">
      <li>
        <ArrowButton page={page - 1} pageCount={pageCount} target={target} label={labels.previous}>
          <ChevronLeft />
        </ArrowButton>
      </li>
      {pageItems(page, pageCount).map((item) =>
        item.kind === "gap" ? (
          <li
            key={`gap-${String(item.after)}`}
            aria-hidden="true"
            className={cn(
              "text-muted-foreground w-6 text-center sm:w-11 md:w-9",
              VISIBILITY_CLASS[item.visibility],
            )}
          >
            …
          </li>
        ) : (
          <li key={item.page} className={VISIBILITY_CLASS[item.visibility]}>
            <PageButton
              page={item.page}
              target={target}
              variant={item.page === page ? "outline" : "ghost"}
              aria-label={interpolate(labels.page, "{page}", String(item.page))}
              aria-current={item.page === page ? "page" : undefined}
              className={cn("tabular-nums", item.page === page && "font-semibold")}
            >
              {String(item.page)}
            </PageButton>
          </li>
        ),
      )}
      <li>
        <ArrowButton page={page + 1} pageCount={pageCount} target={target} label={labels.next}>
          <ChevronRight />
        </ArrowButton>
      </li>
    </ul>
  );
}
