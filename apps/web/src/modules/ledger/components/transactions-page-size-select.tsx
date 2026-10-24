"use client";

import { useRouter } from "next/navigation";

import { pageAfterResize } from "@/ui/page-size";
import { PageSizeSelect } from "@/ui/page-size-select";

import { transactionsHref, type TransactionsRoute } from "../href";
import { t } from "../strings";

export function TransactionsPageSizeSelect({ route }: { route: TransactionsRoute }) {
  const router = useRouter();

  return (
    <PageSizeSelect
      label={t.pagination.rowsPerPage}
      value={route.pageSize}
      onChange={(pageSize) => {
        router.push(
          transactionsHref({
            ...route,
            pageSize,
            page: pageAfterResize(route.page, route.pageSize, pageSize),
          }),
        );
      }}
    />
  );
}
