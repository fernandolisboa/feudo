import {
  analysisInputSchema,
  analysisOutputSchema,
  describeViolations,
  findAnalysisViolations,
  formatYearMonth,
  localDateOf,
  shiftYearMonth,
  yearMonthOf,
  type AnalysisInput,
  type AnalysisKind as CoreAnalysisKind,
  type AnalysisOutput,
  type YearMonth,
} from "@feudo/core";

import { getBanksAnalysisFacts } from "@/modules/banking-intel";
import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  type HouseholdScope,
  type HouseholdSession,
} from "@/modules/households";
import { getLedgerAnalysisFacts } from "@/modules/ledger";
import { getReserveAnalysisFacts } from "@/modules/reserve";

import { errorName } from "@/lib/error-name";
import type { Database } from "@/platform/db/client";
import { AI_MODELS, type AiClient, type AiFailure, type AiTier, type AiUsage } from "./ai-client";
import { createAnthropicAiClient } from "./anthropic-client";
import { readAiProviderName, type AnalysisEnv } from "./env";
import { createFakeAiClient } from "./fake-client";
import { CURRENT_ANALYST_PROMPT, type AnalystPrompt } from "./prompts";
import { referenceFacts } from "./reference-facts";
import { createAnalysisRepository, listHouseholdsWithAccounts } from "./repository";

export const ON_DEMAND_ANALYSES_PER_DAY = 3;

// The Server Action's own time limit: the maxDuration exported by the pages
// that render the button (app/(app)/page.tsx and reserva/page.tsx), which
// must stay in step (their page tests pin it).
export const ON_DEMAND_BUDGET_MS = 60_000;

// What the row update and the action's response need back once the model
// call returns.
const RUN_HEADROOM_MS = 5_000;

// Longer than any call can take (the cron's whole budget), so a reading
// still "running" after this belongs to a function that died mid-call.
export const RUNNING_STALE_MS = 10 * 60_000;

const MONTHLY_MAX_FAILURES = 3;

const ATTEMPTS = 2;

const TIMEOUT_MS: Record<AiTier, number> = { standard: 45_000, deep: 150_000 };

// Below this a call is unlikely to finish; it is better skipped than cut off.
const MIN_ATTEMPT_MS: Record<AiTier, number> = { standard: 15_000, deep: 45_000 };

export type AnalysisDeps = { client: AiClient | null; prompt: AnalystPrompt };

export function createAnalysisDeps(env: AnalysisEnv = process.env): AnalysisDeps {
  const provider = readAiProviderName(env);
  switch (provider) {
    case "off":
      return { client: null, prompt: CURRENT_ANALYST_PROMPT };
    case "fake":
      return { client: createFakeAiClient(), prompt: CURRENT_ANALYST_PROMPT };
    case "anthropic":
      return {
        client: createAnthropicAiClient(env.ANTHROPIC_API_KEY ?? ""),
        prompt: CURRENT_ANALYST_PROMPT,
      };
  }
}

export function isAnalysisEnabled(env: AnalysisEnv = process.env): boolean {
  return readAiProviderName(env) !== "off";
}

type HouseholdClock = { timeZone: string; localDay: string; analysedMonth: YearMonth };

async function householdClock(
  db: Database,
  scope: HouseholdScope,
  now: Date,
): Promise<HouseholdClock> {
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  return {
    timeZone,
    localDay: localDateOf(now, timeZone),
    analysedMonth: shiftYearMonth(yearMonthOf(now, timeZone), -1),
  };
}

// Both kinds read the last closed month for the ledger, so a reading never
// rests on a month still filling in; the reserve and the bank comparison
// are read live, as their pages show them now. Null when the household has
// no account, so nothing is spent on an empty reading.
export async function buildAnalysisInput(
  scope: HouseholdScope,
  kind: CoreAnalysisKind,
  clock: HouseholdClock,
  now: Date,
): Promise<AnalysisInput | null> {
  const month = clock.analysedMonth;
  const ledgerFacts = await getLedgerAnalysisFacts(scope, month, now);
  if (ledgerFacts.length === 0) {
    return null;
  }
  const [reserveFacts, banksFacts] = await Promise.all([
    getReserveAnalysisFacts(scope, now),
    getBanksAnalysisFacts(scope, now),
  ]);
  return analysisInputSchema.parse({
    kind,
    month,
    monthLabel: formatYearMonth(month),
    facts: [...ledgerFacts, ...reserveFacts, ...banksFacts, ...referenceFacts()],
  });
}

export type GenerationResult =
  | { status: "succeeded"; output: AnalysisOutput; model: string; usage: AiUsage | null }
  | { status: "failed"; reason: string; model: string | null; usage: AiUsage | null };

function addUsage(total: AiUsage | null, usage: AiUsage | null): AiUsage | null {
  if (usage === null) {
    return total;
  }
  return total === null
    ? usage
    : {
        inputTokens: total.inputTokens + usage.inputTokens,
        outputTokens: total.outputTokens + usage.outputTokens,
      };
}

const RETRIED_FAILURES: ReadonlySet<AiFailure> = new Set(["malformed", "truncated"]);

// One reading: the model gets the input once and, when its answer breaks the
// contract (a shape it cannot parse, or a number or citation that is not in
// the input), one more try with what was wrong. ADR-0004: an answer that
// still introduces a number is never stored as a reading.
export async function generateReading(
  client: AiClient,
  prompt: AnalystPrompt,
  input: AnalysisInput,
  tier: AiTier,
  deadline: Date,
): Promise<GenerationResult> {
  let usage: AiUsage | null = null;
  let model: string | null = null;
  let correction: string | null = null;
  let reason = "no_time";

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const remainingMs = deadline.getTime() - Date.now();
    if (remainingMs < MIN_ATTEMPT_MS[tier]) {
      break;
    }
    const result = await client.complete({
      tier,
      system: prompt.system,
      user: prompt.renderUser(input, correction),
      input,
      timeoutMs: Math.min(TIMEOUT_MS[tier], remainingMs),
    });
    usage = addUsage(usage, result.usage);
    model = result.model ?? model;
    if (result.status !== "ok") {
      reason = result.status;
      if (RETRIED_FAILURES.has(result.status)) {
        correction = "The answer could not be read as the requested JSON object.";
        continue;
      }
      break;
    }
    const parsed = analysisOutputSchema.safeParse(result.output);
    if (!parsed.success) {
      reason = "invalid_output";
      correction = "The answer did not match the requested fields and lengths.";
      continue;
    }
    const violations = findAnalysisViolations(input, parsed.data);
    if (violations.length === 0) {
      return { status: "succeeded", output: parsed.data, model: result.model, usage };
    }
    reason = "contract_violation";
    correction = describeViolations(violations);
  }
  return { status: "failed", reason, model, usage };
}

async function recordGeneration(
  db: Database,
  scope: HouseholdScope,
  id: string,
  result: GenerationResult,
): Promise<void> {
  const repository = createAnalysisRepository(scope);
  const completion = {
    model: result.model,
    inputTokens: result.usage?.inputTokens ?? null,
    outputTokens: result.usage?.outputTokens ?? null,
  };
  if (result.status === "succeeded") {
    await repository.succeed(db, id, { ...completion, output: result.output });
  } else {
    console.warn(`analysis: reading ${id} failed (${result.reason})`);
    await repository.fail(db, id, { ...completion, failureReason: result.reason });
  }
}

export type OnDemandOutcome =
  | { status: "ok" }
  | { status: "disabled" | "no_accounts" | "quota_exhausted" | "in_progress" | "failed" };

// A member's "Gerar nova leitura": Sonnet, spending one of the household's
// readings for its own calendar day whether the reading succeeds or not (the
// call costs the same either way), the way the manual sync quota works.
export async function requestOnDemandAnalysis(
  session: HouseholdSession,
  db: Database,
  deps: AnalysisDeps,
  options: { now: Date; deadline: Date },
): Promise<OnDemandOutcome> {
  if (deps.client === null) {
    return { status: "disabled" };
  }
  const scope = householdScope(session);
  const clock = await householdClock(db, scope, options.now);
  const input = await buildAnalysisInput(scope, "on_demand", clock, options.now);
  if (input === null) {
    return { status: "no_accounts" };
  }
  const reservation = await createAnalysisRepository(scope).reserveOnDemand(db, {
    row: {
      period: input.month,
      localDay: clock.localDay,
      promptVersion: deps.prompt.version,
      requestedModel: AI_MODELS.standard,
      input,
      requestedByUserId: session.userId,
    },
    limit: ON_DEMAND_ANALYSES_PER_DAY,
    staleBefore: new Date(options.now.getTime() - RUNNING_STALE_MS),
  });
  if (reservation.status !== "reserved") {
    return { status: reservation.status };
  }
  const result = await generateReading(
    deps.client,
    deps.prompt,
    input,
    "standard",
    options.deadline,
  );
  await recordGeneration(db, scope, reservation.id, result);
  return { status: result.status === "succeeded" ? "ok" : "failed" };
}

export async function runOnDemandAnalysis(
  session: HouseholdSession,
  db: Database,
): Promise<OnDemandOutcome> {
  return requestOnDemandAnalysis(session, db, createAnalysisDeps(), {
    now: new Date(),
    deadline: new Date(Date.now() + ON_DEMAND_BUDGET_MS - RUN_HEADROOM_MS),
  });
}

export type MonthlyAnalysisOutcome = { status: "skipped" | "succeeded" | "failed" };

export async function runMonthlyAnalysisForHousehold(
  db: Database,
  scope: HouseholdScope,
  deps: AnalysisDeps & { client: AiClient },
  options: { now: Date; deadline: Date },
): Promise<MonthlyAnalysisOutcome> {
  const clock = await householdClock(db, scope, options.now);
  const input = await buildAnalysisInput(scope, "monthly", clock, options.now);
  if (input === null) {
    return { status: "skipped" };
  }
  const id = await createAnalysisRepository(scope).startMonthly(db, {
    row: {
      period: input.month,
      localDay: clock.localDay,
      promptVersion: deps.prompt.version,
      requestedModel: AI_MODELS.deep,
      input,
      requestedByUserId: null,
    },
    maxFailures: MONTHLY_MAX_FAILURES,
    staleBefore: new Date(options.now.getTime() - RUNNING_STALE_MS),
  });
  if (id === null) {
    return { status: "skipped" };
  }
  const result = await generateReading(deps.client, deps.prompt, input, "deep", options.deadline);
  await recordGeneration(db, scope, id, result);
  return { status: result.status };
}

export type MonthlyAnalysisResult = {
  ok: boolean;
  disabled: boolean;
  succeeded: number;
  failed: number;
  skipped: number;
  unreached: number;
};

export type MonthlyAnalysisStep = MonthlyAnalysisResult | { error: string };

// The monthly deep analysis (cron/analysis route): every household with an
// account, one after the other, until the run's deadline. A household whose
// last closed month already has a reading is skipped in a few reads, so the
// daily run settles each month's readings over the first days of the month
// and is cheap afterwards. One household's error is caught, counted and
// logged by household id, never failing the rest of the run.
export async function runMonthlyAnalysisStep(
  db: Database,
  deps: AnalysisDeps,
  options: { now: Date; deadline: Date },
): Promise<MonthlyAnalysisStep> {
  const { client } = deps;
  if (client === null) {
    return { ok: true, disabled: true, succeeded: 0, failed: 0, skipped: 0, unreached: 0 };
  }
  try {
    const scopes = await listHouseholdsWithAccounts(db);
    const counts = { succeeded: 0, failed: 0, skipped: 0, unreached: 0 };
    for (let index = 0; index < scopes.length; index += 1) {
      const scope = scopes[index];
      if (!scope) {
        continue;
      }
      if (options.deadline.getTime() - Date.now() < MIN_ATTEMPT_MS.deep) {
        counts.unreached += scopes.length - index;
        break;
      }
      try {
        const outcome = await runMonthlyAnalysisForHousehold(
          db,
          scope,
          { ...deps, client },
          options,
        );
        counts[outcome.status] += 1;
      } catch (error) {
        counts.failed += 1;
        console.warn(
          `analysis: monthly reading failed for household ${scope.householdId} (${errorName(error)})`,
        );
      }
    }
    if (counts.unreached > 0) {
      console.warn(`analysis: monthly run left ${String(counts.unreached)} household(s) unreached`);
    }
    return { ok: counts.failed === 0, disabled: false, ...counts };
  } catch (error) {
    return { error: errorName(error) };
  }
}
