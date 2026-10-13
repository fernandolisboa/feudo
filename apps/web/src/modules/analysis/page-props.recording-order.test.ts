import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const listSucceededMock = vi.hoisted(() => vi.fn());
const isAnalysisEnabledMock = vi.hoisted(() => vi.fn());

vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: () => Promise.resolve(undefined),
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  isAnalysisEnabled: isAnalysisEnabledMock,
  ON_DEMAND_ANALYSES_PER_DAY: 3,
  RUNNING_STALE_MS: 600_000,
}));
vi.mock("./repository", () => ({
  createAnalysisRepository: () => ({
    findSucceeded: () => Promise.resolve(null),
    listSucceeded: listSucceededMock,
    latestSucceeded: () => Promise.resolve(null),
    countOnDemandOn: () => Promise.resolve(0),
    hasRunningSince: () => Promise.resolve(false),
  }),
}));

import { getAnalysesPageProps } from "./page-props";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
  termsVersion: "test",
};

function resetAll() {
  isAnalysisEnabledMock.mockReset().mockReturnValue(true);
  recordFinancialDataAccessMock.mockReset().mockResolvedValue(undefined);
  listSucceededMock.mockReset().mockResolvedValue([]);
}

// ADR-0008: Análises shows the household's figures, so viewing it is logged
// as an access, after the read it witnesses.
describe("getAnalysesPageProps recording order (unit)", () => {
  it("never records access when the read fails, and the read's own error propagates", async () => {
    resetAll();
    listSucceededMock.mockRejectedValue(new Error("read failed"));

    await expect(getAnalysesPageProps(SESSION, undefined)).rejects.toThrow("read failed");

    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });

  it("records access only after the read has already resolved", async () => {
    resetAll();
    const order: string[] = [];
    listSucceededMock.mockImplementation(() => {
      order.push("read");
      return Promise.resolve([]);
    });
    recordFinancialDataAccessMock.mockImplementation(() => {
      order.push("record");
    });

    await getAnalysesPageProps(SESSION, undefined);

    expect(order).toEqual(["read", "record"]);
    expect(recordFinancialDataAccessMock).toHaveBeenCalledWith(SESSION, "analyses");
  });

  it("records nothing while the analyst is off", async () => {
    resetAll();
    isAnalysisEnabledMock.mockReturnValue(false);

    expect(await getAnalysesPageProps(SESSION, undefined)).toBeNull();
    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
  });
});
