"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// stackOnNarrow turns each row into a card when the table's own box is narrow
// (globals.css, "Tables"): measured on the box, not the viewport, because the
// sidebar, top bar and dock leave different widths at the same screen size.
function Table({
  className,
  stackOnNarrow = false,
  ...props
}: React.ComponentProps<"table"> & { stackOnNarrow?: boolean }) {
  return (
    <div
      data-slot="table-container"
      data-stack={stackOnNarrow ? "" : undefined}
      className="relative w-full"
    >
      <table
        data-slot="table"
        role="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      role="rowgroup"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      role="rowgroup"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      role="row"
      className={cn(
        "hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      role="columnheader"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

// A stacked cell without a card role becomes a line led by its label; "hidden"
// is for a cell the title already repeats.
export type TableCellCard = "title" | "aside" | "actions" | "hidden";

function TableCell({
  className,
  label,
  card,
  ...props
}: React.ComponentProps<"td"> & { label?: string; card?: TableCellCard }) {
  return (
    <td
      data-slot="table-cell"
      role="cell"
      data-label={label}
      data-card={card}
      className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
