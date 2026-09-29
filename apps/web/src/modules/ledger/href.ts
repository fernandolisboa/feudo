import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";

export type TransactionsRoute = {
  month: YearMonth;
  accountId: string | null;
  page: number;
  uncategorizedOnly: boolean;
  category?: ProductCategoryId | null;
  kind?: Kind | null;
  search?: string | null;
};

export const UNCATEGORIZED_FILTER = "sem";

export function transactionsHref(view: TransactionsRoute): string {
  const params = new URLSearchParams({ mes: view.month });
  if (view.accountId) {
    params.set("conta", view.accountId);
  }
  if (view.uncategorizedOnly) {
    params.set("categoria", UNCATEGORIZED_FILTER);
  } else if (view.category) {
    params.set("categoria", view.category);
  }
  if (view.kind) {
    params.set("tipo", view.kind);
  }
  if (view.search) {
    params.set("busca", view.search);
  }
  if (view.page > 1) {
    params.set("pagina", String(view.page));
  }
  return `/transacoes?${params.toString()}`;
}
