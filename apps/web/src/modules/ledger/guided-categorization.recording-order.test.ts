import { formatMoney } from "@feudo/core";
import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const readHouseholdDashboardLinesMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: getHouseholdSettingsMock,
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./dashboard-lines", () => ({
  readHouseholdDashboardLines: readHouseholdDashboardLinesMock,
}));

import { getCategorizationNudgeProps, getGuidedCategorizationProps } from "./guided-categorization";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
  termsVersion: "test",
};
const NOW = new Date("2026-10-13T12:00:00.000Z");
const KINDS = { overrides: new Map(), householdSubcategories: new Map() };

function uncategorizedRow(id: string, amountCentavos: number) {
  return {
    id,
    date: "2026-09-10",
    occurredAt: null,
    description: "PIX RECEBIDO EMPRESA",
    amountCentavos,
    currency: "BRL",
    type: "credit" as const,
    providerCategory: null,
    accountId: "acc-1",
    accountName: "Conta",
    institutionName: "Banco",
    accountType: "checking" as const,
    counterpartDocumentHash: null,
    counterpartType: null,
    accountHolderDocumentHash: null,
    manual: null,
    transferMark: null,
    categorization: null,
    kind: null,
    internalTransfer: null,
  };
}

function resetAll() {
  recordFinancialDataAccessMock.mockReset().mockResolvedValue(undefined);
  getHouseholdSettingsMock.mockReset().mockResolvedValue(undefined);
  readHouseholdDashboardLinesMock.mockReset();
}

describe("guided categorization recording order (ADR-0008)", () => {
  it("never records access when the wizard's read fails", async () => {
    resetAll();
    readHouseholdDashboardLinesMock.mockRejectedValue(new Error("read failed"));

    await expect(getGuidedCategorizationProps(SESSION, NOW)).rejects.toThrow("read failed");
    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records a transactions access only after the wizard's read resolved", async () => {
    resetAll();
    const order: string[] = [];
    readHouseholdDashboardLinesMock.mockImplementation(() => {
      order.push("read");
      return { kinds: KINDS, rows: [uncategorizedRow("tx-1", 5000)], lines: [] };
    });
    recordFinancialDataAccessMock.mockImplementation(() => {
      order.push("record");
    });

    const props = await getGuidedCategorizationProps(SESSION, NOW);

    expect(order).toEqual(["read", "record"]);
    expect(recordFinancialDataAccessMock).toHaveBeenCalledWith(SESSION, "transactions");
    expect(props.sinceLabel).toBe("abril de 2026");
    expect(props.items.map((item) => item.id)).toEqual(["tx-1"]);
  });

  it("reads the overview's window ending on the household's current month", async () => {
    resetAll();
    readHouseholdDashboardLinesMock.mockResolvedValue({ kinds: KINDS, rows: [], lines: [] });

    await getGuidedCategorizationProps(SESSION, NOW);

    expect(readHouseholdDashboardLinesMock).toHaveBeenCalledWith(
      {},
      { householdId: "household-1" },
      "2026-10",
      "America/Sao_Paulo",
    );
  });

  it("shows no notice and records nothing when nothing is uncategorized", async () => {
    resetAll();
    readHouseholdDashboardLinesMock.mockResolvedValue({ kinds: KINDS, rows: [], lines: [] });

    await expect(getCategorizationNudgeProps(SESSION, NOW)).resolves.toBeNull();
    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records the notice's access after its read and returns count, amount and window start", async () => {
    resetAll();
    const order: string[] = [];
    readHouseholdDashboardLinesMock.mockImplementation(() => {
      order.push("read");
      return {
        kinds: KINDS,
        rows: [uncategorizedRow("tx-1", 5000), uncategorizedRow("tx-2", -2500)],
        lines: [],
      };
    });
    recordFinancialDataAccessMock.mockImplementation(() => {
      order.push("record");
    });

    const props = await getCategorizationNudgeProps(SESSION, NOW);

    expect(order).toEqual(["read", "record"]);
    expect(props).toEqual({
      count: 2,
      amountLabel: formatMoney({ amountCentavos: 7500, currency: "BRL" }),
      sinceLabel: "abril de 2026",
    });
  });
});
