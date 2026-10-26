"use client";

import { useState, type ReactNode } from "react";

import { PageNav, paginationStatus } from "./page-nav";
import { PageNumbers, type PageNumberLabels } from "./page-numbers";
import { SMALLEST_PAGE_SIZE, pageAfterResize, type PageSize } from "@/lib/page-size";
import { PageSizeSelect } from "./page-size-select";
import { Table, TableBody, TableHeader } from "./table";

export type PaginationLabels = PageNumberLabels & {
  nav: string;
  status: string;
  rowsPerPage: string;
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
          pages={
            pageCount > 1 ? (
              <PageNumbers page={page} pageCount={pageCount} labels={labels} onSelect={setPage} />
            ) : null
          }
        />
      ) : null}
    </>
  );
}
