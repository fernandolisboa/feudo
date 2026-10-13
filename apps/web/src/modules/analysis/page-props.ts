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

import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  type HouseholdSession,
} from "@/modules/households";

import { formatShortDateTime } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { AI_MODELS } from "./ai-client";
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

const MODEL_NAMES: Readonly<Record<string, string>> = {
  [AI_MODELS.standard]: "Claude Sonnet 5.5",
  [AI_MODELS.deep]: "Claude Opus 5.5",
};

export type AnalystReadingView = {
  title: string;
  paragraphs: string[];
  tradeOffs: string[];
  counterArgument: string;
  inputsUsed: { key: string; label: string; value: string }[];
  meta: string[];
};

export type AnalysisDetailView = Omit<AnalystReadingView, "paragraphs"> & {
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

function modelName(model: string | null): string | null {
  if (model === null) {
    return null;
  }
  return MODEL_NAMES[model] ?? model;
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
): Omit<AnalystReadingView, "paragraphs"> {
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
  return {
    ...baseView(row, parsed.input, parsed.output, timeZone),
    paragraphs: [
      ...splitParagraphs(parsed.output.reading),
      ...splitParagraphs(parsed.output.banks),
    ],
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

// The "Leitura do analista" panel on Visão geral and Reserva. Null when the
// analysis is turned off, so both pages render exactly as they do without it
// (ADR-0004: no number on screen comes from the AI layer).
export async function getAnalystReadingProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<AnalystReadingProps | null> {
  if (!isAnalysisEnabled()) {
    return null;
  }
  const db = getDb();
  const scope = householdScope(session);
  const repository = createAnalysisRepository(scope);
  const settings = await getHouseholdSettings(scope, db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const [latest, used, inProgress] = await Promise.all([
    repository.latestSucceeded(db),
    repository.countOnDemandOn(db, localDateOf(now, timeZone)),
    repository.hasRunningSince(db, new Date(now.getTime() - RUNNING_STALE_MS)),
  ]);
  return {
    reading: latest === null ? null : readingView(latest, timeZone),
    limit: ON_DEMAND_ANALYSES_PER_DAY,
    remaining: Math.max(0, ON_DEMAND_ANALYSES_PER_DAY - used),
    inProgress,
  };
}

async function householdContext(session: HouseholdSession) {
  const db = getDb();
  const scope = householdScope(session);
  const settings = await getHouseholdSettings(scope, db);
  return {
    db,
    repository: createAnalysisRepository(scope),
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
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
  if (!isAnalysisEnabled()) {
    return null;
  }
  const { db, repository, timeZone } = await householdContext(session);
  const id = readingIdSchema.safeParse(requestedId);
  const [requested, history, used, inProgress] = await Promise.all([
    id.success ? repository.findSucceeded(db, id.data) : Promise.resolve(null),
    repository.listSucceeded(db, HISTORY_LIMIT),
    repository.countOnDemandOn(db, localDateOf(now, timeZone)),
    repository.hasRunningSince(db, new Date(now.getTime() - RUNNING_STALE_MS)),
  ]);
  const shown = requested ?? (await repository.latestSucceeded(db));
  const reading = shown === null ? null : analysisDetailView(shown, timeZone);
  const latestId = history[0]?.id ?? null;
  return {
    reading,
    isLatest: reading === null || reading.id === latestId,
    history: history.map((row) => historyItem(row, timeZone, reading?.id ?? null)),
    limit: ON_DEMAND_ANALYSES_PER_DAY,
    remaining: Math.max(0, ON_DEMAND_ANALYSES_PER_DAY - used),
    inProgress,
  };
}

// The newest reading's bank paragraph, shown on Bancos. Null when the
// analysis is off or the newest reading has none (analyst-v1 readings).
export async function getAnalystBanksNoteProps(
  session: HouseholdSession,
): Promise<AnalystBanksNoteProps | null> {
  if (!isAnalysisEnabled()) {
    return null;
  }
  const { db, repository, timeZone } = await householdContext(session);
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
