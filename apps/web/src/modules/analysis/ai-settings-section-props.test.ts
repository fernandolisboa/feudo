import { describe, expect, it, vi } from "vitest";

import { encryptSecret, HOUSEHOLD_AI_KEY_PURPOSE } from "@/platform/crypto";

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

const ENCRYPTION_KEY = "unit-test-encryption-key-with-at-least-32-chars";
const ANTHROPIC_ENV = { AI_PROVIDER: "anthropic", ENCRYPTION_KEY };

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

    const props = await getAiSettingsSectionProps(SESSION, ANTHROPIC_ENV);

    expect(props).toEqual({
      status: "available",
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
      apiKeyCiphertext: encryptSecret(
        "sk-ant-secret",
        ENCRYPTION_KEY,
        HOUSEHOLD_AI_KEY_PURPOSE,
        SESSION.householdId,
      ),
      apiKeyLast4: "cret",
    });

    const props = await getAiSettingsSectionProps(SESSION, ANTHROPIC_ENV);

    expect(props).toEqual({
      status: "available",
      canManage: true,
      hasKey: true,
      apiKeyLast4: "cret",
      monthlyFamily: "haiku",
      onDemandFamily: "opus",
    });
  });

  it("lets the owner manage the settings too", async () => {
    resetAll();
    getViewerRoleMock.mockResolvedValue("owner");

    const props = await getAiSettingsSectionProps(SESSION, ANTHROPIC_ENV);

    expect(props.canManage).toBe(true);
  });

  it("treats a ciphertext this deploy's key cannot open as no key, not the stale last4", async () => {
    resetAll();
    getAiSettingsMock.mockResolvedValue({
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      apiKeyCiphertext: encryptSecret(
        "sk-ant-secret",
        "a-different-key-of-32-characters",
        HOUSEHOLD_AI_KEY_PURPOSE,
        SESSION.householdId,
      ),
      apiKeyLast4: "cret",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const props = await getAiSettingsSectionProps(SESSION, ANTHROPIC_ENV);

    expect(props).toMatchObject({ status: "available", hasKey: false, apiKeyLast4: null });
    warn.mockRestore();
  });

  it("shows the read-only unavailable state when the deploy has no analyst at all", async () => {
    resetAll();

    const props = await getAiSettingsSectionProps(SESSION, { AI_PROVIDER: "off" });

    expect(props).toEqual({
      status: "unavailable",
      canManage: false,
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
    });
  });

  it("shows the read-only unavailable state when AI_PROVIDER is misconfigured, same as off", async () => {
    resetAll();

    const props = await getAiSettingsSectionProps(SESSION, { AI_PROVIDER: "not-a-real-provider" });

    expect(props).toEqual({
      status: "unavailable",
      canManage: false,
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
    });
  });

  it("shows the read-only unavailable state for the fake provider in production, same as off", async () => {
    resetAll();

    const props = await getAiSettingsSectionProps(SESSION, {
      AI_PROVIDER: "fake",
      VERCEL_ENV: "production",
    });

    expect(props).toEqual({
      status: "unavailable",
      canManage: false,
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
    });
  });
});
