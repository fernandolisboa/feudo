---
status: accepted
date: 2026-09-02
---

# The AI layer interprets computed numbers; it never computes or invents them

Language models are unreliable at arithmetic and eager to recommend, while a household finance tool must be exact and calm. We split the system into three layers, data → deterministic → interpretation, and give the AI layer a narrow contract: it receives numbers already computed by `packages/core`, returns an interpretation in a fixed structure, and is never the source of any figure shown on screen.

## Contract

**Input**: a structured, Zod-validated object built by the `analysis` module from deterministic outputs (for example: monthly income, spending by kind, savings rate, average fixed cost, reserve target and coverage, per-position net real yield, bank comparison scores) together with the reference constants those numbers rest on (the income-tax regressive table with its brackets and day thresholds, the FGC limit). Each input carries a label the model can cite. No raw transactions, no free-text bank descriptions, no personal identifiers.

**Model and persona**: `@anthropic-ai/sdk`, Sonnet by default, Opus only for the monthly deep analysis. The persona is a conservative analyst who states trade-offs explicitly (liquidity × yield × risk), cites the input labels it relied on, and may not recommend a product or institution without stating the counter-argument.

**Output**: a Zod-validated structure (sections of plain text, cited input labels, listed trade-offs). Any number that appears in the output must equal an input value; the validator rejects outputs that introduce numbers not present in the inputs. Output is rendered as text, never as HTML.

**Storage and attribution**: every analysis is stored with its full input object, prompt version, model id, household id and timestamp. Prompts are versioned files under `prompts/` with fixture tests; changing a prompt is a new version, never an edit in place.

**Limits**: AI endpoints are rate limited per household; the monthly deep analysis runs once per household per month from the cron, and on-demand analyses are capped per day (value set in the ticket that ships them).

## Consequences

- The deterministic layer must expose every number the analysis needs; if the AI "needs" a number that does not exist yet, the work is a `packages/core` ticket first.
- Analyses are reproducible: same inputs + same prompt version + same model can be re-run and compared, which is how prompt changes are reviewed.
- The AI is optional to the product's correctness: every screen works with the AI disabled, since no number comes from it.
