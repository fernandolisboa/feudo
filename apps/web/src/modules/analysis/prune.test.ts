import { describe, expect, it, vi } from "vitest";

const deleteAttemptsOlderThanMock = vi.hoisted(() => vi.fn());
const deleteCategorySuggestionRunsOlderThanMock = vi.hoisted(() => vi.fn());
const deleteCategoryAiSuggestionsOlderThanMock = vi.hoisted(() => vi.fn());

vi.mock("./key-verification-attempts", () => ({
  deleteAttemptsOlderThan: deleteAttemptsOlderThanMock,
  USER_WINDOW_MS: 24 * 60 * 60_000,
}));
vi.mock("./category-suggestions-repository", () => ({
  deleteCategorySuggestionRunsOlderThan: deleteCategorySuggestionRunsOlderThanMock,
  deleteCategoryAiSuggestionsOlderThan: deleteCategoryAiSuggestionsOlderThanMock,
}));

import { runDailyPruneStep } from "./prune";

import type { Database } from "@/platform/db/client";

describe("runDailyPruneStep", () => {
  it("returns an error summary instead of throwing when the prune query fails", async () => {
    const db = {} as Database;
    deleteAttemptsOlderThanMock.mockImplementation(() => {
      throw new Error("connection reset");
    });

    await expect(runDailyPruneStep(db)).resolves.toEqual({ error: "Error" });
  });

  it("sums deletions across the key-verification, run and suggestion tables", async () => {
    deleteAttemptsOlderThanMock.mockResolvedValue(3);
    deleteCategorySuggestionRunsOlderThanMock.mockResolvedValue(5);
    deleteCategoryAiSuggestionsOlderThanMock.mockResolvedValue(7);

    await expect(runDailyPruneStep({} as Database)).resolves.toEqual({ deleted: 15 });
  });
});
