import { recordAccessWithinQuota } from "@/modules/audit";
import {
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  householdScope,
  requireHouseholdSessionForDataRights,
  type HouseholdSession,
} from "@/modules/households";

import { getDb } from "@/platform/db/client";
import { buildExportDocument, type ExportDocument } from "./export";
import { streamExportDocument } from "./stream-export-document";

export const EXPORT_RATE_LIMIT = 3;
export const EXPORT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const EXPORT_RETURN_ROUTES = ["/preferencias", "/aceitar-termos"] as const;
export type ExportReturnRoute = (typeof EXPORT_RETURN_ROUTES)[number];
const DEFAULT_RETURN_ROUTE: ExportReturnRoute = "/preferencias";

function isExportReturnRoute(value: unknown): value is ExportReturnRoute {
  return typeof value === "string" && (EXPORT_RETURN_ROUTES as readonly string[]).includes(value);
}

// The form's own page is the only thing this choice ever opens: an
// allowlist, not the raw field, so a forged value can at most bounce the
// redirect to another known page in this app, never off-site.
async function readReturnRoute(request: Request): Promise<ExportReturnRoute> {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    !contentType.includes("multipart/form-data") &&
    !contentType.includes("application/x-www-form-urlencoded")
  ) {
    return DEFAULT_RETURN_ROUTE;
  }
  try {
    const formData = await request.formData();
    const from = formData.get("from");
    return isExportReturnRoute(from) ? from : DEFAULT_RETURN_ROUTE;
  } catch {
    return DEFAULT_RETURN_ROUTE;
  }
}

// POST-only already keeps SameSite=Lax cookies from being sent cross-site;
// this refuses any cross-site submit outright as a second line of defense.
// "none" is a user-initiated navigation (typed or bookmarked URL).
function isCrossSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}

// The household's own calendar day (CLAUDE.md: dates are displayed in the
// household's time zone), not UTC's — a household west of UTC can still be
// the day before at midnight UTC.
function exportFilename(exportedAt: Date, timeZone: string): string {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone }).format(exportedAt);
  return `feudo-meus-dados-${date}.json`;
}

export type ExportRequestDeps = {
  getSession: () => Promise<HouseholdSession>;
  now: () => Date;
  householdTimeZone: (session: HouseholdSession) => Promise<string>;
  recordAccessWithinQuota: (
    session: HouseholdSession,
    kind: "export",
    quota: { limit: number; since: Date },
    read: () => Promise<ExportDocument>,
  ) => Promise<{ status: "ok"; value: ExportDocument } | { status: "limited" }>;
  buildExportDocument: (session: HouseholdSession, exportedAt: Date) => Promise<ExportDocument>;
};

async function defaultHouseholdTimeZone(session: HouseholdSession): Promise<string> {
  const settings = await getHouseholdSettings(householdScope(session), getDb());
  return settings?.timeZone ?? DEFAULT_TIME_ZONE;
}

const defaultExportRequestDeps: ExportRequestDeps = {
  getSession: requireHouseholdSessionForDataRights,
  now: () => new Date(),
  householdTimeZone: defaultHouseholdTimeZone,
  recordAccessWithinQuota,
  buildExportDocument,
};

// ADR-0008 (amended 2026-10-03, #25): the limit check, the read and the
// audit write are one atomic step (recordAccessWithinQuota, in the audit
// slice) so a burst of concurrent requests can never all pass; this
// function only decides what to do with the outcome. A failed audit write
// throws inside that step, before any response is constructed, so a
// request that cannot be witnessed never serves a file.
export async function handleExportRequest(
  request: Request,
  overrides: Partial<ExportRequestDeps> = {},
): Promise<Response> {
  if (isCrossSiteRequest(request.headers)) {
    return new Response(null, { status: 403 });
  }

  const deps = { ...defaultExportRequestDeps, ...overrides };
  const returnRoute = await readReturnRoute(request);
  const session = await deps.getSession();
  const exportedAt = deps.now();
  const since = new Date(exportedAt.getTime() - EXPORT_RATE_LIMIT_WINDOW_MS);
  const timeZone = await deps.householdTimeZone(session);

  const outcome = await deps.recordAccessWithinQuota(
    session,
    "export",
    { limit: EXPORT_RATE_LIMIT, since },
    () => deps.buildExportDocument(session, exportedAt),
  );

  if (outcome.status === "limited") {
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL(`${returnRoute}?exportacao=limite`, request.url).toString(),
      },
    });
  }

  return new Response(streamExportDocument(outcome.value), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(exportedAt, timeZone)}"`,
      "Cache-Control": "no-store",
    },
  });
}
