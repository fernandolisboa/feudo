import { describe, expect, it, vi } from "vitest";

import { TERMS_VERSION } from "@/modules/auth";
import type { HouseholdSession } from "@/modules/households";

import type { ExportDocument } from "./export";
import {
  EXPORT_RATE_LIMIT,
  EXPORT_RATE_LIMIT_WINDOW_MS,
  handleExportRequest,
  type ExportRequestDeps,
} from "./export-request";

const SESSION: HouseholdSession = {
  userId: "user-1",
  name: "Ana",
  email: "ana@example.com",
  householdId: "household-1",
  theme: "caderno",
  termsVersion: TERMS_VERSION,
};

const EXPORTED_AT = new Date("2026-10-03T12:00:00Z");

const EMPTY_DOCUMENT: ExportDocument = {
  formatVersion: 1,
  exportedAt: EXPORTED_AT.toISOString(),
  user: {
    id: SESSION.userId,
    name: SESSION.name,
    email: SESSION.email,
    emailVerified: true,
    createdAt: EXPORTED_AT.toISOString(),
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: EXPORTED_AT.toISOString(),
    theme: "caderno",
  },
  sessions: [],
  tours: { autoStart: true, items: [] },
  households: [],
  providerCredentials: [],
  bankConnectionConsents: [],
  bankConnections: [],
  accounts: [],
  transactions: [],
  annotations: {
    categorizations: [],
    internalTransferMarks: [],
    categorizationRules: [],
    reserveMarks: [],
  },
  financialDataAccess: [],
  pushSubscriptions: [],
};

function deps(overrides: Partial<ExportRequestDeps> = {}): Partial<ExportRequestDeps> {
  const buildExportDocument =
    overrides.buildExportDocument ?? vi.fn().mockResolvedValue(EMPTY_DOCUMENT);
  return {
    getSession: vi.fn().mockResolvedValue(SESSION),
    now: () => EXPORTED_AT,
    householdTimeZone: vi.fn().mockResolvedValue("America/Sao_Paulo"),
    recordAccessWithinQuota: vi
      .fn()
      .mockImplementation(
        async (
          _session: unknown,
          _kind: unknown,
          _quota: unknown,
          read: () => Promise<ExportDocument>,
        ) => ({
          status: "ok",
          value: await read(),
        }),
      ),
    buildExportDocument,
    ...overrides,
  };
}

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://feudo.example/api/export", { method: "POST", headers });
}

function formRequest(from: string): Request {
  return new Request("https://feudo.example/api/export", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `from=${encodeURIComponent(from)}`,
  });
}

describe("handleExportRequest", () => {
  it("refuses a cross-site request before touching the session or the database", async () => {
    const getSession = vi.fn();
    const response = await handleExportRequest(
      request({ "sec-fetch-site": "cross-site" }),
      deps({ getSession }),
    );

    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
  });

  it.each(["same-origin", "none"])("allows a %s request through", async (site) => {
    const response = await handleExportRequest(request({ "sec-fetch-site": site }), deps());
    expect(response.status).toBe(200);
  });

  it("allows a request with no Sec-Fetch-Site header at all", async () => {
    const response = await handleExportRequest(request(), deps());
    expect(response.status).toBe(200);
  });

  it("redirects with 303 once the user has reached the rate limit, reading nothing", async () => {
    const buildExportDocument = vi.fn();
    const recordAccessWithinQuota = vi.fn().mockResolvedValue({ status: "limited" });
    const response = await handleExportRequest(
      request(),
      deps({ recordAccessWithinQuota, buildExportDocument }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "https://feudo.example/preferencias?exportacao=limite",
    );
    expect(buildExportDocument).not.toHaveBeenCalled();
  });

  it("redirects to the submitted return route when it is on the allowlist", async () => {
    const recordAccessWithinQuota = vi.fn().mockResolvedValue({ status: "limited" });
    const response = await handleExportRequest(
      formRequest("/aceitar-termos"),
      deps({ recordAccessWithinQuota }),
    );

    expect(response.headers.get("Location")).toBe(
      "https://feudo.example/aceitar-termos?exportacao=limite",
    );
  });

  it("falls back to /preferencias when the submitted return route is not on the allowlist", async () => {
    const recordAccessWithinQuota = vi.fn().mockResolvedValue({ status: "limited" });
    const response = await handleExportRequest(
      formRequest("https://evil.example"),
      deps({ recordAccessWithinQuota }),
    );

    expect(response.headers.get("Location")).toBe(
      "https://feudo.example/preferencias?exportacao=limite",
    );
  });

  it("returns the document as a downloadable, never-cached JSON file", async () => {
    const response = await handleExportRequest(request(), deps());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="feudo-meus-dados-2026-10-03.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.parse(await response.text())).toEqual(EMPTY_DOCUMENT);
  });

  it("names the file using the household's own time zone, not UTC", async () => {
    const lateUtc = new Date("2026-10-04T01:30:00Z");
    const householdTimeZone = vi.fn().mockResolvedValue("America/Sao_Paulo");
    const response = await handleExportRequest(
      request(),
      deps({ now: () => lateUtc, householdTimeZone }),
    );

    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="feudo-meus-dados-2026-10-03.json"',
    );
  });

  it("gives recordAccessWithinQuota the session, the export kind, the quota window and a read that builds the document", async () => {
    const buildExportDocument = vi.fn().mockResolvedValue(EMPTY_DOCUMENT);
    const recordAccessWithinQuota = vi
      .fn()
      .mockImplementation(
        async (
          session: unknown,
          kind: unknown,
          quota: { limit: number; since: Date },
          read: () => Promise<ExportDocument>,
        ) => {
          expect(session).toEqual(SESSION);
          expect(kind).toBe("export");
          expect(quota).toEqual({
            limit: EXPORT_RATE_LIMIT,
            since: new Date(EXPORTED_AT.getTime() - EXPORT_RATE_LIMIT_WINDOW_MS),
          });
          return { status: "ok", value: await read() };
        },
      );

    const response = await handleExportRequest(
      request(),
      deps({ buildExportDocument, recordAccessWithinQuota }),
    );

    expect(response.status).toBe(200);
    expect(buildExportDocument).toHaveBeenCalledWith(SESSION, EXPORTED_AT);
  });

  it("fails the request and serves no file when the quota/audit step fails", async () => {
    const recordAccessWithinQuota = vi.fn().mockRejectedValue(new Error("audit write failed"));

    await expect(handleExportRequest(request(), deps({ recordAccessWithinQuota }))).rejects.toThrow(
      "audit write failed",
    );
  });
});
