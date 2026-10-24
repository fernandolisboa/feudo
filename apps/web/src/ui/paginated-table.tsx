"use client";

import { useState, type ReactNode } from "react";

import { Button } from "./button";
import { PageNav, paginationStatus } from "./page-nav";
import { SMALLEST_PAGE_SIZE, pageAfterResize, type PageSize } from "@/lib/page-size";
import { PageSizeSelect } from "./page-size-select";
import { Table, TableBody, TableHeader } from "./table";

export type PaginationLabels = {
  nav: string;
  status: string;
  rowsPerPage: string;
  previous: string;
  next: string;
};

export function PaginatedTable({
  header,
  rows,
  pageSize: defaultPageSize,
  labels,
  stackOnNarrow = false,
}: {
  header: ReactNode;
  rows: ReactNode[];
  pageSize: PageSize;
  labels: PaginationLabels;
  stackOnNarrow?: boolean;
}) {
  const [pageSize, setPageSize] = useState<PageSize>(defaultPageSize);
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
      {rows.length > SMALLEST_PAGE_SIZE ? (
        <PageNav
          label={labels.nav}
          status={paginationStatus(labels.status, page, pageCount, rows.length)}
          pageSize={
            <PageSizeSelect
              label={labels.rowsPerPage}
              value={pageSize}
              onChange={(next) => {
                setPage(pageAfterResize(page, pageSize, next));
                setPageSize(next);
              }}
            />
          }
          previous={
            pageCount > 1 ? (
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
            ) : null
          }
          next={
            pageCount > 1 ? (
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
            ) : null
          }
        />
      ) : null}
    </>
  );
}
