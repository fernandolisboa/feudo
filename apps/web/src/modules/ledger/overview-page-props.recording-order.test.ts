import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const listAccountsMock = vi.hoisted(() => vi.fn());
const readHouseholdDashboardLinesMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
  getHouseholdSettings: getHouseholdSettingsMock,
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
}));
vi.mock("./repository", () => ({
  createHouseholdLedgerRepository: () => ({ listAccounts: listAccountsMock }),
}));
vi.mock("./dashboard-lines", () => ({
  readHouseholdDashboardLines: readHouseholdDashboardLinesMock,
}));

import { getOverviewPageProps } from "./overview-page-props";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
  termsVersion: "test",
};
const NOW = new Date("2026-10-01T00:00:00.000Z");

// ADR-0008 (amended 2026-10-03, #27): the audit write happens after the
// read it witnesses, not concurrently with it (Promise.all), so these two
// behaviours only hold with sequential awaits.
describe("getOverviewPageProps recording order (unit, #27)", () => {
  it("never records access when the read fails, and the read's own error propagates", async () => {
    getHouseholdSettingsMock.mockReset().mockResolvedValue(undefined);
    listAccountsMock.mockReset().mockRejectedValue(new Error("read failed"));
    recordFinancialDataAccessMock.mockReset().mockResolvedValue(undefined);

    await expect(getOverviewPageProps(SESSION, {}, NOW)).rejects.toThrow("read failed");

    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records access only after the read has already resolved", async () => {
    const order: string[] = [];
    getHouseholdSettingsMock.mockReset().mockResolvedValue(undefined);
    listAccountsMock.mockReset().mockImplementation(() => {
      order.push("read");
      return [];
    });
    readHouseholdDashboardLinesMock.mockReset().mockResolvedValue({ rows: [], lines: [] });
    recordFinancialDataAccessMock.mockReset().mockImplementation(() => {
      order.push("record");
    });

    await getOverviewPageProps(SESSION, {}, NOW);

    expect(order).toEqual(["read", "record"]);
    expect(recordFinancialDataAccessMock).toHaveBeenCalledWith(SESSION, "overview");
  });
});
