import { describe, expect, it, vi } from "vitest";

import type { AiClient, AiRequest, AiResult } from "./ai-client";
import { CURRENT_ANALYST_PROMPT } from "./prompts";
import { generateReading, isAnalysisEnabled } from "./service";
import { FIXTURE_INPUT, FIXTURE_OUTPUT } from "./test/fixtures";

const USAGE = { inputTokens: 1000, outputTokens: 200 };

function scriptedClient(results: AiResult[]): AiClient & { requests: AiRequest[] } {
  const requests: AiRequest[] = [];
  const queue = [...results];
  return {
    requests,
    complete(request) {
      requests.push(request);
      const next = queue.shift();
      if (!next) {
        throw new Error("no scripted result left");
      }
      return Promise.resolve(next);
    },
  };
}

function ok(output: unknown, model = "claude-sonnet-5-5"): AiResult {
  return { status: "ok", output, model, usage: USAGE };
}

const FAR_DEADLINE = () => new Date(Date.now() + 10 * 60_000);

describe("generateReading", () => {
  it("returns a reading whose every number comes from the input", async () => {
    const client = scriptedClient([ok(FIXTURE_OUTPUT)]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "standard",
      FAR_DEADLINE(),
    );

    expect(result).toEqual({
      status: "succeeded",
      output: FIXTURE_OUTPUT,
      model: "claude-sonnet-5-5",
      usage: USAGE,
    });
    expect(client.requests).toHaveLength(1);
    expect(client.requests[0]?.system).toBe(CURRENT_ANALYST_PROMPT.system);
    expect(client.requests[0]?.tier).toBe("standard");
  });

  it("rejects a fabricated number and asks once more, naming it", async () => {
    const fabricated = { ...FIXTURE_OUTPUT, counterArgument: "Isso pode render 3% a mais." };
    const client = scriptedClient([ok(fabricated), ok(FIXTURE_OUTPUT)]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "standard",
      FAR_DEADLINE(),
    );

    expect(result.status).toBe("succeeded");
    expect(result.usage).toEqual({ inputTokens: 2000, outputTokens: 400 });
    expect(client.requests[1]?.user).toContain("Your previous answer was rejected.");
    expect(client.requests[1]?.user).toContain("3");
  });

  it("never stores a reading that still invents a number after the retry", async () => {
    const fabricated = { ...FIXTURE_OUTPUT, reading: "A casa gastou 12,5% a mais." };
    const client = scriptedClient([ok(fabricated), ok(fabricated)]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "deep",
      FAR_DEADLINE(),
    );

    expect(result).toMatchObject({ status: "failed", reason: "contract_violation" });
    expect(client.requests).toHaveLength(2);
  });

  it("rejects a citation of a key the input does not have", async () => {
    const unknownKey = { ...FIXTURE_OUTPUT, citedKeys: ["reserve.invented"] };
    const client = scriptedClient([ok(unknownKey), ok(unknownKey)]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "standard",
      FAR_DEADLINE(),
    );

    expect(result).toMatchObject({ status: "failed", reason: "contract_violation" });
  });

  it("retries an answer that does not match the output fields", async () => {
    const client = scriptedClient([ok({ reading: "só isso" }), ok(FIXTURE_OUTPUT)]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "standard",
      FAR_DEADLINE(),
    );

    expect(result.status).toBe("succeeded");
    expect(client.requests[1]?.user).toContain("did not match the requested fields");
  });

  it("retries a malformed or truncated answer", async () => {
    const client = scriptedClient([
      { status: "truncated", model: "claude-opus-5-5", usage: USAGE },
      ok(FIXTURE_OUTPUT, "claude-opus-5-5"),
    ]);

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "deep",
      FAR_DEADLINE(),
    );

    expect(result.status).toBe("succeeded");
  });

  it("does not retry a refusal or an unavailable API", async () => {
    for (const status of ["refused", "unavailable", "timed_out"] as const) {
      const client = scriptedClient([{ status, model: null, usage: null }]);

      const result = await generateReading(
        client,
        CURRENT_ANALYST_PROMPT,
        FIXTURE_INPUT,
        "standard",
        FAR_DEADLINE(),
      );

      expect(result).toEqual({ status: "failed", reason: status, model: null, usage: null });
      expect(client.requests).toHaveLength(1);
    }
  });

  it("does not start a call it has no time left to finish", async () => {
    const client = scriptedClient([]);
    const complete = vi.spyOn(client, "complete");

    const result = await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "standard",
      new Date(Date.now() + 1_000),
    );

    expect(result).toEqual({ status: "failed", reason: "no_time", model: null, usage: null });
    expect(complete).not.toHaveBeenCalled();
  });

  it("never lets a call run past the deadline", async () => {
    const client = scriptedClient([ok(FIXTURE_OUTPUT)]);

    await generateReading(
      client,
      CURRENT_ANALYST_PROMPT,
      FIXTURE_INPUT,
      "deep",
      new Date(Date.now() + 60_000),
    );

    expect(client.requests[0]?.timeoutMs).toBeLessThanOrEqual(60_000);
  });
});

describe("isAnalysisEnabled", () => {
  it("turns the analyst off, instead of throwing, when AI_PROVIDER is misconfigured", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(isAnalysisEnabled({ AI_PROVIDER: "openai" })).toBe(false);
    expect(isAnalysisEnabled({ AI_PROVIDER: "fake", VERCEL_ENV: "production" })).toBe(false);
    expect(isAnalysisEnabled({ AI_PROVIDER: "fake", VERCEL_ENV: "preview" })).toBe(true);
    warn.mockRestore();
  });
});
