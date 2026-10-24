"use client";

import { useState, type ReactNode } from "react";

import { Button } from "./button";
import { PageNav, paginationStatus } from "./page-nav";
import { Table, TableBody, TableHeader } from "./table";

export type PaginationLabels = {
  nav: string;
  status: string;
  previous: string;
  next: string;
};

export function PaginatedTable({
  header,
  rows,
  pageSize,
  labels,
  stackOnNarrow = false,
}: {
  header: ReactNode;
  rows: ReactNode[];
  pageSize: number;
  labels: PaginationLabels;
  stackOnNarrow?: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const [requestedPage, setPage] = useState(1);
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;

  return (
    <>
      <Table stackOnNarrow={stackOnNarrow}>
        <TableHeader>{header}</TableHeader>
        <TableBody>{rows.slice(start, start + pageSize)}</TableBody>
      </Table>
      {pageCount > 1 ? (
        <PageNav
          label={labels.nav}
          status={paginationStatus(labels.status, page, pageCount, rows.length)}
          previous={
            <Button
              variant="outline"
              size="sm"
              focusableWhenDisabled
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1);
              }}
            >
              {labels.previous}
            </Button>
          }
          next={
            <Button
              variant="outline"
              size="sm"
              focusableWhenDisabled
              disabled={page === pageCount}
              onClick={() => {
                setPage(page + 1);
              }}
            >
              {labels.next}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
