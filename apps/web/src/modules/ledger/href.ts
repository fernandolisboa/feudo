import type { Kind, ProductCategoryId, YearMonth } from "@feudo/core";

export type TransactionsRoute = {
  month: YearMonth;
  accountId: string | null;
  page: number;
  uncategorizedOnly: boolean;
  category: ProductCategoryId | null;
  kind: Kind | null;
  search: string | null;
};

export const UNCATEGORIZED_FILTER = "sem";

export function transactionsRouteParams(view: TransactionsRoute): [string, string][] {
  const entries: [string, string][] = [["mes", view.month]];
  if (view.accountId) {
    entries.push(["conta", view.accountId]);
  }
  if (view.uncategorizedOnly) {
    entries.push(["categoria", UNCATEGORIZED_FILTER]);
  } else if (view.category) {
    entries.push(["categoria", view.category]);
  }
  if (view.kind) {
    entries.push(["tipo", view.kind]);
  }
  if (view.search) {
    entries.push(["busca", view.search]);
  }
  if (view.page > 1) {
    entries.push(["pagina", String(view.page)]);
  }
  return entries;
}

export function transactionsHref(view: TransactionsRoute): string {
  const params = new URLSearchParams(transactionsRouteParams(view));
  return `/transacoes?${params.toString()}`;
}
