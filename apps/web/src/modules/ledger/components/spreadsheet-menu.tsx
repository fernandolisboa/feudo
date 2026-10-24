"use client";

import { Download } from "lucide-react";

import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { interpolate } from "@/lib/interpolate";

import { transactionsSpreadsheetHref, type TransactionsRoute } from "../href";
import { t } from "../strings";

export function SpreadsheetMenu({
  view,
  total,
}: {
  view: Omit<TransactionsRoute, "page">;
  total: number;
}) {
  const label =
    total === 1 ? t.spreadsheet.one : interpolate(t.spreadsheet.many, "{count}", String(total));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label={label} />}>
        <Download className="size-4" />
        <span className="md:max-xl:sr-only">{t.spreadsheet.trigger}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuItem render={<a href={transactionsSpreadsheetHref(view, "xlsx")} />}>
            {t.spreadsheet.xlsx}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={transactionsSpreadsheetHref(view, "csv")} />}>
            {t.spreadsheet.csv}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
