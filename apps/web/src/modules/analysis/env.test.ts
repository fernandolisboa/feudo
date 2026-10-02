import { describe, expect, it } from "vitest";

import { FakeAiProviderInProductionError, InvalidAiProviderError, readAiProviderName } from "./env";

describe("readAiProviderName", () => {
  it("is off without an API key, so every screen keeps working without the analyst", () => {
    expect(readAiProviderName({})).toBe("off");
    expect(readAiProviderName({ ANTHROPIC_API_KEY: "  " })).toBe("off");
  });

  it("uses Anthropic once an API key is set", () => {
    expect(readAiProviderName({ ANTHROPIC_API_KEY: "sk-ant-test" })).toBe("anthropic");
  });

  it("stays off when Anthropic is asked for but no key exists", () => {
    expect(readAiProviderName({ AI_PROVIDER: "anthropic" })).toBe("off");
  });

  it("lets AI_PROVIDER=off turn the analyst off even with a key", () => {
    expect(readAiProviderName({ AI_PROVIDER: "off", ANTHROPIC_API_KEY: "sk-ant-test" })).toBe(
      "off",
    );
  });

  it("accepts the fake outside production", () => {
    expect(readAiProviderName({ AI_PROVIDER: "fake", VERCEL_ENV: "preview" })).toBe("fake");
  });

  it("refuses the fake in production", () => {
    expect(() => readAiProviderName({ AI_PROVIDER: "fake", VERCEL_ENV: "production" })).toThrow(
      FakeAiProviderInProductionError,
    );
  });

  it("rejects an unknown provider", () => {
    expect(() => readAiProviderName({ AI_PROVIDER: "openai" })).toThrow(InvalidAiProviderError);
  });
});
