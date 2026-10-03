import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const readHouseholdLedgerMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: getHouseholdSettingsMock,
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./ledger-read", () => ({ readHouseholdLedger: readHouseholdLedgerMock }));

import { getCategoriesPageProps } from "./categories-page-props";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
};
const NOW = new Date("2026-10-01T00:00:00.000Z");

function resetAll() {
  recordFinancialDataAccessMock.mockReset().mockResolvedValue(undefined);
  getHouseholdSettingsMock.mockReset().mockResolvedValue(undefined);
}

// ADR-0008 (#27): categories' audit write happens after the read it
// witnesses, not concurrently with it.
describe("getCategoriesPageProps recording order (unit, #27)", () => {
  it("never records access when the read fails, and the read's own error propagates", async () => {
    resetAll();
    readHouseholdLedgerMock.mockReset().mockRejectedValue(new Error("read failed"));

    await expect(getCategoriesPageProps(SESSION, NOW)).rejects.toThrow("read failed");

    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records access only after the read has already resolved", async () => {
    resetAll();
    const order: string[] = [];
    readHouseholdLedgerMock.mockReset().mockImplementation(() => {
      order.push("read");
      return {
        kinds: { overrides: new Map(), householdSubcategories: new Map() },
        rules: [],
        rows: [],
        padded: [],
      };
    });
    recordFinancialDataAccessMock.mockReset().mockImplementation(() => {
      order.push("record");
    });

    await getCategoriesPageProps(SESSION, NOW);

    expect(order).toEqual(["read", "record"]);
    expect(recordFinancialDataAccessMock).toHaveBeenCalledWith(SESSION, "categories");
  });
});
