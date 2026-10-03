import { countRecentExports, recordFinancialDataAccess } from "@/modules/audit";
import { requireHouseholdSessionForDataRights, type HouseholdSession } from "@/modules/households";

import { buildExportDocument, type ExportDocument } from "./export";

export const EXPORT_RATE_LIMIT = 3;
export const EXPORT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const EXPORT_RATE_LIMIT_ROUTE = "/preferencias?exportacao=limite";

// POST-only already keeps SameSite=Lax cookies from being sent cross-site;
// this refuses any cross-site submit outright as a second line of defense.
// "none" is a user-initiated navigation (typed or bookmarked URL).
function isCrossSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}

function exportFilename(exportedAt: Date): string {
  return `feudo-meus-dados-${exportedAt.toISOString().slice(0, 10)}.json`;
}

export type ExportRequestDeps = {
  getSession: () => Promise<HouseholdSession>;
  now: () => Date;
  countRecentExports: (session: HouseholdSession, since: Date) => Promise<number>;
  buildExportDocument: (session: HouseholdSession, exportedAt: Date) => Promise<ExportDocument>;
  recordExportAccess: (session: HouseholdSession) => Promise<void>;
};

const defaultExportRequestDeps: ExportRequestDeps = {
  getSession: requireHouseholdSessionForDataRights,
  now: () => new Date(),
  countRecentExports,
  buildExportDocument,
  recordExportAccess: (session) => recordFinancialDataAccess(session, "export"),
};

// ADR-0008 (amended 2026-10-03, #25): limit check, then the read, then the
// audit write, then the file — in that order. A failed audit write throws
// here, after the document is already built but before any response is
// constructed, so a request that cannot be witnessed never serves a file.
export async function handleExportRequest(
  request: Request,
  overrides: Partial<ExportRequestDeps> = {},
): Promise<Response> {
  if (isCrossSiteRequest(request.headers)) {
    return new Response(null, { status: 403 });
  }

  const deps = { ...defaultExportRequestDeps, ...overrides };
  const session = await deps.getSession();
  const exportedAt = deps.now();
  const since = new Date(exportedAt.getTime() - EXPORT_RATE_LIMIT_WINDOW_MS);

  const recentExports = await deps.countRecentExports(session, since);
  if (recentExports >= EXPORT_RATE_LIMIT) {
    return new Response(null, {
      status: 303,
      headers: { Location: new URL(EXPORT_RATE_LIMIT_ROUTE, request.url).toString() },
    });
  }

  const document = await deps.buildExportDocument(session, exportedAt);
  await deps.recordExportAccess(session);

  return new Response(`${JSON.stringify(document, null, 2)}\n`, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(exportedAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}
