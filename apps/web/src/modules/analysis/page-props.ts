import {
  analysisInputSchema,
  analysisOutputSchema,
  formatYearMonth,
  isYearMonth,
  localDateOf,
  type AnalysisInput,
  type AnalysisOutput,
} from "@feudo/core";
import { z } from "zod";

import { recordFinancialDataAccess } from "@/modules/audit";
import {
  DEFAULT_TIME_ZONE,
  canManageHouseholdSettings,
  getHouseholdSettings,
  getViewerRole,
  householdScope,
  type HouseholdSession,
} from "@/modules/households";

import { errorName } from "@/lib/error-name";
import { formatShortDateTime } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { hasValidEncryptionKey } from "@/platform/encryption-key";
import { householdHasUsableKey } from "./ai-settings";
import { getAiSettings } from "./ai-settings-repository";
import { AI_FAMILIES, type AiFamily } from "./ai-client";
import { readAiProviderName, readEncryptionKey, type AnalysisEnv } from "./env";
import { ANALYSES_PATH, READING_PARAM } from "./paths";
import {
  createAnalysisRepository,
  type AnalysisHistoryRow,
  type StoredAnalysis,
} from "./repository";
import { isAnalysisEnabled, ON_DEMAND_ANALYSES_PER_DAY, RUNNING_STALE_MS } from "./service";
import { t } from "./strings";

const HISTORY_LIMIT = 12;

const readingIdSchema = z.uuid();

// Any current or future claude-<family>-X-Y id, with or without the Models
// API's optional -YYYYMMDD release-date suffix, renders as "Haiku X.Y" /
// "Sonnet X.Y" / "Opus X.Y" (ADR-0013): the household picks the family, the
// newest version is resolved at reading time, and the label must keep up
// without a code change. An id this cannot read stays as-is. The family
// alternation is derived from AI_FAMILIES so a new family needs no second
// edit here.
const MODEL_ID_PATTERN = new RegExp(
  `^claude-(${AI_FAMILIES.join("|")})-(\\d+)-(\\d+)(?:-\\d{8})?$`,
);

type ReadingBase = {
  title: string;
  tradeOffs: string[];
  counterArgument: string;
  inputsUsed: { key: string; label: string; value: string }[];
  meta: string[];
};

export type AnalystReadingView = {
  title: string;
  summary: string;
  counterArgument: string;
  meta: string[];
  href: string;
};

export type AnalysisDetailView = ReadingBase & {
  id: string;
  summary: string | null;
  reading: string[];
  banks: string[];
};

export type AnalysisHistoryItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
  current: boolean;
};

export type AnalysesPageProps = {
  reading: AnalysisDetailView | null;
  isLatest: boolean;
  history: AnalysisHistoryItem[];
  limit: number;
  remaining: number;
  inProgress: boolean;
};

export type AnalystBanksNoteProps = {
  paragraphs: string[];
  source: string;
  href: string;
};

export type AnalystReadingProps = {
  reading: AnalystReadingView | null;
  limit: number;
  remaining: number;
  inProgress: boolean;
};

// "unavailable" is the deploy itself having no analyst at all (AI_PROVIDER=off
// or no usable ENCRYPTION_KEY): the section shows a read-only notice instead
// of a form that would only ever answer "try again" (no household action
// fixes a deploy-level misconfiguration).
export type AiSettingsSectionProps =
  | {
      status: "unavailable";
      canManage: boolean;
      monthlyFamily: AiFamily;
      onDemandFamily: AiFamily;
    }
  | {
      status: "available";
      canManage: boolean;
      hasKey: boolean;
      apiKeyLast4: string | null;
      monthlyFamily: AiFamily;
      onDemandFamily: AiFamily;
    };

function modelName(model: string | null): string | null {
  if (model === null) {
    return null;
  }
  const match = MODEL_ID_PATTERN.exec(model);
  if (!match) {
    return model;
  }
  const family = match[1] as AiFamily;
  const major = match[2] ?? "";
  const minor = match[3] ?? "";
  return `${t.aiSettings.familyNames[family]} ${major}.${minor}`;
}

function splitParagraphs(text: string | undefined): string[] {
  if (text === undefined) {
    return [];
  }
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function readingTitle(row: Pick<StoredAnalysis, "kind" | "period">): string {
  const month = isYearMonth(row.period) ? formatYearMonth(row.period) : row.period;
  return interpolate(t.panel.kinds[row.kind], "{month}", month);
}

function generatedAt(completedAt: Date | null, timeZone: string): string[] {
  return completedAt === null
    ? []
    : [interpolate(t.panel.generatedAt, "{date}", formatShortDateTime(completedAt, timeZone))];
}

function parseStored(row: StoredAnalysis): { input: AnalysisInput; output: AnalysisOutput } | null {
  const input = analysisInputSchema.safeParse(row.input);
  const output = analysisOutputSchema.safeParse(row.output);
  return input.success && output.success ? { input: input.data, output: output.data } : null;
}

function baseView(
  row: StoredAnalysis,
  input: AnalysisInput,
  output: AnalysisOutput,
  timeZone: string,
): ReadingBase {
  const factsByKey = new Map(input.facts.map((fact) => [fact.key, fact]));
  const name = modelName(row.model);
  return {
    title: readingTitle(row),
    tradeOffs: output.tradeOffs,
    counterArgument: output.counterArgument,
    inputsUsed: [...new Set(output.citedKeys)].flatMap((key) => {
      const fact = factsByKey.get(key);
      return fact ? [{ key, label: fact.label, value: fact.value }] : [];
    }),
    meta: [
      ...generatedAt(row.completedAt, timeZone),
      ...(name === null ? [] : [name]),
      interpolate(t.panel.promptVersion, "{version}", row.promptVersion),
    ],
  };
}

// A stored row is re-validated on the way out: a reading that no longer
// parses (a hand-edited row, a schema drift) is simply not shown.
export function readingView(row: StoredAnalysis, timeZone: string): AnalystReadingView | null {
  const parsed = parseStored(row);
  if (parsed === null) {
    return null;
  }
  const { output } = parsed;
  const name = modelName(row.model);
  return {
    title: readingTitle(row),
    // analyst-v1 readings have no summary: their first paragraph stands in.
    summary: output.summary ?? splitParagraphs(output.reading)[0] ?? output.reading,
    counterArgument: output.counterArgument,
    meta: [...generatedAt(row.completedAt, timeZone), ...(name === null ? [] : [name])],
    href: `${ANALYSES_PATH}?${READING_PARAM}=${encodeURIComponent(row.id)}`,
  };
}

export function analysisDetailView(
  row: StoredAnalysis,
  timeZone: string,
): AnalysisDetailView | null {
  const parsed = parseStored(row);
  if (parsed === null) {
    return null;
  }
  return {
    ...baseView(row, parsed.input, parsed.output, timeZone),
    id: row.id,
    summary: parsed.output.summary ?? null,
    reading: splitParagraphs(parsed.output.reading),
    banks: splitParagraphs(parsed.output.banks),
  };
}

export function historyItem(
  row: AnalysisHistoryRow,
  timeZone: string,
  currentId: string | null,
): AnalysisHistoryItem {
  const name = modelName(row.model);
  return {
    id: row.id,
    title: readingTitle(row),
    meta: [...generatedAt(row.completedAt, timeZone), ...(name === null ? [] : [name])].join(" · "),
    href: `${ANALYSES_PATH}?${READING_PARAM}=${encodeURIComponent(row.id)}`,
    current: row.id === currentId,
  };
}

type HouseholdContext = {
  db: ReturnType<typeof getDb>;
  repository: ReturnType<typeof createAnalysisRepository>;
  timeZone: string;
};

async function householdContext(session: HouseholdSession): Promise<HouseholdContext> {
  const db = getDb();
  const scope = householdScope(session);
  const settings = await getHouseholdSettings(scope, db);
  return {
    db,
    repository: createAnalysisRepository(scope),
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
  };
}

type QuotaState = Pick<AnalystReadingProps, "limit" | "remaining" | "inProgress">;

async function quotaState(
  { db, repository, timeZone }: HouseholdContext,
  now: Date,
): Promise<QuotaState> {
  const [used, inProgress] = await Promise.all([
    repository.countOnDemandOn(db, localDateOf(now, timeZone)),
    repository.hasRunningSince(db, new Date(now.getTime() - RUNNING_STALE_MS)),
  ]);
  return {
    limit: ON_DEMAND_ANALYSES_PER_DAY,
    remaining: Math.max(0, ON_DEMAND_ANALYSES_PER_DAY - used),
    inProgress,
  };
}

// The analyst's summary on Visão geral and Reserva; the whole reading lives on
// Análises. Null when the analysis is turned off, so both pages render exactly
// as they do without it (ADR-0004: no number on screen comes from the AI layer).
export async function getAnalystReadingProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<AnalystReadingProps | null> {
  const context = await householdContext(session);
  if (!(await isAnalysisEnabled(session))) {
    return null;
  }
  const [latest, quota] = await Promise.all([
    context.repository.latestSucceeded(context.db),
    quotaState(context, now),
  ]);
  return {
    reading: latest === null ? null : readingView(latest, context.timeZone),
    ...quota,
  };
}

// The Análises screen: the reading asked for in the address (the household's
// own, or the newest when the id is not one of its readings), the readings
// before it and the "Gerar nova leitura" quota. Null when the analysis is
// turned off. Only reads what was stored: no page view calls the model.
export async function getAnalysesPageProps(
  session: HouseholdSession,
  requestedId: unknown,
  now: Date = new Date(),
): Promise<AnalysesPageProps | null> {
  const context = await householdContext(session);
  const { db, repository, timeZone } = context;
  if (!(await isAnalysisEnabled(session))) {
    return null;
  }
  const id = readingIdSchema.safeParse(requestedId);
  const [requested, history, quota] = await Promise.all([
    id.success ? repository.findSucceeded(db, id.data) : Promise.resolve(null),
    repository.listSucceeded(db, HISTORY_LIMIT),
    quotaState(context, now),
  ]);
  const requestedView = requested === null ? null : analysisDetailView(requested, timeZone);
  const latest = requestedView === null ? await repository.latestSucceeded(db) : null;
  const reading = requestedView ?? (latest === null ? null : analysisDetailView(latest, timeZone));
  const latestId = history[0]?.id ?? null;
  await recordFinancialDataAccess(session, "analyses");
  return {
    reading,
    isLatest: requestedView === null || requestedView.id === latestId,
    history: history.map((row) => historyItem(row, timeZone, reading?.id ?? null)),
    ...quota,
  };
}

// The newest reading's bank paragraph, shown on Bancos. Null when the
// analysis is off or the newest reading has none (analyst-v1 readings).
export async function getAnalystBanksNoteProps(
  session: HouseholdSession,
): Promise<AnalystBanksNoteProps | null> {
  const { db, repository, timeZone } = await householdContext(session);
  if (!(await isAnalysisEnabled(session))) {
    return null;
  }
  const latest = await repository.latestSucceeded(db);
  const view = latest === null ? null : analysisDetailView(latest, timeZone);
  if (view === null || view.banks.length === 0) {
    return null;
  }
  return {
    paragraphs: view.banks,
    source: [view.title, ...generatedAt(latest?.completedAt ?? null, timeZone)].join(" · "),
    href: ANALYSES_PATH,
  };
}

// Casa's "Analyst's key and models" section: every member sees the current
// state (CLAUDE.md's household-settings pattern), only owner/admin can
// change it (canManage) — the component itself hides the editing controls
// when canManage is false, this never returns the key itself (only its
// last 4 characters, already all the repository keeps besides the
// ciphertext).
export async function getAiSettingsSectionProps(
  session: HouseholdSession,
  env: AnalysisEnv = process.env,
): Promise<AiSettingsSectionProps> {
  const db = getDb();
  const scope = householdScope(session);
  const [settings, viewerRole] = await Promise.all([
    getAiSettings(scope, db),
    getViewerRole(session, db),
  ]);
  const canManage = canManageHouseholdSettings(viewerRole);
  let providerName: ReturnType<typeof readAiProviderName>;
  try {
    providerName = readAiProviderName(env);
  } catch (error) {
    console.warn(`analysis: AI provider misconfigured (${errorName(error)})`);
    providerName = "off";
  }
  if (providerName === "off") {
    return {
      status: "unavailable",
      canManage,
      monthlyFamily: settings.monthlyFamily,
      onDemandFamily: settings.onDemandFamily,
    };
  }
  const encryptionKey = hasValidEncryptionKey(env) ? readEncryptionKey(env) : null;
  const hasKey = householdHasUsableKey(settings, encryptionKey);
  return {
    status: "available",
    canManage,
    hasKey,
    apiKeyLast4: hasKey ? settings.apiKeyLast4 : null,
    monthlyFamily: settings.monthlyFamily,
    onDemandFamily: settings.onDemandFamily,
  };
}
