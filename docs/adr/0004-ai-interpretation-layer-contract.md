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

## Amendment 2026-10-02 (#24): what the first implementation settled

- **Facts are the screens' own strings.** The input is a list of facts, each a stable key, a pt-BR label and a pt-BR value, built from the same view models Visão geral, Reserva and Bancos render (`getLedgerAnalysisFacts`, `getReserveAnalysisFacts`, `getBanksAnalysisFacts`) plus the reference constants (income-tax brackets, exempt products, FGC and FGCoop limits). A figure the analyst quotes is one the household can find on screen, or a count of rows a screen lists (how many reserve suggestions, positions needing attention or excluded placements there are). Account names and typed connection labels stay out, since they are free text the household wrote; an institution appears only once matched to the reference list.
- **What a reading covers.** Both kinds read the ledger for the household's last closed month, so a reading never rests on a month still filling in; the reserve and the bank comparison are read as they stand. A household with no account gets no reading and spends nothing.
- **The validator.** Every run of digits in the output, read the Brazilian way (dot as thousands separator, comma as decimal, leading and trailing zeros ignored, a leading minus kept, so a deficit quoted without its sign is rejected), must appear in a fact's label or value or in the month label, and every cited key must exist in the input. A rejected answer gets one more attempt with the violations spelled out; a second rejection fails the reading, which is stored as failed and never shown. A number written out in words is not caught; the prompt forbids it.
- **Models.** `claude-sonnet-5-5` at medium effort for on-demand readings, `claude-opus-5-5` at high effort for the monthly one, with structured outputs (JSON schema) and the server-side fallback beta, so an overloaded model is answered by a fallback whose id is what gets stored. The SDK does not retry; the service gives each call a timeout inside the request's own budget (60 s for on-demand, the cron's 300 s for monthly).
- **Prompts live in the slice**, under `apps/web/src/modules/analysis/prompts/`, not a root `prompts/` folder, because Next compiles only the app's own tree. Each version is a file (`analyst-v1.ts`); its test pins the system prompt's hash, so changing it is a new version, and checks the rendering against fixtures.
- **Limits.** On-demand: three readings per household per household-local day, each press counting, checked under a lock on the household row like the manual sync quota; one reading at a time per household, a running one older than ten minutes being treated as abandoned. Monthly: the daily cron (`/api/cron/analysis`, 08:00 UTC) writes at most one successful reading per household per closed month (a partial unique index) and gives up on a month after three failures.
- **Switch.** `AI_PROVIDER` is `anthropic`, `fake` or `off`; unset, it is `anthropic` when `ANTHROPIC_API_KEY` exists and `off` otherwise. The fake client, a canned reading quoting the first facts, is refused in production. Off hides the panel and makes the cron a no-op.
