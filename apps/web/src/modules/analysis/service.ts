import {
  analysisInputSchema,
  currentAnalysisOutputSchema,
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
import { createNotifierFromEnv, type Notifier } from "@/modules/notifications";
import { getReserveAnalysisFacts } from "@/modules/reserve";

import { errorName } from "@/lib/error-name";
import { getDb, type Database } from "@/platform/db/client";
import {
  decryptHouseholdApiKey,
  getAiSettings,
  householdHasUsableKey,
  rebindLegacyApiKey,
} from "./ai-settings";
import {
  MIN_ATTEMPT_MS,
  type AiClient,
  type AiFailure,
  type AiFamily,
  type AiTier,
  type AiUsage,
} from "./ai-client";
import { readAiProviderName, readEncryptionKey, type AnalysisEnv } from "./env";
import { CURRENT_ANALYST_PROMPT, type AnalystPrompt } from "./prompts";
import { createAiProvider, type AiProvider } from "./provider";
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

// The household's own key (ADR-0013), never a deploy-wide one: `provider` is
// null only when the analyst is off for everyone (AI_PROVIDER=off or no
// ENCRYPTION_KEY); `encryptionKey` is set whenever `provider` can need one
// to open a household's stored key (anthropic only — fake ignores keys).
export type AnalysisDeps = {
  provider: AiProvider | null;
  encryptionKey: string | null;
  prompt: AnalystPrompt;
  notifier: Notifier;
};

export function createAnalysisDeps(env: AnalysisEnv = process.env): AnalysisDeps {
  const providerName = readAiProviderName(env);
  return {
    provider: createAiProvider(providerName),
    encryptionKey: providerName === "anthropic" ? readEncryptionKey(env) : null,
    prompt: CURRENT_ANALYST_PROMPT,
    notifier: createNotifierFromEnv(env),
  };
}

// A misconfigured AI_PROVIDER turns the analyst off instead of breaking the
// pages that host it; the cron's response reports the error. Anthropic's
// provider is per-household from here: enabled only once this household has
// registered a key this deploy can actually decrypt (householdHasUsableKey:
// a rotated ENCRYPTION_KEY or a tampered row counts as no key, same as every
// other place that checks).
export async function isAnalysisEnabled(
  session: HouseholdSession,
  env: AnalysisEnv = process.env,
): Promise<boolean> {
  try {
    const providerName = readAiProviderName(env);
    if (providerName === "off") {
      return false;
    }
    if (providerName === "fake") {
      return true;
    }
    const settings = await getAiSettings(householdScope(session), getDb());
    return householdHasUsableKey(settings, readEncryptionKey(env), session.householdId);
  } catch (error) {
    console.warn(`analysis: AI provider misconfigured (${errorName(error)})`);
    return false;
  }
}

async function clientForHousehold(
  scope: HouseholdScope,
  db: Database,
  deps: Pick<AnalysisDeps, "provider" | "encryptionKey">,
): Promise<{ client: AiClient; family: (tier: "monthly" | "onDemand") => AiFamily } | null> {
  if (deps.provider === null) {
    return null;
  }
  const settings = await getAiSettings(scope, db);
  const encryptionKey = deps.encryptionKey;
  const apiKey =
    encryptionKey === null
      ? null
      : decryptHouseholdApiKey(settings, encryptionKey, scope.householdId);
  if (encryptionKey !== null && apiKey !== null) {
    await rebindLegacyApiKey(scope, db, settings, apiKey, encryptionKey);
  }
  const client = deps.provider.clientFor(apiKey);
  if (client === null) {
    return null;
  }
  return {
    client,
    family: (tier) => (tier === "monthly" ? settings.monthlyFamily : settings.onDemandFamily),
  };
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

export type GenerationFailure = AiFailure | "invalid_output" | "contract_violation" | "no_time";

export type GenerationResult =
  | { status: "succeeded"; output: AnalysisOutput; model: string; usage: AiUsage | null }
  | { status: "failed"; reason: GenerationFailure; model: string | null; usage: AiUsage | null };

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
  family: AiFamily,
  model: string,
  deadline: Date,
): Promise<GenerationResult> {
  let usage: AiUsage | null = null;
  let answeringModel: string | null = null;
  let correction: string | null = null;
  let reason: GenerationFailure = "no_time";

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const remainingMs = deadline.getTime() - Date.now();
    if (remainingMs < MIN_ATTEMPT_MS[tier]) {
      break;
    }
    const result = await client.complete({
      tier,
      family,
      model,
      system: prompt.system,
      user: prompt.renderUser(input, correction),
      input,
      timeoutMs: Math.min(TIMEOUT_MS[tier], remainingMs),
    });
    usage = addUsage(usage, result.usage);
    answeringModel = result.model ?? answeringModel;
    if (result.status !== "ok") {
      reason = result.status;
      if (RETRIED_FAILURES.has(result.status)) {
        correction = "The answer could not be read as the requested JSON object.";
        continue;
      }
      break;
    }
    const parsed = currentAnalysisOutputSchema.safeParse(result.output);
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
  return { status: "failed", reason, model: answeringModel, usage };
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
  | {
      status: "disabled" | "no_accounts" | "quota_exhausted" | "in_progress" | "failed" | "no_time";
    };

// A member's "Gerar nova leitura": Sonnet, spending one of the household's
// readings for its own calendar day whether the reading succeeds or not (the
// call costs the same either way), the way the manual sync quota works.
export async function requestOnDemandAnalysis(
  session: HouseholdSession,
  db: Database,
  deps: AnalysisDeps,
  options: { now: Date; deadline: Date },
): Promise<OnDemandOutcome> {
  const scope = householdScope(session);
  const resolved = await clientForHousehold(scope, db, deps);
  if (resolved === null) {
    return { status: "disabled" };
  }
  const { client, family: familyOf } = resolved;
  const repository = createAnalysisRepository(scope);
  const clock = await householdClock(db, scope, options.now);
  const staleBefore = new Date(options.now.getTime() - RUNNING_STALE_MS);
  // A cheap read before the input is built: a refused press must not cost
  // the three page reads behind it. reserveOnDemand re-checks under the lock.
  if (await repository.hasRunningSince(db, staleBefore)) {
    return { status: "in_progress" };
  }
  if ((await repository.countOnDemandOn(db, clock.localDay)) >= ON_DEMAND_ANALYSES_PER_DAY) {
    return { status: "quota_exhausted" };
  }
  const input = await buildAnalysisInput(scope, "on_demand", clock, options.now);
  if (input === null) {
    return { status: "no_accounts" };
  }
  const family = familyOf("onDemand");
  const requestedModel = await client.resolveModel(family, "standard");
  // Resolving the model is itself a network call; re-checking the budget
  // right after it, before a slot or a failure is ever recorded, keeps a
  // reading that was already doomed from spending either.
  if (options.deadline.getTime() - Date.now() < MIN_ATTEMPT_MS.standard) {
    return { status: "no_time" };
  }
  const reservation = await repository.reserveOnDemand(db, {
    row: {
      period: input.month,
      localDay: clock.localDay,
      promptVersion: deps.prompt.version,
      requestedModel,
      input,
      requestedByUserId: session.userId,
    },
    limit: ON_DEMAND_ANALYSES_PER_DAY,
    staleBefore,
  });
  if (reservation.status !== "reserved") {
    return { status: reservation.status };
  }
  const result = await generateReading(
    client,
    deps.prompt,
    input,
    "standard",
    family,
    requestedModel,
    options.deadline,
  );
  await recordGeneration(db, scope, reservation.id, result);
  return { status: result.status === "succeeded" ? "ok" : "failed" };
}

export async function runOnDemandAnalysis(
  session: HouseholdSession,
  db: Database,
): Promise<OnDemandOutcome> {
  if (!(await isAnalysisEnabled(session))) {
    return { status: "disabled" };
  }
  // isAnalysisEnabled already checked the provider and the household's key
  // moments ago; createAnalysisDeps re-reads the same env and re-decrypts
  // nothing itself, so this should never throw. It is wrapped anyway, the
  // same as runMonthlyAnalysisStep: a Server Action throwing is a 500 for
  // the member who pressed the button, where "disabled" is a readable state.
  let deps: AnalysisDeps;
  try {
    deps = createAnalysisDeps();
  } catch (error) {
    console.warn(`analysis: AI provider misconfigured (${errorName(error)})`);
    return { status: "disabled" };
  }
  return requestOnDemandAnalysis(session, db, deps, {
    now: new Date(),
    deadline: new Date(Date.now() + ON_DEMAND_BUDGET_MS - RUN_HEADROOM_MS),
  });
}

export type MonthlyAnalysisOutcome = { status: "skipped" | "succeeded" | "failed" };

type MonthlyRunOptions = { now: Date; deadline: Date };

export async function runMonthlyAnalysisForHousehold(
  db: Database,
  scope: HouseholdScope,
  deps: AnalysisDeps & { provider: AiProvider },
  options: MonthlyRunOptions,
): Promise<MonthlyAnalysisOutcome> {
  const resolved = await clientForHousehold(scope, db, deps);
  if (resolved === null) {
    return { status: "skipped" };
  }
  const { client, family: familyOf } = resolved;
  const clock = await householdClock(db, scope, options.now);
  const input = await buildAnalysisInput(scope, "monthly", clock, options.now);
  if (input === null) {
    return { status: "skipped" };
  }
  const family = familyOf("monthly");
  const requestedModel = await client.resolveModel(family, "deep");
  // Same re-check as the on-demand path: resolving the model took real time,
  // so the budget is read again before a failure is ever counted against
  // this household's three-strikes limit.
  if (options.deadline.getTime() - Date.now() < MIN_ATTEMPT_MS.deep) {
    return { status: "skipped" };
  }
  const id = await createAnalysisRepository(scope).startMonthly(db, {
    row: {
      period: input.month,
      localDay: clock.localDay,
      promptVersion: deps.prompt.version,
      requestedModel,
      input,
      requestedByUserId: null,
    },
    maxFailures: MONTHLY_MAX_FAILURES,
    staleBefore: new Date(options.now.getTime() - RUNNING_STALE_MS),
  });
  if (id === null) {
    return { status: "skipped" };
  }
  const result = await generateReading(
    client,
    deps.prompt,
    input,
    "deep",
    family,
    requestedModel,
    options.deadline,
  );
  await recordGeneration(db, scope, id, result);
  if (result.status === "succeeded") {
    // Best effort, after the reading is stored (ADR-0012).
    await deps.notifier.notifyHousehold(db, scope, {
      kind: "monthly_analysis_ready",
      month: input.month,
    });
  }
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
export async function runMonthlyAnalysis(
  db: Database,
  deps: AnalysisDeps,
  options: MonthlyRunOptions,
): Promise<MonthlyAnalysisStep> {
  const { provider } = deps;
  if (provider === null) {
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
          { ...deps, provider },
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

export async function runMonthlyAnalysisStep(
  db: Database,
  options: { now: Date; deadline: Date },
): Promise<MonthlyAnalysisStep> {
  let deps: AnalysisDeps;
  try {
    deps = createAnalysisDeps();
  } catch (error) {
    return { error: errorName(error) };
  }
  return runMonthlyAnalysis(db, deps, options);
}
