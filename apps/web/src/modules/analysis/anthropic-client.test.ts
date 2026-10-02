import { afterEach, describe, expect, it, vi } from "vitest";

const create = vi.fn<(params: unknown, options: unknown) => Promise<unknown>>();

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class FakeAnthropic {
    static APIError = actual.APIError;
    static APIConnectionTimeoutError = actual.APIConnectionTimeoutError;
    beta = { messages: { create } };
  }
  return { ...actual, default: FakeAnthropic };
});

const { APIConnectionTimeoutError, InternalServerError } = await import("@anthropic-ai/sdk");
const { createAnthropicAiClient } = await import("./anthropic-client");
const { FIXTURE_INPUT, FIXTURE_OUTPUT } = await import("./test/fixtures");

const REQUEST = {
  tier: "deep" as const,
  system: "system prompt",
  user: "user prompt",
  input: FIXTURE_INPUT,
  timeoutMs: 90_000,
};

function message(overrides: Record<string, unknown> = {}) {
  return {
    model: "claude-opus-5-5",
    stop_reason: "end_turn",
    usage: { input_tokens: 1800, output_tokens: 650 },
    content: [
      { type: "thinking", thinking: "" },
      { type: "text", text: JSON.stringify(FIXTURE_OUTPUT) },
    ],
    ...overrides,
  };
}

afterEach(() => {
  create.mockReset();
});

describe("Anthropic AI client", () => {
  it("asks the tier's model for the structured reading, with server-side fallbacks", async () => {
    create.mockResolvedValue(message());

    const result = await createAnthropicAiClient("sk-ant-test").complete(REQUEST);

    expect(result).toEqual({
      status: "ok",
      output: FIXTURE_OUTPUT,
      model: "claude-opus-5-5",
      usage: { inputTokens: 1800, outputTokens: 650 },
    });
    const [params, options] = create.mock.calls[0] ?? [];
    expect(params).toMatchObject({
      model: "claude-opus-5-5",
      system: "system prompt",
      messages: [{ role: "user", content: "user prompt" }],
      output_config: { effort: "high", format: { type: "json_schema" } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    expect(options).toEqual({ timeout: 90_000 });
  });

  it("uses Sonnet at medium effort for the standard tier", async () => {
    create.mockResolvedValue(message({ model: "claude-sonnet-5-5" }));

    await createAnthropicAiClient("sk-ant-test").complete({ ...REQUEST, tier: "standard" });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      model: "claude-sonnet-5-5",
      output_config: { effort: "medium" },
    });
  });

  it("reports a refusal and a truncated answer instead of reading their content", async () => {
    create.mockResolvedValueOnce(message({ stop_reason: "refusal" }));
    create.mockResolvedValueOnce(message({ stop_reason: "max_tokens" }));
    const client = createAnthropicAiClient("sk-ant-test");

    expect(await client.complete(REQUEST)).toMatchObject({ status: "refused" });
    expect(await client.complete(REQUEST)).toMatchObject({ status: "truncated" });
  });

  it("reports text that is not JSON as malformed", async () => {
    create.mockResolvedValue(message({ content: [{ type: "text", text: "não é JSON" }] }));

    expect(await createAnthropicAiClient("sk-ant-test").complete(REQUEST)).toMatchObject({
      status: "malformed",
      model: "claude-opus-5-5",
    });
  });

  it("maps a timeout and an API error to typed failures", async () => {
    create.mockRejectedValueOnce(new APIConnectionTimeoutError());
    create.mockRejectedValueOnce(new InternalServerError(500, undefined, "boom", new Headers()));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const client = createAnthropicAiClient("sk-ant-test");

    expect(await client.complete(REQUEST)).toEqual({
      status: "timed_out",
      model: null,
      usage: null,
    });
    expect(await client.complete(REQUEST)).toEqual({
      status: "unavailable",
      model: null,
      usage: null,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("500"));
    warn.mockRestore();
  });
});
