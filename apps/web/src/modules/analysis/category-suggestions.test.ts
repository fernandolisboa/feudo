import { describe, expect, it, vi } from "vitest";

const recordFinancialDataAccessMock = vi.hoisted(() => vi.fn());
const getAiSuggestionCandidatesMock = vi.hoisted(() => vi.fn());
const clientForHouseholdMock = vi.hoisted(() => vi.fn());
const isAnalysisEnabledMock = vi.hoisted(() => vi.fn());
const repoMock = vi.hoisted(() => ({
  hasRunningSince: vi.fn(),
  countRunsOn: vi.fn(),
  readSuggestions: vi.fn(),
  reserveRun: vi.fn(),
  succeed: vi.fn(),
  fail: vi.fn(),
  saveSuggestions: vi.fn(),
  statusOf: vi.fn(),
}));
const createCategorySuggestionsRepositoryMock = vi.hoisted(() => vi.fn(() => repoMock));

vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/audit", () => ({ recordFinancialDataAccess: recordFinancialDataAccessMock }));
vi.mock("@/modules/ledger", () => ({
  getAiSuggestionCandidates: getAiSuggestionCandidatesMock,
  productSubcategoriesForPrompt: () => SUBCATEGORIES,
}));
vi.mock("@/modules/households", () => ({
  DEFAULT_TIME_ZONE: "America/Sao_Paulo",
  getHouseholdSettings: () => Promise.resolve(undefined),
  householdScope: (session: { householdId: string }) => ({ householdId: session.householdId }),
}));
vi.mock("./service", () => ({
  clientForHousehold: clientForHouseholdMock,
  isAnalysisEnabled: isAnalysisEnabledMock,
  TIMEOUT_MS: { light: 25_000, standard: 45_000, deep: 150_000 },
}));
vi.mock("./category-suggestions-repository", () => ({
  createCategorySuggestionsRepository: createCategorySuggestionsRepositoryMock,
}));

import type { HouseholdSession } from "@/modules/households";

import type { Database } from "@/platform/db/client";
import {
  requestCategorySuggestions,
  runCategorySuggestions,
  type CategorySuggestionDeps,
} from "./category-suggestions";

const SESSION: HouseholdSession = {
  userId: "user-1",
  householdId: "household-1",
  name: "Ana",
  email: "ana@example.com",
  theme: "caderno",
  layout: "sidebar",
  termsVersion: "test",
};

const NOW = new Date();
const FAR_DEADLINE = new Date(NOW.getTime() + 10 * 60_000);

const DB = { transaction: (fn: (tx: unknown) => Promise<void>) => fn({}) } as unknown as Database;

const DEPS: CategorySuggestionDeps = {
  provider: {} as CategorySuggestionDeps["provider"],
  encryptionKey: null,
  prompt: {
    version: "category-suggester-test",
    system: "system prompt",
    renderUser: () => "rendered user prompt",
  },
};

const SUBCATEGORIES = [
  { id: "shopping.other", label: "Compras · Outras", kind: "variable" as const },
];

function group(id: string, transactionIds = [id]) {
  return {
    transactionIds,
    description: "Padaria Estrela",
    type: "debit" as const,
    absoluteAmountCentavos: 1_000,
    currency: "BRL",
  };
}

function okCandidates(groups: ReturnType<typeof group>[]) {
  return { groups };
}

function fakeClient(
  suggestCategories: ReturnType<typeof vi.fn>,
  resolveModel?: ReturnType<typeof vi.fn>,
) {
  const resolve = resolveModel ?? vi.fn().mockResolvedValue("claude-haiku-5-5");
  return {
    client: { resolveModel: resolve, complete: vi.fn(), suggestCategories },
    family: () => "haiku" as const,
  };
}

function resetMocks(): void {
  vi.resetAllMocks();
  repoMock.hasRunningSince.mockResolvedValue(false);
  repoMock.countRunsOn.mockResolvedValue(0);
  repoMock.readSuggestions.mockResolvedValue(new Map());
  repoMock.reserveRun.mockResolvedValue({ status: "reserved", id: "run-1" });
  repoMock.succeed.mockResolvedValue(undefined);
  repoMock.fail.mockResolvedValue(undefined);
  repoMock.saveSuggestions.mockResolvedValue(undefined);
  repoMock.statusOf.mockResolvedValue(null);
  createCategorySuggestionsRepositoryMock.mockImplementation(() => repoMock);
  recordFinancialDataAccessMock.mockResolvedValue(undefined);
  getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([]));
  clientForHouseholdMock.mockResolvedValue(fakeClient(vi.fn()));
}

describe("requestCategorySuggestions", () => {
  it("reports disabled without reading anything when the household has no usable client", async () => {
    resetMocks();
    clientForHouseholdMock.mockResolvedValue(null);

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "disabled" });
    expect(repoMock.hasRunningSince).not.toHaveBeenCalled();
  });

  it("reports in_progress from the cheap pre-check, before reading any candidate", async () => {
    resetMocks();
    repoMock.hasRunningSince.mockResolvedValue(true);

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "in_progress" });
    expect(getAiSuggestionCandidatesMock).not.toHaveBeenCalled();
  });

  it("reports quota_exhausted from the cheap pre-check once today's runs reach the limit", async () => {
    resetMocks();
    repoMock.countRunsOn.mockResolvedValue(5);

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "quota_exhausted" });
    expect(getAiSuggestionCandidatesMock).not.toHaveBeenCalled();
  });

  it("reports nothing_to_suggest, spends no quota and writes no audit row, when there is nothing to send", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([]));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "nothing_to_suggest" });
    expect(recordFinancialDataAccessMock).not.toHaveBeenCalled();
    expect(repoMock.reserveRun).not.toHaveBeenCalled();
  });

  it("reports no_time instead of reserving a run when the deadline is too close after resolving the model", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: new Date(NOW.getTime() + 1_000),
    });

    expect(outcome).toEqual({ status: "no_time" });
    expect(repoMock.reserveRun).not.toHaveBeenCalled();
  });

  it("passes through reserveRun's own in_progress/quota_exhausted when the lock re-check loses a race", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    repoMock.reserveRun.mockResolvedValue({ status: "quota_exhausted" });

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "quota_exhausted" });
  });

  it("records access before resolving the model, and a failed record prevents any call to the AI client", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const order: string[] = [];
    const resolveModel = vi.fn(() => {
      order.push("resolveModel");
      return Promise.resolve("claude-haiku-5-5");
    });
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: { suggestions: [] },
      model: "x",
      usage: { inputTokens: 0, outputTokens: 0 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories, resolveModel));
    recordFinancialDataAccessMock.mockImplementation(() => {
      order.push("record");
      return Promise.resolve();
    });

    await requestCategorySuggestions(SESSION, DB, DEPS, { now: NOW, deadline: FAR_DEADLINE });

    expect(order).toEqual(["record", "resolveModel"]);
  });

  it("never calls the AI client when recording access throws", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn();
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));
    recordFinancialDataAccessMock.mockRejectedValue(new Error("audit failed"));

    await expect(
      requestCategorySuggestions(SESSION, DB, DEPS, { now: NOW, deadline: FAR_DEADLINE }),
    ).rejects.toThrow("audit failed");
    expect(suggestCategories).not.toHaveBeenCalled();
    expect(repoMock.reserveRun).not.toHaveBeenCalled();
  });

  it("marks the run failed, with the AI failure's own reason, and writes no suggestion", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "refused",
      model: "claude-haiku-5-5",
      usage: null,
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "failed" });
    expect(repoMock.fail).toHaveBeenCalledWith(
      expect.anything(),
      "run-1",
      expect.objectContaining({ failureReason: "refused" }),
    );
    expect(repoMock.saveSuggestions).not.toHaveBeenCalled();
  });

  it("marks the run failed with invalid_output when the answer does not match the expected shape", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: { notSuggestions: [] },
      model: "claude-haiku-5-5",
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "failed" });
    expect(repoMock.fail).toHaveBeenCalledWith(
      expect.anything(),
      "run-1",
      expect.objectContaining({ failureReason: "invalid_output" }),
    );
    expect(repoMock.saveSuggestions).not.toHaveBeenCalled();
  });

  it("stores a suggestion per group, drops invalid answers and stores null for an omitted index", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(
      okCandidates([group("t1"), group("t2"), group("t3", ["t3a", "t3b"])]),
    );
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: {
        suggestions: [
          { index: 0, subcategory: "shopping.other" },
          { index: 0, subcategory: "income.salary" },
          { index: 1, subcategory: "not-a-real-id" },
          { index: 99, subcategory: "shopping.other" },
        ],
      },
      model: "claude-haiku-5-5",
      usage: { inputTokens: 40, outputTokens: 12 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "ok", suggestedCount: 1 });
    const saved = repoMock.saveSuggestions.mock.calls[0]?.[1] as {
      promptVersion: string;
      model: string;
      answers: { transactionId: string; subcategoryId: string | null }[];
    };
    expect(saved.promptVersion).toBe("category-suggester-test");
    expect(saved.model).toBe("claude-haiku-5-5");
    expect(saved.answers).toEqual(
      expect.arrayContaining([
        { transactionId: "t1", subcategoryId: "shopping.other" },
        { transactionId: "t2", subcategoryId: null },
        { transactionId: "t3a", subcategoryId: null },
        { transactionId: "t3b", subcategoryId: null },
      ]),
    );
    expect(saved.answers).toHaveLength(4);
    expect(repoMock.succeed).toHaveBeenCalledWith(
      expect.anything(),
      "run-1",
      expect.objectContaining({ suggestedCount: 1, model: "claude-haiku-5-5" }),
    );
  });

  it("reports failed, and marks the run failed, when saving the answer throws instead of leaving it running", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: { suggestions: [{ index: 0, subcategory: "shopping.other" }] },
      model: "claude-haiku-5-5",
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));
    repoMock.saveSuggestions.mockRejectedValue(new Error("connection lost"));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "failed" });
    expect(repoMock.fail).toHaveBeenCalledWith(
      expect.anything(),
      "run-1",
      expect.objectContaining({ failureReason: "unavailable" }),
    );
  });

  it("reports ok instead of failed when the save actually committed and only the driver threw on the way back", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: { suggestions: [{ index: 0, subcategory: "shopping.other" }] },
      model: "claude-haiku-5-5",
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));
    const committedThenDroppedDb = {
      transaction: async (fn: (tx: unknown) => Promise<void>) => {
        await fn({});
        throw new Error("connection reset acknowledging commit");
      },
    } as unknown as Database;
    repoMock.statusOf.mockResolvedValue("succeeded");

    const outcome = await requestCategorySuggestions(SESSION, committedThenDroppedDb, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "ok", suggestedCount: 1 });
    expect(repoMock.fail).not.toHaveBeenCalled();
  });

  it("still reports failed when marking the run failed also throws", async () => {
    resetMocks();
    getAiSuggestionCandidatesMock.mockResolvedValue(okCandidates([group("t1")]));
    const suggestCategories = vi.fn().mockResolvedValue({
      status: "ok",
      output: { suggestions: [{ index: 0, subcategory: "shopping.other" }] },
      model: "claude-haiku-5-5",
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    clientForHouseholdMock.mockResolvedValue(fakeClient(suggestCategories));
    repoMock.saveSuggestions.mockRejectedValue(new Error("connection lost"));
    repoMock.fail.mockRejectedValue(new Error("connection lost again"));

    const outcome = await requestCategorySuggestions(SESSION, DB, DEPS, {
      now: NOW,
      deadline: FAR_DEADLINE,
    });

    expect(outcome).toEqual({ status: "failed" });
  });
});

describe("runCategorySuggestions", () => {
  it("reports disabled without building deps when the analyst is off", async () => {
    resetMocks();
    isAnalysisEnabledMock.mockResolvedValue(false);

    const outcome = await runCategorySuggestions(SESSION, DB);

    expect(outcome).toEqual({ status: "disabled" });
    expect(clientForHouseholdMock).not.toHaveBeenCalled();
  });
});
