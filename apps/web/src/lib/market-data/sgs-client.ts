import { z } from "zod";

import type { FetchWindow } from "./fetch-window";

const SGS_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

export interface SgsObservation {
  referenceDate: string;
  value: string;
}

export class SgsFetchError extends Error {
  readonly seriesCode: string;
  readonly status: number | undefined;

  constructor(seriesCode: string, message: string, status?: number) {
    super(`SGS series ${seriesCode}: ${message}`);
    this.name = "SgsFetchError";
    this.seriesCode = seriesCode;
    this.status = status;
  }
}

export class SgsResponseShapeError extends Error {
  readonly seriesCode: string;

  constructor(seriesCode: string) {
    super(`SGS series ${seriesCode}: response did not match the expected shape`);
    this.name = "SgsResponseShapeError";
    this.seriesCode = seriesCode;
  }
}

const sgsObservationSchema = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  valor: z.string().regex(/^-?\d+(\.\d+)?$/),
});

const sgsResponseSchema = z.array(sgsObservationSchema);

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
  seriesCode: string,
  window: FetchWindow,
  fetchImpl: typeof fetch = fetch,
): Promise<SgsObservation[]> {
  const url =
    `${SGS_BASE_URL}.${seriesCode}/dados?formato=json` +
    `&dataInicial=${formatDateForSgs(window.fromISODate)}` +
    `&dataFinal=${formatDateForSgs(window.toISODate)}`;

  let response: Response;
  try {
    response = await fetchImpl(url);
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

  const json: unknown = await response.json();
  const parsed = sgsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new SgsResponseShapeError(seriesCode);
  }

  return parsed.data.map((observation) => ({
    referenceDate: parseSgsDateToISO(observation.data),
    value: observation.valor,
  }));
}
