import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import {
  spreadsheetFilename,
  toCsv,
  toSpreadsheetRows,
  toXlsx,
  type SpreadsheetRow,
} from "./spreadsheet";
import { buildTaxonomyView } from "./taxonomy-view";

const TAXONOMY = buildTaxonomyView({ overrides: new Map(), householdSubcategories: new Map() });

function ledgerRow(overrides: Partial<ResolvedLedgerRow> = {}): ResolvedLedgerRow {
  return {
    id: "tx-1",
    date: "2026-09-15",
    occurredAt: null,
    description: "MERCADO BOM PRECO",
    amountCentavos: -123456,
    currency: "BRL",
    type: "debit",
    providerCategory: null,
    accountId: "acc-1",
    accountName: "Conta corrente",
    institutionName: "Nubank",
    accountType: "checking",
    counterpartDocumentHash: null,
    counterpartType: null,
    accountHolderDocumentHash: null,
    manual: null,
    transferMark: null,
    categorization: null,
    kind: null,
    internalTransfer: null,
    ...overrides,
  };
}

function row(overrides: Partial<SpreadsheetRow> = {}): SpreadsheetRow {
  return {
    date: "2026-09-15",
    description: "MERCADO BOM PRECO",
    amountCentavos: -123456,
    currency: "BRL",
    accountName: "Conta corrente",
    institutionName: "Nubank",
    category: "Alimentação",
    subcategory: "Supermercado",
    kind: "Variável",
    ...overrides,
  };
}

function csvLines(csv: string): string[] {
  return csv.slice(1).split("\r\n");
}

describe("toSpreadsheetRows", () => {
  it("labels a categorized row with its category, subcategory and kind in pt-BR", () => {
    const groceries = TAXONOMY.categories
      .flatMap((category) => category.subcategories)
      .find((subcategory) => subcategory.ref.type === "product");
    if (!groceries) throw new Error("taxonomy has no product subcategory");

    const [mapped] = toSpreadsheetRows(
      [
        ledgerRow({
          categorization: { subcategory: groceries.ref, source: "manual", ruleId: null },
          kind: "variable",
        }),
      ],
      TAXONOMY,
    );

    const label = TAXONOMY.labelOf(groceries.ref);
    expect(mapped).toEqual({
      date: "2026-09-15",
      description: "MERCADO BOM PRECO",
      amountCentavos: -123456,
      currency: "BRL",
      accountName: "Conta corrente",
      institutionName: "Nubank",
      category: label?.categoryLabel,
      subcategory: label?.label,
      kind: "Variável",
    });
  });

  it("marks an uncategorized row as such and leaves subcategory and kind empty", () => {
    const [mapped] = toSpreadsheetRows([ledgerRow()], TAXONOMY);

    expect(mapped).toMatchObject({ category: "Sem categoria", subcategory: "", kind: "" });
  });
});

describe("toCsv", () => {
  it("starts with a UTF-8 BOM and a pt-BR header separated by semicolons", () => {
    const csv = toCsv([]);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csvLines(csv)[0]).toBe(
      '"Data";"Descrição";"Valor";"Moeda";"Conta";"Banco";"Categoria";"Subcategoria";"Tipo"',
    );
  });

  it("writes the household day as dd/mm/yyyy and the amount with a decimal comma and no thousands mark", () => {
    const csv = toCsv([row()]);

    expect(csvLines(csv)[1]).toBe(
      '15/09/2026;"MERCADO BOM PRECO";-1234,56;"BRL";"Conta corrente";"Nubank";"Alimentação";"Supermercado";"Variável"',
    );
  });

  it.each([
    [0, "0,00"],
    [5, "0,05"],
    [-5, "-0,05"],
    [100, "1,00"],
    [-99, "-0,99"],
    [123456789012, "1234567890,12"],
  ])("formats %i centavos as %s without going through a float", (centavos, expected) => {
    expect(csvLines(toCsv([row({ amountCentavos: centavos })]))[1]?.split(";")[2]).toBe(expected);
  });

  it("quotes a field holding a separator, a quote or a line break, doubling the quotes", () => {
    const csv = toCsv([row({ description: 'PIX "ANA"; ALUGUEL\nSETEMBRO' })]);

    expect(csv).toContain(';"PIX ""ANA""; ALUGUEL\nSETEMBRO";');
  });

  it.each(['=HYPERLINK("x")', "+55 11", "-PIX", "@SUM(A1)", "\tTAB"])(
    "neutralizes %j so the spreadsheet reads it as text, not a formula",
    (description) => {
      const [, line] = csvLines(toCsv([row({ description, subcategory: description })]));
      const fields = line?.split(";") ?? [];

      expect(fields[1]?.startsWith(`"'`)).toBe(true);
      expect(fields[7]?.startsWith(`"'`)).toBe(true);
    },
  );

  it("quotes every text field, so a comma-splitting spreadsheet keeps a formula after a comma inside the cell", () => {
    const [, line] = csvLines(
      toCsv([row({ description: 'PIX RECEBIDO X,=HYPERLINK("https://example.com","Clique")' })]),
    );

    expect(line?.split(";")[1]).toBe(
      '"PIX RECEBIDO X,=HYPERLINK(""https://example.com"",""Clique"")"',
    );
  });

  it("keeps a negative amount numeric, never prefixed as text", () => {
    expect(csvLines(toCsv([row({ amountCentavos: -1000 })]))[1]?.split(";")[2]).toBe("-10,00");
  });

  it("ends every line with CRLF, the last one included", () => {
    const csv = toCsv([row(), row()]);

    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csvLines(csv)).toHaveLength(4);
  });
});

describe("toXlsx", () => {
  async function sheetFiles(rows: SpreadsheetRow[]) {
    const files = unzipSync(new Uint8Array(await toXlsx(rows)));
    const text = (name: string) => {
      const file = files[name];
      return file ? strFromU8(file) : "";
    };
    return {
      names: Object.keys(files),
      sheet: text("xl/worksheets/sheet1.xml"),
      sharedStrings: text("xl/sharedStrings.xml"),
      workbook: text("xl/workbook.xml"),
      styles: text("xl/styles.xml"),
    };
  }

  it("writes a valid workbook named Transações with a frozen header row", async () => {
    const { names, workbook, sheet } = await sheetFiles([row()]);

    expect(names).toContain("[Content_Types].xml");
    expect(workbook).toContain('name="Transações"');
    expect(sheet).toMatch(/<pane[^>]*ySplit="1"/);
  });

  it("stores the amount as a number Excel can sum and the date as a real date", async () => {
    const { sheet, styles } = await sheetFiles([
      row({ date: "2026-09-15", amountCentavos: -123456 }),
    ]);

    expect(sheet).toContain("<v>-1234.56</v>");
    // 46280 is 15/09/2026 as an Excel serial day.
    expect(sheet).toContain("<v>46280</v>");
    expect(styles).toContain('formatCode="dd/mm/yyyy"');
    expect(styles).toContain('formatCode="#,##0.00"');
  });

  it("stores text as text, so a description starting with = is never a formula", async () => {
    const { sheet, sharedStrings } = await sheetFiles([row({ description: "=1+1" })]);

    expect(sheet).not.toContain("<f>");
    expect(`${sheet}${sharedStrings}`).toContain("=1+1");
  });
});

describe("spreadsheetFilename", () => {
  it("names the file after the month and the format", () => {
    expect(spreadsheetFilename({ month: "2026-09" }, "xlsx")).toBe("feudo-transacoes-2026-09.xlsx");
    expect(spreadsheetFilename({ month: "2026-09" }, "csv")).toBe("feudo-transacoes-2026-09.csv");
  });

  it("names the file after the range's from and to dates and the format", () => {
    expect(spreadsheetFilename({ range: { from: "2026-07-06", to: "2026-10-17" } }, "xlsx")).toBe(
      "feudo-transacoes-2026-07-06-a-2026-10-17.xlsx",
    );
  });
});
