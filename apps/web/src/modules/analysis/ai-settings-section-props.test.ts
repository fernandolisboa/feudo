import { describe, expect, it, vi } from "vitest";

const getAiSettingsMock = vi.hoisted(() => vi.fn());
const getViewerRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: () => Promise.resolve(undefined),
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
  canManageHouseholdSettings: (role: string) => role === "owner" || role === "admin",
  getViewerRole: getViewerRoleMock,
}));
vi.mock("./ai-settings-repository", () => ({ getAiSettings: getAiSettingsMock }));
vi.mock("./service", () => ({
  isAnalysisEnabled: vi.fn(),
  ON_DEMAND_ANALYSES_PER_DAY: 3,
  RUNNING_STALE_MS: 600_000,
}));
vi.mock("./repository", () => ({ createAnalysisRepository: () => ({}) }));
vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: vi.fn() }));

import { getAiSettingsSectionProps } from "./page-props";

const SESSION = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno" as const,
  termsVersion: "test",
};

function resetAll() {
  getViewerRoleMock.mockReset().mockResolvedValue("member");
  getAiSettingsMock.mockReset().mockResolvedValue({
    monthlyFamily: "opus",
    onDemandFamily: "sonnet",
    apiKeyCiphertext: null,
    apiKeyLast4: null,
  });
}

describe("getAiSettingsSectionProps", () => {
  it("shows the current state to a member who cannot change it", async () => {
    resetAll();

    const props = await getAiSettingsSectionProps(SESSION);

    expect(props).toEqual({
      canManage: false,
      hasKey: false,
      apiKeyLast4: null,
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
    });
  });

  it("lets an admin manage the settings and reports a registered key by its last 4 digits only", async () => {
    resetAll();
    getViewerRoleMock.mockResolvedValue("admin");
    getAiSettingsMock.mockResolvedValue({
      monthlyFamily: "haiku",
      onDemandFamily: "opus",
      apiKeyCiphertext: "encrypted",
      apiKeyLast4: "abcd",
    });

    const props = await getAiSettingsSectionProps(SESSION);

    expect(props).toEqual({
      canManage: true,
      hasKey: true,
      apiKeyLast4: "abcd",
      monthlyFamily: "haiku",
      onDemandFamily: "opus",
    });
  });

  it("lets the owner manage the settings too", async () => {
    resetAll();
    getViewerRoleMock.mockResolvedValue("owner");

    const props = await getAiSettingsSectionProps(SESSION);

    expect(props.canManage).toBe(true);
  });
});
