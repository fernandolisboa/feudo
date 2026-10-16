import { beforeEach, describe, expect, it, vi } from "vitest";

const requireHouseholdSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ userId: "user-1", householdId: "household-1" }),
);
const getViewerRoleMock = vi.hoisted(() => vi.fn().mockResolvedValue("owner"));
const runOnDemandAnalysisMock = vi.hoisted(() => vi.fn());
const saveAiSettingsMock = vi.hoisted(() => vi.fn());
const removeAiKeyMock = vi.hoisted(() => vi.fn());
const readAiProviderNameMock = vi.hoisted(() => vi.fn().mockReturnValue("anthropic"));
const readEncryptionKeyMock = vi.hoisted(() =>
  vi.fn().mockReturnValue("unit-test-encryption-key-with-at-least-32-chars"),
);
const createAiProviderMock = vi.hoisted(() => vi.fn().mockReturnValue({}));
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", () => ({
  requireHouseholdSession: requireHouseholdSessionMock,
  getViewerRole: getViewerRoleMock,
  canManageHouseholdSettings: (role: string) => role === "owner" || role === "admin",
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  ON_DEMAND_ANALYSES_PER_DAY: 3,
  runOnDemandAnalysis: runOnDemandAnalysisMock,
}));
vi.mock("./ai-settings", () => ({
  saveAiSettings: saveAiSettingsMock,
  removeAiKey: removeAiKeyMock,
}));
vi.mock("./env", () => ({
  readAiProviderName: readAiProviderNameMock,
  readEncryptionKey: readEncryptionKeyMock,
}));
vi.mock("./provider", () => ({ createAiProvider: createAiProviderMock }));

import { initialActionState } from "@/lib/action-state";
import { removeAiKeyAction, saveAiSettingsAction } from "./actions";
import { t } from "./strings";

beforeEach(() => {
  requireHouseholdSessionMock.mockClear();
  getViewerRoleMock.mockReset().mockResolvedValue("owner");
  runOnDemandAnalysisMock.mockReset();
  saveAiSettingsMock.mockReset();
  removeAiKeyMock.mockReset();
  readAiProviderNameMock.mockReset().mockReturnValue("anthropic");
  readEncryptionKeyMock
    .mockReset()
    .mockReturnValue("unit-test-encryption-key-with-at-least-32-chars");
  createAiProviderMock.mockReset().mockReturnValue({});
  revalidatePathMock.mockClear();
});

function formDataWith(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

const VALID = { apiKey: "", monthlyFamily: "opus", onDemandFamily: "sonnet" };

describe("saveAiSettingsAction", () => {
  it("rejects a key with no sk-ant- prefix before reaching the session or the service", async () => {
    const result = await saveAiSettingsAction(
      initialActionState,
      formDataWith({ ...VALID, apiKey: "not-a-key" }),
    );

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.invalidInput });
    expect(requireHouseholdSessionMock).not.toHaveBeenCalled();
    expect(saveAiSettingsMock).not.toHaveBeenCalled();
  });

  it("rejects a member before reaching the service", async () => {
    getViewerRoleMock.mockResolvedValue("member");

    const result = await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.notAllowed });
    expect(saveAiSettingsMock).not.toHaveBeenCalled();
  });

  it("allows an admin to save", async () => {
    getViewerRoleMock.mockResolvedValue("admin");
    saveAiSettingsMock.mockResolvedValue({ status: "ok" });

    const result = await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "success", message: t.aiSettings.outcomes.saved });
  });

  it("reports unavailable instead of reaching the service when the AI provider is off", async () => {
    createAiProviderMock.mockReturnValue(null);

    const result = await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.unavailable });
    expect(saveAiSettingsMock).not.toHaveBeenCalled();
  });

  it("reports unavailable instead of throwing when ENCRYPTION_KEY is missing", async () => {
    readEncryptionKeyMock.mockImplementation(() => {
      throw new Error("missing");
    });

    const result = await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.unavailable });
    expect(saveAiSettingsMock).not.toHaveBeenCalled();
  });

  it("passes a blank key as 'keep the current one' to the service", async () => {
    saveAiSettingsMock.mockResolvedValue({ status: "ok" });

    await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(saveAiSettingsMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      {},
      {},
      "unit-test-encryption-key-with-at-least-32-chars",
      {
        apiKey: null,
        monthlyFamily: "opus",
        onDemandFamily: "sonnet",
        updatedByUserId: "user-1",
      },
    );
  });

  it("passes a new key through to the service and revalidates on success", async () => {
    saveAiSettingsMock.mockResolvedValue({ status: "ok" });

    const result = await saveAiSettingsAction(
      initialActionState,
      formDataWith({ ...VALID, apiKey: "sk-ant-new-key" }),
    );

    expect(result).toEqual({ status: "success", message: t.aiSettings.outcomes.saved });
    expect(saveAiSettingsMock).toHaveBeenCalledWith(
      { householdId: "household-1" },
      {},
      {},
      "unit-test-encryption-key-with-at-least-32-chars",
      expect.objectContaining({ apiKey: "sk-ant-new-key" }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/casa");
  });

  it("reports an invalid key from the service without revalidating", async () => {
    saveAiSettingsMock.mockResolvedValue({ status: "invalid_key" });

    const result = await saveAiSettingsAction(
      initialActionState,
      formDataWith({ ...VALID, apiKey: "sk-ant-bad" }),
    );

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.invalidKey });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("reports the service's own failed outcome", async () => {
    saveAiSettingsMock.mockResolvedValue({ status: "failed" });

    const result = await saveAiSettingsAction(initialActionState, formDataWith(VALID));

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.failed });
  });
});

describe("removeAiKeyAction", () => {
  it("rejects a member", async () => {
    getViewerRoleMock.mockResolvedValue("member");

    const result = await removeAiKeyAction();

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.notAllowed });
    expect(removeAiKeyMock).not.toHaveBeenCalled();
  });

  it("removes the key for an admin and revalidates", async () => {
    getViewerRoleMock.mockResolvedValue("admin");
    removeAiKeyMock.mockResolvedValue({ status: "ok" });

    const result = await removeAiKeyAction();

    expect(result).toEqual({ status: "success", message: t.aiSettings.outcomes.removed });
    expect(removeAiKeyMock).toHaveBeenCalledWith({ householdId: "household-1" }, {}, "user-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/casa");
  });

  it("reports failed instead of throwing", async () => {
    removeAiKeyMock.mockResolvedValue({ status: "failed" });

    const result = await removeAiKeyAction();

    expect(result).toEqual({ status: "error", message: t.aiSettings.outcomes.failed });
  });
});
