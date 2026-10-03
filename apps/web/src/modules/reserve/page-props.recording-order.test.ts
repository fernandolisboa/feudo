import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const getViewerRoleMock = vi.hoisted(() => vi.fn());
const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const householdHasAccountsMock = vi.hoisted(() => vi.fn());
const readHouseholdDashboardLinesMock = vi.hoisted(() => vi.fn());
const getLatestIndicatorsMock = vi.hoisted(() => vi.fn());
const getUndismissedMock = vi.hoisted(() => vi.fn());
const listPositionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  canManageHouseholdSettings: () => false,
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: getHouseholdSettingsMock,
  getViewerRole: getViewerRoleMock,
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("@/modules/ledger", () => ({
  householdHasAccounts: householdHasAccountsMock,
  readHouseholdDashboardLines: readHouseholdDashboardLinesMock,
}));
vi.mock("@/modules/market-data", () => ({ getLatestIndicators: getLatestIndicatorsMock }));
vi.mock("./repository", () => ({
  createReserveMarkRepository: () => ({ listPositions: listPositionsMock }),
  createReserveTargetNoticeRepository: () => ({ getUndismissed: getUndismissedMock }),
}));

import { getReservePageProps } from "./page-props";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
  termsVersion: "test",
};
const NOW = new Date("2026-10-01T00:00:00.000Z");

function resetAll() {
  recordFinancialDataAccessMock.mockReset().mockResolvedValue(undefined);
  getViewerRoleMock.mockReset().mockResolvedValue("member");
  getHouseholdSettingsMock.mockReset().mockResolvedValue(undefined);
  getUndismissedMock.mockReset().mockResolvedValue(null);
  readHouseholdDashboardLinesMock.mockReset().mockResolvedValue({ rows: [], lines: [] });
  getLatestIndicatorsMock.mockReset().mockResolvedValue({});
  listPositionsMock.mockReset().mockResolvedValue([]);
}

// ADR-0008 (amended 2026-10-03, #27): the audit write happens after the
// read it witnesses, not concurrently with it (Promise.all).
describe("getReservePageProps recording order (unit, #27)", () => {
  it("never records access when the read fails, and the read's own error propagates", async () => {
    resetAll();
    householdHasAccountsMock.mockReset().mockRejectedValue(new Error("read failed"));

    await expect(getReservePageProps(SESSION, NOW)).rejects.toThrow("read failed");

    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records access only after the read has already resolved", async () => {
    resetAll();
    const order: string[] = [];
    householdHasAccountsMock.mockReset().mockImplementation(() => {
      order.push("read");
      return false;
    });
    recordFinancialDataAccessMock.mockReset().mockImplementation(() => {
      order.push("record");
    });

    await getReservePageProps(SESSION, NOW);

    expect(order).toEqual(["read", "record"]);
    expect(recordFinancialDataAccessMock).toHaveBeenCalledWith(SESSION, "reserve");
  });
});
