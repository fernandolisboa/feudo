import type { YearMonth } from "@feudo/core";

export type TransactionsView = {
  month: YearMonth;
  accountId: string | null;
  page: number;
};

export function transactionsHref(view: TransactionsView): string {
  const params = new URLSearchParams({ mes: view.month });
  if (view.accountId) {
    params.set("conta", view.accountId);
  }
  if (view.page > 1) {
    params.set("pagina", String(view.page));
  }
  return `/transacoes?${params.toString()}`;
}
