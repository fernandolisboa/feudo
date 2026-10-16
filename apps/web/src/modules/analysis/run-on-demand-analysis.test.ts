import { describe, expect, it, vi } from "vitest";

import { encryptSecret, HOUSEHOLD_AI_KEY_PURPOSE } from "@/platform/crypto";

const readAiProviderNameMock = vi.hoisted(() => vi.fn());
const readEncryptionKeyMock = vi.hoisted(() => vi.fn());
const getAiSettingsMock = vi.hoisted(() => vi.fn());

vi.mock("./env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./env")>();
  return {
    ...actual,
    readAiProviderName: readAiProviderNameMock,
    readEncryptionKey: readEncryptionKeyMock,
  };
});
vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("./ai-settings-repository", () => ({ getAiSettings: getAiSettingsMock }));

const { runOnDemandAnalysis } = await import("./service");
const { MissingEncryptionKeyError } = await import("@/platform/encryption-key");

const ENCRYPTION_KEY = "unit-test-encryption-key-with-at-least-32-chars";
const SESSION = { householdId: "household-1" } as Parameters<typeof runOnDemandAnalysis>[0];
const DB = {} as Parameters<typeof runOnDemandAnalysis>[1];

describe("runOnDemandAnalysis", () => {
  it("returns disabled instead of throwing when createAnalysisDeps fails right after isAnalysisEnabled passed", async () => {
    readAiProviderNameMock.mockReturnValue("anthropic");
    readEncryptionKeyMock.mockReturnValueOnce(ENCRYPTION_KEY).mockImplementationOnce(() => {
      throw new MissingEncryptionKeyError();
    });
    getAiSettingsMock.mockResolvedValue({
      monthlyFamily: "opus",
      onDemandFamily: "sonnet",
      apiKeyCiphertext: encryptSecret("sk-ant-secret", ENCRYPTION_KEY, HOUSEHOLD_AI_KEY_PURPOSE),
      apiKeyLast4: "cret",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const outcome = await runOnDemandAnalysis(SESSION, DB);

    expect(outcome).toEqual({ status: "disabled" });
    warn.mockRestore();
  });
});
