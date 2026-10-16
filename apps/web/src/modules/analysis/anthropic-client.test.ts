import { afterEach, describe, expect, it, vi } from "vitest";

const create = vi.fn<(params: unknown, options: unknown) => Promise<unknown>>();
const list = vi.fn<(params?: unknown) => Iterable<unknown>>();

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class FakeAnthropic {
    static APIError = actual.APIError;
    static APIConnectionTimeoutError = actual.APIConnectionTimeoutError;
    static BadRequestError = actual.BadRequestError;
    static NotFoundError = actual.NotFoundError;
    beta = { messages: { create } };
    models = { list };
  }
  return { ...actual, default: FakeAnthropic };
});

const { BadRequestError, APIConnectionTimeoutError, InternalServerError } =
  await import("@anthropic-ai/sdk");
const { createAnthropicAiClient } = await import("./anthropic-client");
const { FIXTURE_INPUT, FIXTURE_OUTPUT } = await import("./test/fixtures");

const REQUEST = {
  tier: "deep" as const,
  family: "opus" as const,
  model: "claude-opus-5-5",
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

function modelInfo(id: string, createdAt: string) {
  return {
    id,
    created_at: createdAt,
    capabilities: {
      structured_outputs: { supported: true },
      effort: { supported: true, medium: { supported: true }, high: { supported: true } },
    },
  };
}

function* asyncList(items: unknown[]): Iterable<unknown> {
  yield* items;
}

afterEach(() => {
  create.mockReset();
  list.mockReset();
});

describe("Anthropic AI client", () => {
  it("asks the resolved model for the structured reading, with Sonnet/Opus's server-side fallback", async () => {
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

  it("requires every field the current prompt asks for", async () => {
    create.mockResolvedValue(message());

    await createAnthropicAiClient("sk-ant-test").complete(REQUEST);

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      output_config: {
        format: {
          schema: {
            required: ["summary", "reading", "banks", "tradeOffs", "counterArgument", "citedKeys"],
            additionalProperties: false,
          },
        },
      },
    });
  });

  it("uses the household's chosen family at medium effort for the standard tier", async () => {
    create.mockResolvedValue(message({ model: "claude-sonnet-5-5" }));

    await createAnthropicAiClient("sk-ant-test").complete({
      ...REQUEST,
      tier: "standard",
      family: "sonnet",
      model: "claude-sonnet-5-5",
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      model: "claude-sonnet-5-5",
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
  });

  it("sends no server-side fallback beta or fallbacks param for Haiku", async () => {
    create.mockResolvedValue(message({ model: "claude-haiku-5-5" }));

    await createAnthropicAiClient("sk-ant-test").complete({
      ...REQUEST,
      family: "haiku",
      model: "claude-haiku-5-5",
    });

    const params = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.betas).toBeUndefined();
    expect(params.fallbacks).toBeUndefined();
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

  it("retries once on the pinned id when a freshly resolved id is rejected (400)", async () => {
    create.mockRejectedValueOnce(
      new BadRequestError(400, undefined, "unknown model", new Headers()),
    );
    create.mockResolvedValueOnce(message({ model: "claude-opus-5-5" }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await createAnthropicAiClient("sk-ant-test").complete({
      ...REQUEST,
      model: "claude-opus-5-9",
    });

    expect(result).toMatchObject({ status: "ok" });
    expect(create.mock.calls[0]?.[0]).toMatchObject({ model: "claude-opus-5-9" });
    expect(create.mock.calls[1]?.[0]).toMatchObject({ model: "claude-opus-5-5" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("claude-opus-5-9"));
    expect(warn.mock.calls[0]?.[0]).not.toContain("sk-ant-test");
    warn.mockRestore();
  });

  it("never retries a 400 when the model id was already the pinned one", async () => {
    create.mockRejectedValueOnce(new BadRequestError(400, undefined, "boom", new Headers()));

    const result = await createAnthropicAiClient("sk-ant-test").complete(REQUEST);

    expect(result).toMatchObject({ status: "unavailable" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("does not retry a refusal or a plain outage on a non-pinned model", async () => {
    create.mockResolvedValueOnce(message({ model: "claude-opus-5-9", stop_reason: "refusal" }));

    const result = await createAnthropicAiClient("sk-ant-test").complete({
      ...REQUEST,
      model: "claude-opus-5-9",
    });

    expect(result).toMatchObject({ status: "refused" });
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("resolveModel", () => {
  it("lists every page of models and resolves the newest qualifying id", async () => {
    list.mockReturnValue(
      asyncList([
        modelInfo("claude-sonnet-5-5", "2026-06-01T00:00:00Z"),
        modelInfo("claude-sonnet-5-6", "2026-09-01T00:00:00Z"),
      ]),
    );

    const resolved = await createAnthropicAiClient("sk-ant-test").resolveModel(
      "sonnet",
      "standard",
    );

    expect(resolved).toBe("claude-sonnet-5-6");
  });

  it("falls back to the pinned id when the listing call fails", async () => {
    list.mockImplementation(() => {
      throw new Error("network down");
    });

    const resolved = await createAnthropicAiClient("sk-ant-test").resolveModel("haiku", "deep");

    expect(resolved).toBe("claude-haiku-5-5");
  });

  it("falls back to the pinned id when nothing qualifies", async () => {
    list.mockReturnValue(asyncList([modelInfo("claude-sonnet-4-1", "2026-01-01T00:00:00Z")]));

    const resolved = await createAnthropicAiClient("sk-ant-test").resolveModel("opus", "standard");

    expect(resolved).toBe("claude-opus-5-5");
  });
});
