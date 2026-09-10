import { vi } from "vitest";

export const CDI_DAILY_OBSERVATIONS = [
  { data: "01/09/2026", valor: "0.053680" },
  { data: "02/09/2026", valor: "0.053910" },
  { data: "03/09/2026", valor: "0.053701" },
];

export const SELIC_TARGET_OBSERVATIONS = [{ data: "20/08/2026", valor: "15.00" }];

export const SELIC_DAILY_OBSERVATIONS = [{ data: "03/09/2026", valor: "0.056834" }];

export const IPCA_MONTHLY_OBSERVATIONS = [
  { data: "01/09/2025", valor: "0.48" },
  { data: "01/10/2025", valor: "0.44" },
  { data: "01/11/2025", valor: "0.39" },
  { data: "01/12/2025", valor: "0.52" },
  { data: "01/01/2026", valor: "0.16" },
  { data: "01/02/2026", valor: "0.83" },
  { data: "01/03/2026", valor: "0.56" },
  { data: "01/04/2026", valor: "0.43" },
  { data: "01/05/2026", valor: "0.26" },
  { data: "01/06/2026", valor: "0.24" },
  { data: "01/07/2026", valor: "0.30" },
  { data: "01/08/2026", valor: "0.45" },
];

export const IPCA_12M_OBSERVATIONS = [{ data: "01/08/2026", valor: "4.86" }];

export const SGS_URLS_BY_SERIES: Record<string, string> = {
  "12": "bcdata.sgs.12/",
  "432": "bcdata.sgs.432/",
  "11": "bcdata.sgs.11/",
  "433": "bcdata.sgs.433/",
  "13522": "bcdata.sgs.13522/",
};

export const SUCCESS_FIXTURES_BY_SERIES: Record<string, unknown> = {
  "12": CDI_DAILY_OBSERVATIONS,
  "432": SELIC_TARGET_OBSERVATIONS,
  "11": SELIC_DAILY_OBSERVATIONS,
  "433": IPCA_MONTHLY_OBSERVATIONS,
  "13522": IPCA_12M_OBSERVATIONS,
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export interface BuildSgsFetchMockOptions {
  failingSeriesCodes?: string[];
  notFoundSeriesCodes?: string[];
  malformedSeriesCodes?: string[];
  everySeriesFails?: boolean;
}

export function buildSgsFetchMock(options: BuildSgsFetchMockOptions = {}): typeof fetch {
  const failingSeriesCodes = new Set(options.failingSeriesCodes ?? []);
  const notFoundSeriesCodes = new Set(options.notFoundSeriesCodes ?? []);
  const malformedSeriesCodes = new Set(options.malformedSeriesCodes ?? []);

  const mock = vi.fn((url: string) => {
    const matchedSeriesCode = Object.entries(SGS_URLS_BY_SERIES).find(([, fragment]) =>
      url.includes(fragment),
    )?.[0];
    if (!matchedSeriesCode) {
      throw new Error(`Unexpected URL in test fetch mock: ${url}`);
    }

    if (options.everySeriesFails || failingSeriesCodes.has(matchedSeriesCode)) {
      return Promise.reject(new Error("network down"));
    }
    if (notFoundSeriesCodes.has(matchedSeriesCode)) {
      return Promise.resolve(jsonResponse({ message: "not found" }, 404));
    }
    if (malformedSeriesCodes.has(matchedSeriesCode)) {
      return Promise.resolve(jsonResponse({ unexpected: "shape" }));
    }

    return Promise.resolve(jsonResponse(SUCCESS_FIXTURES_BY_SERIES[matchedSeriesCode]));
  });
  return mock as unknown as typeof fetch;
}
