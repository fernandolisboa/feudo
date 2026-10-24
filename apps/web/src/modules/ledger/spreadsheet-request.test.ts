import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: vi.fn() }));
vi.mock("@/modules/households", () => ({ requireHouseholdSession: vi.fn() }));
vi.mock("./transactions-read", () => ({ readFilteredTransactions: vi.fn() }));

import type { HouseholdSession } from "@/modules/households";

import type { ResolvedLedgerRow } from "./resolve-ledger-rows";
import {
  handleTransactionsSpreadsheetRequest,
  type SpreadsheetRequestDeps,
} from "./spreadsheet-request";
import type { FilteredTransactions } from "./transactions-read";

const SESSION: HouseholdSession = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno",
  layout: "sidebar",
  termsVersion: "test",
};
const NOW = new Date("2026-10-13T12:00:00.000Z");

function ledgerRow(overrides: Partial<ResolvedLedgerRow> = {}): ResolvedLedgerRow {
  return {
    id: "tx-1",
    date: "2026-09-15",
    occurredAt: null,
    description: "PADARIA",
    amountCentavos: -1250,
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

function filtered(
  listed: ResolvedLedgerRow[],
  overrides: Partial<Pick<FilteredTransactions, "range" | "month">> = {},
): FilteredTransactions {
  return {
    currentMonth: "2026-10",
    month: "2026-09",
    range: null,
    todayIso: "2026-10-13",
    accounts: [],
    selectedAccountId: null,
    uncategorizedOnly: false,
    selectedCategory: null,
    selectedKind: null,
    searchQuery: null,
    requestedPage: 1,
    pageSize: 20,
    kinds: { overrides: new Map(), householdSubcategories: new Map() },
    monthRows: listed,
    padded: listed,
    filteredRows: listed,
    listed,
    ...overrides,
  };
}

function deps(overrides: Partial<SpreadsheetRequestDeps> = {}): SpreadsheetRequestDeps {
  return {
    getSession: vi.fn().mockResolvedValue(SESSION),
    now: () => NOW,
    readFilteredTransactions: vi.fn().mockResolvedValue(filtered([ledgerRow()])),
    recordFinancialDataAccess: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function request(query: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://feudo.test/api/transactions/spreadsheet?${query}`, {
    headers: { "sec-fetch-site": "same-origin", ...headers },
  });
}

describe("handleTransactionsSpreadsheetRequest", () => {
  it("refuses a cross-site request before reading or recording anything", async () => {
    const injected = deps();

    const response = await handleTransactionsSpreadsheetRequest(
      request("mes=2026-09", { "sec-fetch-site": "cross-site" }),
      injected,
    );

    expect(response.status).toBe(403);
    expect(injected.getSession).not.toHaveBeenCalled();
    expect(injected.readFilteredTransactions).not.toHaveBeenCalled();
    expect(injected.recordFinancialDataAccess).not.toHaveBeenCalled();
  });

  it("reads with the page's own filters from the URL and drops what it cannot use", async () => {
    const injected = deps();

    await handleTransactionsSpreadsheetRequest(
      request(
        "formato=csv&mes=2026-09&conta=acc-1&categoria=housing&tipo=fixed&busca=aluguel&pagina=3&outro=x",
      ),
      injected,
    );

    expect(injected.readFilteredTransactions).toHaveBeenCalledWith(
      SESSION,
      {
        mes: "2026-09",
        conta: "acc-1",
        categoria: "housing",
        tipo: "fixed",
        busca: "aluguel",
        de: undefined,
        ate: undefined,
      },
      NOW,
    );

    await handleTransactionsSpreadsheetRequest(
      request("formato=csv&mes=2026-9&categoria=nope&tipo=nope"),
      injected,
    );
    expect(injected.readFilteredTransactions).toHaveBeenLastCalledWith(
      SESSION,
      {
        mes: undefined,
        conta: undefined,
        categoria: undefined,
        tipo: undefined,
        busca: undefined,
        de: undefined,
        ate: undefined,
      },
      NOW,
    );
  });

  it("reads a de/ate range from the URL and names the file after it", async () => {
    const injected = deps({
      readFilteredTransactions: vi
        .fn()
        .mockResolvedValue(
          filtered([ledgerRow()], { range: { from: "2026-07-06", to: "2026-10-17" } }),
        ),
    });

    const response = await handleTransactionsSpreadsheetRequest(
      request("formato=csv&de=2026-07-06&ate=2026-10-17"),
      injected,
    );

    expect(injected.readFilteredTransactions).toHaveBeenCalledWith(
      SESSION,
      {
        mes: undefined,
        conta: undefined,
        categoria: undefined,
        tipo: undefined,
        busca: undefined,
        de: "2026-07-06",
        ate: "2026-10-17",
      },
      NOW,
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="feudo-transacoes-2026-07-06-a-2026-10-17.csv"',
    );
  });

  it("serves a CSV download named after the month, never cached", async () => {
    const response = await handleTransactionsSpreadsheetRequest(
      request("formato=csv&mes=2026-09"),
      deps(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="feudo-transacoes-2026-09.csv"',
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = new TextDecoder().decode(await response.arrayBuffer());
    expect(body).toContain(
      '15/09/2026;"PADARIA";-12,50;"BRL";"Conta corrente";"Nubank";"Sem categoria";"";""',
    );
  });

  it("exports every listed row, not just the 50 a page shows", async () => {
    const rows = Array.from({ length: 51 }, (_, index) =>
      ledgerRow({ id: `tx-${String(index)}`, description: `COMPRA ${String(index)}` }),
    );
    const response = await handleTransactionsSpreadsheetRequest(
      request("formato=csv&mes=2026-09&pagina=1"),
      deps({ readFilteredTransactions: vi.fn().mockResolvedValue(filtered(rows)) }),
    );
    const lines = new TextDecoder()
      .decode(await response.arrayBuffer())
      .trimEnd()
      .split("\r\n");

    expect(lines).toHaveLength(52);
    expect(lines[51]).toContain('"COMPRA 50"');
  });

  it("serves an .xlsx by default, including for an unknown format", async () => {
    for (const query of ["mes=2026-09", "formato=pdf&mes=2026-09"]) {
      const response = await handleTransactionsSpreadsheetRequest(request(query), deps());

      expect(response.headers.get("content-type")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(response.headers.get("content-disposition")).toBe(
        'attachment; filename="feudo-transacoes-2026-09.xlsx"',
      );
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0)).toBe("PK");
    }
  });

  it("records a transactions access only after the read succeeded", async () => {
    const order: string[] = [];
    const injected = deps({
      readFilteredTransactions: vi.fn().mockImplementation(() => {
        order.push("read");
        return Promise.resolve(filtered([ledgerRow()]));
      }),
      recordFinancialDataAccess: vi.fn().mockImplementation(() => {
        order.push("record");
        return Promise.resolve();
      }),
    });

    await handleTransactionsSpreadsheetRequest(request("formato=csv"), injected);

    expect(order).toEqual(["read", "record"]);
    expect(injected.recordFinancialDataAccess).toHaveBeenCalledWith(SESSION, "transactions");
  });

  it("records nothing when the read fails, and the read's error propagates", async () => {
    const injected = deps({
      readFilteredTransactions: vi.fn().mockRejectedValue(new Error("read failed")),
    });

    await expect(
      handleTransactionsSpreadsheetRequest(request("formato=csv"), injected),
    ).rejects.toThrow("read failed");
    expect(injected.recordFinancialDataAccess).not.toHaveBeenCalled();
  });

  it("serves no file when the audit write fails", async () => {
    const injected = deps({
      recordFinancialDataAccess: vi.fn().mockRejectedValue(new Error("audit failed")),
    });

    await expect(
      handleTransactionsSpreadsheetRequest(request("formato=xlsx"), injected),
    ).rejects.toThrow("audit failed");
  });
});
