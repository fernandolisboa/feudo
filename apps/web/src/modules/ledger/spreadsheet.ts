import type { YearMonth } from "@feudo/core";
import writeXlsxFile, { type Row } from "write-excel-file/node";

import { formatIsoDate } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";

import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import { t } from "./strings";
import type { TaxonomyView } from "./taxonomy-view";

export const SPREADSHEET_FORMATS = ["xlsx", "csv"] as const;
export type SpreadsheetFormat = (typeof SPREADSHEET_FORMATS)[number];

export type SpreadsheetRow = {
  date: string;
  description: string;
  amountCentavos: number;
  currency: string;
  accountName: string;
  institutionName: string;
  category: string;
  subcategory: string;
  kind: string;
};

const COLUMNS = [
  { key: "date", width: 12 },
  { key: "description", width: 40 },
  { key: "amount", width: 14 },
  { key: "currency", width: 8 },
  { key: "account", width: 24 },
  { key: "institution", width: 20 },
  { key: "category", width: 22 },
  { key: "subcategory", width: 26 },
  { key: "kind", width: 14 },
] as const satisfies readonly { key: keyof typeof t.spreadsheet.columns; width: number }[];

const HEADERS = COLUMNS.map((column) => t.spreadsheet.columns[column.key]);

export const SPREADSHEET_CONTENT_TYPES: Record<SpreadsheetFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
};

export function toSpreadsheetRows(
  rows: readonly ResolvedLedgerRow[],
  taxonomy: TaxonomyView,
): SpreadsheetRow[] {
  return rows.map((row) => {
    const label = row.categorization ? taxonomy.labelOf(row.categorization.subcategory) : null;
    return {
      date: row.date,
      description: row.description,
      amountCentavos: row.amountCentavos,
      currency: row.currency,
      accountName: row.accountName,
      institutionName: row.institutionName,
      category: label?.categoryLabel ?? t.category.uncategorized,
      subcategory: label?.label ?? "",
      kind: row.kind ? t.kinds[row.kind] : "",
    };
  });
}

export function spreadsheetFilename(month: YearMonth, format: SpreadsheetFormat): string {
  return `${interpolate(t.spreadsheet.filename, "{month}", month)}.${format}`;
}

// Excel in pt-BR (the household's locale) splits a CSV on ";" and reads "," as
// the decimal mark; the BOM is what makes it decode the file as UTF-8 rather
// than Windows-1252, which would garble every accent.
const CSV_BOM = "﻿";
const CSV_SEPARATOR = ";";
const CSV_LINE_BREAK = "\r\n";

// A text cell that starts with one of these is run as a formula when the file
// is opened (OWASP "CSV injection"): descriptions come from the bank and
// subcategory names from any member, so neither is trusted. The leading
// apostrophe makes the spreadsheet read the cell as text.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

// Every text field is quoted, so a spreadsheet set to split on "," (en-US
// regional settings) still keeps "X,=HYPERLINK(...)" in one cell instead of
// starting a new one with the formula.
function csvText(value: string): string {
  const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

function csvAmount(amountCentavos: number): string {
  const sign = amountCentavos < 0 ? "-" : "";
  const absolute = Math.abs(amountCentavos);
  const units = Math.trunc(absolute / 100);
  const cents = String(absolute % 100).padStart(2, "0");
  return `${sign}${String(units)},${cents}`;
}

export function toCsv(rows: readonly SpreadsheetRow[]): string {
  const lines = [
    HEADERS.map(csvText).join(CSV_SEPARATOR),
    ...rows.map((row) =>
      [
        formatIsoDate(row.date),
        csvText(row.description),
        csvAmount(row.amountCentavos),
        csvText(row.currency),
        csvText(row.accountName),
        csvText(row.institutionName),
        csvText(row.category),
        csvText(row.subcategory),
        csvText(row.kind),
      ].join(CSV_SEPARATOR),
    ),
  ];
  return `${CSV_BOM}${lines.join(CSV_LINE_BREAK)}${CSV_LINE_BREAK}`;
}

function utcDateOf(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

const XLSX_AMOUNT_FORMAT = "#,##0.00";
const XLSX_DATE_FORMAT = "dd/mm/yyyy";

export async function toXlsx(rows: readonly SpreadsheetRow[]): Promise<Buffer> {
  const header: Row = HEADERS.map((value) => ({ value, type: String, fontWeight: "bold" }));
  const body: Row[] = rows.map((row) => [
    { value: utcDateOf(row.date), type: Date, format: XLSX_DATE_FORMAT },
    { value: row.description, type: String },
    // Excel stores every number as a double, so this is the one place
    // centavos become a fraction: dividing an integer below 2^53 by 100 gives
    // the double closest to the exact amount, which Excel shows unchanged at
    // two decimals and sums the same way it would a typed value.
    { value: row.amountCentavos / 100, type: Number, format: XLSX_AMOUNT_FORMAT },
    { value: row.currency, type: String },
    { value: row.accountName, type: String },
    { value: row.institutionName, type: String },
    { value: row.category, type: String },
    { value: row.subcategory, type: String },
    { value: row.kind, type: String },
  ]);
  return writeXlsxFile([header, ...body], {
    sheet: t.spreadsheet.sheetName,
    stickyRowsCount: 1,
    columns: COLUMNS.map((column) => ({ width: column.width })),
  }).toBuffer();
}
