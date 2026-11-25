import {
  PINNED_MODEL_IDS,
  type AiClient,
  type AiRequest,
  type AiResult,
  type CategorySuggestionAiRequest,
} from "./ai-client";

type SuggestionLine = { index: number; type: "credit" | "debit" };

// Reads back the same text the real client sends (never a parallel copy of
// the input): one "<index> | <credit|debit> | <amount> | <description>" line
// per transaction, between the <transactions> tags category-suggester-v1.ts
// renders.
function parseTransactionLines(user: string): SuggestionLine[] {
  const block = /<transactions>\n([\s\S]*?)\n<\/transactions>/.exec(user);
  const lines = block?.[1];
  if (lines === undefined) {
    return [];
  }
  return lines
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const [indexText, directionText] = line.split(" | ");
      return {
        index: Number(indexText),
        type: directionText === "credit" ? "credit" : "debit",
      };
    });
}

// Preview and tests only (env.ts refuses it in production): a canned reading
// that quotes the input's own first facts, so it always passes the number
// validator and the panel can be exercised without a paid API key. The fake
// provider ignores every household key, including a missing one, so e2e and
// local development keep working with no key registered at all.
export function createFakeAiClient(): AiClient {
  return {
    resolveModel(family) {
      return Promise.resolve(PINNED_MODEL_IDS[family]);
    },

    complete(request: AiRequest): Promise<AiResult> {
      const [first, second] = request.input.facts;
      const cited = [first, second].flatMap((fact) => (fact ? [fact] : []));
      const quoted = cited.map((fact) => `${fact.label}: ${fact.value}`).join("; ");
      return Promise.resolve({
        status: "ok",
        output: {
          summary: "Leitura de demonstração, sem análise real.",
          reading: `Leitura de demonstração, sem análise real. ${quoted}.`,
          banks: "A comparação de bancos não é lida numa leitura de demonstração.",
          tradeOffs: ["Liquidez e rendimento puxam para lados opostos; esta leitura não escolhe."],
          counterArgument: "Uma leitura de demonstração não deve orientar nenhuma decisão.",
          citedKeys: cited.map((fact) => fact.key),
        },
        model: `fake-${request.model}`,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
    },

    suggestCategories(request: CategorySuggestionAiRequest): Promise<AiResult> {
      return Promise.resolve({
        status: "ok",
        output: {
          suggestions: parseTransactionLines(request.user).map((line) => ({
            index: line.index,
            subcategory:
              line.index % 3 === 2
                ? null
                : line.type === "credit"
                  ? "income.salary"
                  : "shopping.other",
          })),
        },
        model: `fake-${request.model}`,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
    },
  };
}
