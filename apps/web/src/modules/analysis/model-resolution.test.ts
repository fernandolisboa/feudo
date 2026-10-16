import { describe, expect, it } from "vitest";

import { PINNED_MODEL_IDS } from "./ai-client";
import { resolveModelId } from "./model-resolution";

const FULL_CAPABILITIES = {
  structured_outputs: { supported: true },
  effort: {
    supported: true,
    medium: { supported: true },
    high: { supported: true },
  },
};

function model(id: string, createdAt: string, overrides: Record<string, unknown> = {}) {
  return { id, created_at: createdAt, capabilities: FULL_CAPABILITIES, ...overrides };
}

describe("resolveModelId", () => {
  it("picks the newest qualifying id of the requested family", () => {
    const models = [
      model("claude-sonnet-5-5", "2026-06-01T00:00:00Z"),
      model("claude-sonnet-5-6", "2026-09-01T00:00:00Z"),
      model("claude-opus-5-5", "2026-10-01T00:00:00Z"),
    ];

    expect(resolveModelId(models, "sonnet", "standard")).toBe("claude-sonnet-5-6");
  });

  it("only considers ids with the family's own prefix", () => {
    const models = [
      model("claude-opus-5-9", "2026-10-01T00:00:00Z"),
      model("claude-opusx-1-0", "2026-11-01T00:00:00Z"),
    ];

    expect(resolveModelId(models, "opus", "deep")).toBe("claude-opus-5-9");
  });

  it("falls back to the pinned id when structured outputs are unsupported", () => {
    const models = [
      model("claude-sonnet-5-9", "2026-11-01T00:00:00Z", {
        capabilities: { ...FULL_CAPABILITIES, structured_outputs: { supported: false } },
      }),
    ];

    expect(resolveModelId(models, "sonnet", "standard")).toBe(PINNED_MODEL_IDS.sonnet);
  });

  it("falls back to the pinned id when the tier's own effort level is unsupported", () => {
    const models = [
      model("claude-opus-5-9", "2026-11-01T00:00:00Z", {
        capabilities: {
          ...FULL_CAPABILITIES,
          effort: { supported: true, medium: { supported: true }, high: { supported: false } },
        },
      }),
    ];

    expect(resolveModelId(models, "opus", "deep")).toBe(PINNED_MODEL_IDS.opus);
  });

  it("falls back to the pinned id when capabilities are null", () => {
    const models = [model("claude-haiku-5-9", "2026-11-01T00:00:00Z", { capabilities: null })];

    expect(resolveModelId(models, "haiku", "standard")).toBe(PINNED_MODEL_IDS.haiku);
  });

  it("falls back to the pinned id on an empty listing", () => {
    expect(resolveModelId([], "haiku", "standard")).toBe(PINNED_MODEL_IDS.haiku);
  });

  it("ignores an entry that does not match the expected shape", () => {
    const models = [
      { id: "claude-sonnet-5-9" },
      model("claude-sonnet-5-5", "2026-01-01T00:00:00Z"),
    ];

    expect(resolveModelId(models, "sonnet", "standard")).toBe("claude-sonnet-5-5");
  });
});
