import { z } from "zod";

import type { FetchWindow } from "./fetch-window";
import type { SgsSeriesCode } from "./series";

const SGS_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const SGS_FETCH_TIMEOUT_MS = 10_000;

// A 10-year window of daily observations is at most ~3_653 rows; capped with headroom so a
// malformed or malicious response can't force an unbounded parse/allocation.
const MAX_OBSERVATIONS_PER_FETCH = 3_700;

export interface SgsObservation {
  referenceDate: string;
  value: string;
}

export class SgsFetchError extends Error {
  readonly seriesCode: SgsSeriesCode;
  readonly status: number | undefined;

  constructor(seriesCode: SgsSeriesCode, message: string, status?: number) {
    super(`SGS series ${seriesCode}: ${message}`);
    this.name = "SgsFetchError";
    this.seriesCode = seriesCode;
    this.status = status;
  }
}

export class SgsResponseShapeError extends Error {
  readonly seriesCode: SgsSeriesCode;

  constructor(seriesCode: SgsSeriesCode) {
    super(`SGS series ${seriesCode}: response did not match the expected shape`);
    this.name = "SgsResponseShapeError";
    this.seriesCode = seriesCode;
  }
}

const sgsObservationSchema = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  valor: z.string().regex(/^-?\d+(\.\d+)?$/),
});

const sgsResponseSchema = z.array(sgsObservationSchema).max(MAX_OBSERVATIONS_PER_FETCH);

function splitIntoThreeParts(value: string, separator: string): [string, string, string] {
  const parts = value.split(separator);
  if (
    parts.length !== 3 ||
    parts[0] === undefined ||
    parts[1] === undefined ||
    parts[2] === undefined
  ) {
    throw new Error(`Expected a date with three ${separator}-separated parts, received ${value}`);
  }
  return [parts[0], parts[1], parts[2]];
}

function formatDateForSgs(isoDate: string): string {
  const [year, month, day] = splitIntoThreeParts(isoDate, "-");
  return `${day}/${month}/${year}`;
}

function parseSgsDateToISO(ddmmyyyy: string): string {
  const [day, month, year] = splitIntoThreeParts(ddmmyyyy, "/");
  return `${year}-${month}-${day}`;
}

export async function fetchSgsSeries(
  seriesCode: SgsSeriesCode,
  window: FetchWindow,
  fetchImpl: typeof fetch = fetch,
): Promise<SgsObservation[]> {
  const url =
    `${SGS_BASE_URL}.${seriesCode}/dados?formato=json` +
    `&dataInicial=${formatDateForSgs(window.fromISODate)}` +
    `&dataFinal=${formatDateForSgs(window.toISODate)}`;

  let response: Response;
  try {
    response = await fetchImpl(url, { signal: AbortSignal.timeout(SGS_FETCH_TIMEOUT_MS) });
  } catch {
    throw new SgsFetchError(seriesCode, "network request failed");
  }

  if (!response.ok) {
    throw new SgsFetchError(
      seriesCode,
      `unexpected status ${String(response.status)}`,
      response.status,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new SgsResponseShapeError(seriesCode);
  }

  const parsed = sgsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new SgsResponseShapeError(seriesCode);
  }

  return parsed.data.map((observation) => ({
    referenceDate: parseSgsDateToISO(observation.data),
    value: observation.valor,
  }));
}
