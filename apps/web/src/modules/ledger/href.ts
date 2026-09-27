import type { YearMonth } from "@feudo/core";

export type TransactionsRoute = {
  month: YearMonth;
  accountId: string | null;
  page: number;
  uncategorizedOnly: boolean;
};

export const UNCATEGORIZED_FILTER = "sem";

export function transactionsHref(view: TransactionsRoute): string {
  const params = new URLSearchParams({ mes: view.month });
  if (view.accountId) {
    params.set("conta", view.accountId);
  }
  if (view.uncategorizedOnly) {
    params.set("categoria", UNCATEGORIZED_FILTER);
  }
  if (view.page > 1) {
    params.set("pagina", String(view.page));
  }
  return `/transacoes?${params.toString()}`;
}
