import { describe, expect, it } from "vitest";

import { saveAiSettingsFormSchema } from "./validation";

const BASE = { monthlyFamily: "opus", onDemandFamily: "sonnet" };

describe("saveAiSettingsFormSchema", () => {
  it("accepts no key: a blank field means keep the current one", () => {
    const parsed = saveAiSettingsFormSchema.safeParse({ ...BASE, apiKey: "" });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.apiKey).toBeUndefined();
  });

  it("accepts a key that looks like an Anthropic one, trimmed", () => {
    const parsed = saveAiSettingsFormSchema.safeParse({ ...BASE, apiKey: "  sk-ant-abc123  " });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.apiKey).toBe("sk-ant-abc123");
  });

  it("rejects a key with no sk-ant- prefix", () => {
    expect(saveAiSettingsFormSchema.safeParse({ ...BASE, apiKey: "not-a-key" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown family", () => {
    expect(saveAiSettingsFormSchema.safeParse({ ...BASE, monthlyFamily: "gpt" }).success).toBe(
      false,
    );
  });

  it("accepts every known family for either field", () => {
    for (const family of ["haiku", "sonnet", "opus"]) {
      expect(
        saveAiSettingsFormSchema.safeParse({ monthlyFamily: family, onDemandFamily: family })
          .success,
      ).toBe(true);
    }
  });
});
