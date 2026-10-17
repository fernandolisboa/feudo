import { z } from "zod";

import { recordFinancialDataAccess } from "@/modules/audit";
import { requireHouseholdSession, type HouseholdSession } from "@/modules/households";

import {
  SPREADSHEET_CONTENT_TYPES,
  SPREADSHEET_FORMATS,
  spreadsheetFilename,
  toCsv,
  toSpreadsheetRows,
  toXlsx,
} from "./spreadsheet";
import { buildTaxonomyView } from "./taxonomy-view";
import { readFilteredTransactions, type FilteredTransactions } from "./transactions-read";
import { transactionsSearchParamsSchema, type TransactionsSearchParams } from "./validation";

const formatSchema = z.enum(SPREADSHEET_FORMATS).catch("xlsx");

// A download is a same-origin link click or a typed URL ("none"); any other
// site embedding the link gets nothing, and records no access in the
// household's log on the member's behalf.
function isCrossSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}

function searchParamsOf(url: URL): TransactionsSearchParams {
  const value = (name: string) => url.searchParams.get(name) ?? undefined;
  return transactionsSearchParamsSchema.parse({
    mes: value("mes"),
    conta: value("conta"),
    categoria: value("categoria"),
    tipo: value("tipo"),
    busca: value("busca"),
    de: value("de"),
    ate: value("ate"),
  });
}

export type SpreadsheetRequestDeps = {
  getSession: () => Promise<HouseholdSession>;
  now: () => Date;
  readFilteredTransactions: (
    session: HouseholdSession,
    searchParams: TransactionsSearchParams,
    now: Date,
  ) => Promise<FilteredTransactions>;
  recordFinancialDataAccess: (session: HouseholdSession, kind: "transactions") => Promise<void>;
};

const defaultSpreadsheetRequestDeps: SpreadsheetRequestDeps = {
  getSession: requireHouseholdSession,
  now: () => new Date(),
  readFilteredTransactions,
  recordFinancialDataAccess,
};

// Every row /transacoes lists for the same URL, on every page, as a file
// (ADR-0008): a read of the household's transactions, so it is recorded as
// kind "transactions" once the file is built, and a failed audit write
// throws before any response exists, so no file is served unwitnessed.
export async function handleTransactionsSpreadsheetRequest(
  request: Request,
  overrides: Partial<SpreadsheetRequestDeps> = {},
): Promise<Response> {
  if (isCrossSiteRequest(request.headers)) {
    return new Response(null, { status: 403 });
  }

  const deps = { ...defaultSpreadsheetRequestDeps, ...overrides };
  const session = await deps.getSession();
  const url = new URL(request.url);
  const format = formatSchema.parse(url.searchParams.get("formato"));

  const read = await deps.readFilteredTransactions(session, searchParamsOf(url), deps.now());
  const rows = toSpreadsheetRows(read.listed, buildTaxonomyView(read.kinds));
  const body = format === "xlsx" ? new Uint8Array(await toXlsx(rows)) : toCsv(rows);
  await deps.recordFinancialDataAccess(session, "transactions");
  const scope = read.range ? { range: read.range } : { month: read.month };

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": SPREADSHEET_CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${spreadsheetFilename(scope, format)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
