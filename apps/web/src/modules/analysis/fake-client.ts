import { AI_MODELS, type AiClient, type AiRequest, type AiResult } from "./ai-client";

// Preview and tests only (env.ts refuses it in production): a canned reading
// that quotes the input's own first facts, so it always passes the number
// validator and the panel can be exercised without a paid API key.
export function createFakeAiClient(): AiClient {
  return {
    complete(request: AiRequest): Promise<AiResult> {
      const [first, second] = request.input.facts;
      const cited = [first, second].flatMap((fact) => (fact ? [fact] : []));
      const quoted = cited.map((fact) => `${fact.label}: ${fact.value}`).join("; ");
      return Promise.resolve({
        status: "ok",
        output: {
          reading: `Leitura de demonstração, sem análise real. ${quoted}.`,
          tradeOffs: ["Liquidez e rendimento puxam para lados opostos; esta leitura não escolhe."],
          counterArgument: "Uma leitura de demonstração não deve orientar nenhuma decisão.",
          citedKeys: cited.map((fact) => fact.key),
        },
        model: `fake-${AI_MODELS[request.tier]}`,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
    },
  };
}
