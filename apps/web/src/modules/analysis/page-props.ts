import {
  analysisInputSchema,
  analysisOutputSchema,
  formatYearMonth,
  isYearMonth,
  localDateOf,
} from "@feudo/core";

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
import { createAnalysisRepository, type StoredAnalysis } from "./repository";
import { isAnalysisEnabled, ON_DEMAND_ANALYSES_PER_DAY, RUNNING_STALE_MS } from "./service";
import { t } from "./strings";

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

// A stored row is re-validated on the way out: a reading that no longer
// parses (a hand-edited row, a schema drift) is simply not shown.
export function readingView(row: StoredAnalysis, timeZone: string): AnalystReadingView | null {
  const input = analysisInputSchema.safeParse(row.input);
  const output = analysisOutputSchema.safeParse(row.output);
  if (!input.success || !output.success) {
    return null;
  }
  const factsByKey = new Map(input.data.facts.map((fact) => [fact.key, fact]));
  const month = isYearMonth(row.period) ? formatYearMonth(row.period) : row.period;
  const name = modelName(row.model);
  return {
    title: interpolate(t.panel.kinds[row.kind], "{month}", month),
    paragraphs: output.data.reading
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0),
    tradeOffs: output.data.tradeOffs,
    counterArgument: output.data.counterArgument,
    inputsUsed: [...new Set(output.data.citedKeys)].flatMap((key) => {
      const fact = factsByKey.get(key);
      return fact ? [{ key, label: fact.label, value: fact.value }] : [];
    }),
    meta: [
      ...(row.completedAt === null
        ? []
        : [
            interpolate(
              t.panel.generatedAt,
              "{date}",
              formatShortDateTime(row.completedAt, timeZone),
            ),
          ]),
      ...(name === null ? [] : [name]),
      interpolate(t.panel.promptVersion, "{version}", row.promptVersion),
    ],
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
