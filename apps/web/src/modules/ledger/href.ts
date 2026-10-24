import type { IsoDateRange, Kind, ProductCategoryId, YearMonth } from "@feudo/core";
import type { SpreadsheetFormat } from "./spreadsheet";

export type TransactionsRoute = {
  month: YearMonth;
  range: IsoDateRange | null;
  accountId: string | null;
  page: number;
  uncategorizedOnly: boolean;
  category: ProductCategoryId | null;
  kind: Kind | null;
  search: string | null;
};

export type TransactionsRouteBase = Omit<TransactionsRoute, "page">;

export const UNCATEGORIZED_FILTER = "sem";

export const MONTH_PARAM = "mes";

export const MIN_YEAR_MONTH_YEAR = 1970;

export const TRANSACTIONS_PATH = "/transacoes";

export function transactionsRouteParams(view: TransactionsRoute): [string, string][] {
  const entries: [string, string][] = view.range
    ? [
        ["de", view.range.from],
        ["ate", view.range.to],
      ]
    : [[MONTH_PARAM, view.month]];
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
  return `${TRANSACTIONS_PATH}?${params.toString()}`;
}

export const GUIDED_CATEGORIZATION_PATH = "/categorizar";

export const TRANSACTIONS_SPREADSHEET_ROUTE = "/api/transactions/spreadsheet";

export function transactionsSpreadsheetHref(
  view: TransactionsRouteBase,
  format: SpreadsheetFormat,
): string {
  const params = new URLSearchParams([
    ...transactionsRouteParams({ ...view, page: 1 }),
    ["formato", format],
  ]);
  return `${TRANSACTIONS_SPREADSHEET_ROUTE}?${params.toString()}`;
}

export function withMonth(href: string, month: YearMonth): string {
  const queryStart = href.indexOf("?");
  const path = queryStart === -1 ? href : href.slice(0, queryStart);
  const params = new URLSearchParams(queryStart === -1 ? "" : href.slice(queryStart + 1));
  params.set(MONTH_PARAM, month);
  return `${path}?${params.toString()}`;
}
